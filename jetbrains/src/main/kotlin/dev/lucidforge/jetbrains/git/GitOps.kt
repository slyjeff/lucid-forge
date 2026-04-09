package dev.lucidforge.jetbrains.git

import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import git4idea.GitUtil
import git4idea.commands.Git
import git4idea.commands.GitCommand
import git4idea.commands.GitLineHandler
import java.nio.file.Path

/**
 * Thin wrapper around git4idea for the operations the plugin needs:
 *   - retrieve a file's content at the feature's baseCommit (for diff)
 *   - stage and commit a set of files (for approval)
 *
 * git4idea handles credentials, line endings, and the project's VCS root for us.
 */
object GitOps {

    fun getFileAtCommit(project: Project, commit: String, relativePath: String): String? {
        val repo = repo(project) ?: return null
        val handler = GitLineHandler(project, repo.root, GitCommand.SHOW)
        handler.setSilent(true)
        handler.addParameters("$commit:$relativePath")
        val result = Git.getInstance().runCommand(handler)
        return if (result.success()) result.outputAsJoinedString else null
    }

    fun readWorkingTree(project: Project, relativePath: String): String? {
        val base = project.basePath ?: return null
        val abs = Path.of(base, relativePath)
        val vf = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(abs) ?: return null
        return runCatching { String(vf.contentsToByteArray(), Charsets.UTF_8) }.getOrNull()
    }

    /** Stages the given paths and creates a commit. Returns true on success. */
    fun commit(project: Project, relativePaths: List<String>, message: String): Boolean {
        val repo = repo(project) ?: return false
        val add = GitLineHandler(project, repo.root, GitCommand.ADD)
        add.addParameters("--")
        add.addParameters(*relativePaths.toTypedArray())
        if (!Git.getInstance().runCommand(add).success()) return false

        val commit = GitLineHandler(project, repo.root, GitCommand.COMMIT)
        commit.addParameters("-m", message)
        return Git.getInstance().runCommand(commit).success()
    }

    private fun repo(project: Project) =
        GitUtil.getRepositoryManager(project).repositories.firstOrNull()
}
