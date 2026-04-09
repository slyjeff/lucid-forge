package dev.lucidforge.jetbrains.git

import com.intellij.openapi.project.Project
import java.io.File
import java.nio.charset.StandardCharsets

/**
 * Git operations the plugin needs:
 *   - retrieve a file's content at the feature's baseCommit (for diff)
 *   - read a file from the working tree (for diff)
 *   - stage and commit a set of files (for approval)
 *
 * We shell out to the `git` binary directly. Every project under VCS already has it,
 * and ProcessBuilder is dependency-free — no git4idea API surface to chase.
 */
object GitOps {

    fun getFileAtCommit(project: Project, commit: String, relativePath: String): String? {
        val root = projectRoot(project) ?: return null
        // Use forward slashes for git regardless of OS
        val ref = "$commit:${relativePath.replace('\\', '/')}"
        val (exit, out) = run(root, listOf("git", "show", ref))
        return if (exit == 0) out else null
    }

    fun readWorkingTree(project: Project, relativePath: String): String? {
        val root = projectRoot(project) ?: return null
        val file = File(root, relativePath)
        return if (file.exists()) file.readText(StandardCharsets.UTF_8) else null
    }

    /** Stages the given paths and creates a commit. Returns true on success. */
    fun commit(project: Project, relativePaths: List<String>, message: String): Boolean {
        val root = projectRoot(project) ?: return false
        if (relativePaths.isEmpty()) return false

        val addCmd = mutableListOf("git", "add", "--")
        addCmd.addAll(relativePaths)
        if (run(root, addCmd).first != 0) return false

        return run(root, listOf("git", "commit", "-m", message)).first == 0
    }

    private fun projectRoot(project: Project): File? =
        project.basePath?.let { File(it) }?.takeIf { it.isDirectory }

    private fun run(workingDir: File, command: List<String>): Pair<Int, String> {
        return try {
            val process = ProcessBuilder(command)
                .directory(workingDir)
                .redirectErrorStream(true)
                .start()
            val output = process.inputStream.bufferedReader(StandardCharsets.UTF_8).readText()
            val exit = process.waitFor()
            exit to output
        } catch (e: Exception) {
            -1 to (e.message ?: "")
        }
    }
}
