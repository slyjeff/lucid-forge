package dev.lucidforge.jetbrains.service

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import dev.lucidforge.jetbrains.model.DISPLAY_STATUSES
import dev.lucidforge.jetbrains.model.Feature
import dev.lucidforge.jetbrains.model.Step
import kotlinx.serialization.json.Json
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.exists
import kotlin.io.path.isDirectory
import kotlin.io.path.listDirectoryEntries
import kotlin.io.path.name
import kotlin.io.path.readText

/**
 * Reads LucidForge artifact files from `.lucidforge/features/` at the project root.
 * No writing or AI here — pure consumer of the schema.
 */
@Service(Service.Level.PROJECT)
class FeatureService(private val project: Project) {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    fun lucidforgeRoot(): Path? {
        val base = project.basePath ?: return null
        val dir = Path.of(base, ".lucidforge", "features")
        return if (dir.exists() && dir.isDirectory()) dir else null
    }

    /** All features visible to the user (user-review / approved / cancelled). */
    fun listFeatures(): List<Feature> {
        val root = lucidforgeRoot() ?: return emptyList()
        return root.listDirectoryEntries()
            .filter { it.isDirectory() }
            .mapNotNull { readFeature(it) }
            .filter { it.status in DISPLAY_STATUSES }
            .sortedByDescending { it.createdAt }
    }

    fun readFeature(featureDir: Path): Feature? {
        val file = featureDir.resolve("feature.json")
        if (!file.exists()) return null
        return runCatching { json.decodeFromString<Feature>(file.readText()) }.getOrNull()
    }

    fun featureDir(featureId: String): Path? =
        lucidforgeRoot()?.resolve(featureId)?.takeIf { it.exists() }

    fun listSteps(featureId: String): List<Step> {
        val dir = featureDir(featureId)?.resolve("steps") ?: return emptyList()
        if (!dir.exists()) return emptyList()
        return dir.listDirectoryEntries("*.json")
            .sortedBy { it.name }
            .mapNotNull { p ->
                runCatching { json.decodeFromString<Step>(p.readText()) }.getOrNull()
            }
    }

    fun readDiscovery(featureId: String): String? =
        featureDir(featureId)?.resolve("discovery.md")?.takeIf { it.exists() }?.readText()

    fun readPlan(featureId: String): String? =
        featureDir(featureId)?.resolve("plan.md")?.takeIf { it.exists() }?.readText()

    /**
     * Updates feature.json status. Used by the Approve action after a successful commit,
     * and by Cancel. We rewrite the file in-place; the skill tolerates extra whitespace.
     */
    fun updateStatus(featureId: String, newStatus: String) {
        val file = featureDir(featureId)?.resolve("feature.json") ?: return
        if (!file.exists()) return
        val current = json.decodeFromString<Feature>(file.readText())
        val updated = current.copy(status = newStatus)
        Files.writeString(file, Json { prettyPrint = true }.encodeToString(Feature.serializer(), updated))
    }
}
