package dev.lucidforge.jetbrains.service

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import dev.lucidforge.jetbrains.model.Feature
import dev.lucidforge.jetbrains.model.Review
import dev.lucidforge.jetbrains.model.Step
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
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

    /** All features the skill has produced, regardless of lifecycle status. */
    fun listFeatures(): List<Feature> {
        val root = lucidforgeRoot() ?: return emptyList()
        return root.listDirectoryEntries()
            .filter { it.isDirectory() }
            .mapNotNull { readFeature(it) }
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

    /** Filesystem path to discovery.md if it exists, else null. */
    fun discoveryFile(featureId: String): Path? =
        featureDir(featureId)?.resolve("discovery.md")?.takeIf { it.exists() }

    /** Filesystem path to plan.md if it exists, else null. */
    fun planFile(featureId: String): Path? =
        featureDir(featureId)?.resolve("plan.md")?.takeIf { it.exists() }

    /** Parsed review.json (issues + usage) if present, else null. */
    fun readReview(featureId: String): Review? {
        val file = featureDir(featureId)?.resolve("review.json")?.takeIf { it.exists() } ?: return null
        return runCatching { json.decodeFromString<Review>(file.readText()) }.getOrNull()
    }

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

    /** Files marked as viewed for a step. Read fresh from disk so concurrent edits show. */
    fun viewedFiles(featureId: String, stepOrder: Int): Set<String> {
        val file = stepJsonFile(featureId, stepOrder) ?: return emptySet()
        val root = runCatching { Json.parseToJsonElement(file.readText()).jsonObject }.getOrNull()
            ?: return emptySet()
        val arr = root["viewedFiles"] as? JsonArray ?: return emptySet()
        return arr.mapNotNull { it.jsonPrimitive.contentOrNull }.toSet()
    }

    /**
     * Toggles a file's viewed state in the step JSON. Returns the new state (true = viewed).
     *
     * We parse to a JsonObject and mutate just the `viewedFiles` field, then write the
     * whole object back. This preserves any keys the skill writes that aren't in our
     * Kotlin Step model — re-serializing through Step.serializer() would silently drop
     * them because the deserializer is configured with ignoreUnknownKeys.
     */
    fun toggleViewed(featureId: String, stepOrder: Int, path: String): Boolean {
        val file = stepJsonFile(featureId, stepOrder) ?: return false
        val current = runCatching { Json.parseToJsonElement(file.readText()).jsonObject }
            .getOrNull() ?: return false

        val viewed = ((current["viewedFiles"] as? JsonArray)
            ?.mapNotNull { it.jsonPrimitive.contentOrNull }
            ?: emptyList())
            .toMutableList()

        val nowViewed = if (path in viewed) {
            viewed.remove(path)
            false
        } else {
            viewed.add(path)
            true
        }

        val updated = current.toMutableMap()
        updated["viewedFiles"] = JsonArray(viewed.map { JsonPrimitive(it) })
        Files.writeString(file, prettyJson.encodeToString(JsonObject.serializer(), JsonObject(updated)))
        return nowViewed
    }

    private fun stepJsonFile(featureId: String, stepOrder: Int): Path? {
        val dir = featureDir(featureId)?.resolve("steps") ?: return null
        if (!dir.exists()) return null
        val prefix = "%02d-".format(stepOrder)
        return dir.listDirectoryEntries("*.json").firstOrNull { it.name.startsWith(prefix) }
    }

    private val prettyJson = Json { prettyPrint = true; ignoreUnknownKeys = true }
}
