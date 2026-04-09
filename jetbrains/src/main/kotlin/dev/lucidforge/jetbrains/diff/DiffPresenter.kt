package dev.lucidforge.jetbrains.diff

import com.intellij.diff.DiffContentFactory
import com.intellij.diff.DiffManager
import com.intellij.diff.requests.SimpleDiffRequest
import com.intellij.openapi.fileTypes.FileTypeManager
import com.intellij.openapi.project.Project
import dev.lucidforge.jetbrains.git.GitOps
import dev.lucidforge.jetbrains.model.ChangedFile

/**
 * Builds a SimpleDiffRequest comparing baseCommit content vs working-tree content
 * and hands it to the IDE's native diff viewer.
 */
object DiffPresenter {

    fun show(project: Project, baseCommit: String, file: ChangedFile) {
        val factory = DiffContentFactory.getInstance()
        val fileType = FileTypeManager.getInstance().getFileTypeByFileName(file.path)

        val isAdd = file.category == "add"
        val isDelete = file.category == "delete"

        val oldText = if (isAdd) "" else GitOps.getFileAtCommit(project, baseCommit, file.path) ?: ""
        val newText = if (isDelete) "" else GitOps.readWorkingTree(project, file.path) ?: ""

        val left = factory.create(project, oldText, fileType)
        val right = factory.create(project, newText, fileType)

        val title = file.path
        val request = SimpleDiffRequest(title, left, right, "Base ($baseCommit)", "Working tree")
        DiffManager.getInstance().showDiff(project, request)
    }
}
