package dev.lucidforge.jetbrains.diff

import com.intellij.diff.DiffContentFactory
import com.intellij.diff.chains.SimpleDiffRequestChain
import com.intellij.diff.editor.ChainDiffVirtualFile
import com.intellij.diff.requests.SimpleDiffRequest
import com.intellij.diff.util.DiffNotificationProvider
import com.intellij.diff.util.DiffUserDataKeys
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileTypes.FileTypeManager
import com.intellij.openapi.project.Project
import com.intellij.ui.JBColor
import dev.lucidforge.jetbrains.git.GitOps
import dev.lucidforge.jetbrains.model.ChangedFile
import java.awt.BorderLayout
import javax.swing.BorderFactory
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.JTextArea

/**
 * Opens the IDE's native diff viewer for a changed file as an editor tab in
 * the main editor area. We wrap a SimpleDiffRequest in a SimpleDiffRequestChain
 * and ChainDiffVirtualFile so FileEditorManager can open it like any other file —
 * the user gets a real tab they can keep open, split, or close.
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

        val request = SimpleDiffRequest(file.path, left, right, "Base", "Working tree")

        // Attach the file's "why" reasoning as a notification banner above the diff
        // content. The banner travels with the diff tab and goes away when the tab
        // is closed. NOTIFICATION_PROVIDERS takes a list of DiffNotificationProvider
        // (a SAM that builds a JComponent given the active DiffViewer); we ignore
        // the viewer argument since the banner is static.
        if (file.reasoning.isNotBlank()) {
            val provider = DiffNotificationProvider { _ -> buildReasoningBanner(file.reasoning) }
            request.putUserData(
                DiffUserDataKeys.NOTIFICATION_PROVIDERS,
                listOf(provider),
            )
        }

        val chain = SimpleDiffRequestChain(listOf(request))
        val diffFile = ChainDiffVirtualFile(chain, file.path)
        FileEditorManager.getInstance(project).openFile(diffFile, true)
    }

    private fun buildReasoningBanner(reasoning: String): JComponent {
        val text = JTextArea(reasoning).apply {
            isEditable = false
            lineWrap = true
            wrapStyleWord = true
            isOpaque = false
            border = BorderFactory.createEmptyBorder(8, 12, 8, 12)
        }
        return JPanel(BorderLayout()).apply {
            background = JBColor.namedColor(
                "Notification.background",
                JBColor(0xfff8c5, 0x3d3223),
            )
            add(text, BorderLayout.CENTER)
        }
    }
}
