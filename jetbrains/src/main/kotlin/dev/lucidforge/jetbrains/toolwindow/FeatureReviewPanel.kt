package dev.lucidforge.jetbrains.toolwindow

import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.ui.OnePixelSplitter
import com.intellij.ui.components.JBList
import com.intellij.ui.components.JBScrollPane
import dev.lucidforge.jetbrains.diff.DiffPresenter
import dev.lucidforge.jetbrains.git.GitOps
import dev.lucidforge.jetbrains.model.ChangedFile
import dev.lucidforge.jetbrains.model.Feature
import dev.lucidforge.jetbrains.model.STATUS_APPROVED
import dev.lucidforge.jetbrains.model.STATUS_CANCELLED
import dev.lucidforge.jetbrains.model.STATUS_USER_REVIEW
import dev.lucidforge.jetbrains.model.Step
import dev.lucidforge.jetbrains.service.FeatureService
import java.awt.BorderLayout
import java.awt.Component
import java.awt.FlowLayout
import javax.swing.DefaultListModel
import javax.swing.JButton
import javax.swing.JLabel
import javax.swing.JList
import javax.swing.JPanel
import javax.swing.JTextArea
import javax.swing.ListCellRenderer
import javax.swing.ListSelectionModel

/**
 * Right pane: header + actions, step list, and (per selected step) a list of changed files.
 * Double-clicking a file opens IntelliJ's native diff viewer.
 */
class FeatureReviewPanel(
    private val project: Project,
    private val feature: Feature,
    private val service: FeatureService,
    private val onChanged: () -> Unit,
) : JPanel(BorderLayout()) {

    private val steps: List<Step> = service.listSteps(feature.id)
    private val stepListModel = DefaultListModel<Step>().also { m -> steps.forEach(m::addElement) }
    private val stepList = JBList(stepListModel).apply {
        selectionMode = ListSelectionModel.SINGLE_SELECTION
        cellRenderer = StepCellRenderer()
    }

    private val fileListModel = DefaultListModel<ChangedFile>()
    private val fileList = JBList(fileListModel).apply {
        selectionMode = ListSelectionModel.SINGLE_SELECTION
        cellRenderer = FileCellRenderer()
    }

    private val summaryArea = JTextArea().apply {
        isEditable = false
        lineWrap = true
        wrapStyleWord = true
        border = javax.swing.BorderFactory.createEmptyBorder(8, 8, 8, 8)
    }

    init {
        add(buildHeader(), BorderLayout.NORTH)

        val rightSplit = OnePixelSplitter(true, 0.5f).apply {
            firstComponent = JBScrollPane(fileList)
            secondComponent = JBScrollPane(summaryArea)
        }
        val mainSplit = OnePixelSplitter(false, 0.4f).apply {
            firstComponent = JBScrollPane(stepList)
            secondComponent = rightSplit
        }
        add(mainSplit, BorderLayout.CENTER)

        stepList.addListSelectionListener { e ->
            if (e.valueIsAdjusting) return@addListSelectionListener
            val s = stepList.selectedValue
            fileListModel.clear()
            if (s != null) {
                s.changeMap.files.forEach(fileListModel::addElement)
                summaryArea.text = s.changeSummary
            } else {
                summaryArea.text = ""
            }
        }

        fileList.addMouseListener(object : java.awt.event.MouseAdapter() {
            override fun mouseClicked(e: java.awt.event.MouseEvent) {
                if (e.clickCount == 2) {
                    val f = fileList.selectedValue ?: return
                    DiffPresenter.show(project, feature.baseCommit, f)
                }
            }
        })

        if (!stepListModel.isEmpty) stepList.selectedIndex = 0
    }

    private fun buildHeader(): JPanel {
        val header = JPanel(BorderLayout())
        val title = JLabel("<html><b>${feature.name}</b> &nbsp; <small>${feature.status}</small><br/><small>${feature.description}</small></html>")
        title.border = javax.swing.BorderFactory.createEmptyBorder(8, 8, 8, 8)
        header.add(title, BorderLayout.CENTER)

        val actions = JPanel(FlowLayout(FlowLayout.RIGHT))
        val approveBtn = JButton("Approve & Commit").apply {
            isEnabled = feature.status == STATUS_USER_REVIEW
            addActionListener { approve() }
        }
        val cancelBtn = JButton("Cancel Feature").apply {
            isEnabled = feature.status == STATUS_USER_REVIEW
            addActionListener { cancel() }
        }
        actions.add(approveBtn)
        actions.add(cancelBtn)
        header.add(actions, BorderLayout.EAST)
        return header
    }

    private fun approve() {
        val confirm = Messages.showYesNoDialog(
            project,
            "Stage all changed files and commit on branch '${feature.workingBranch}'?",
            "Approve Feature",
            Messages.getQuestionIcon(),
        )
        if (confirm != Messages.YES) return

        val paths = steps.flatMap { it.changeMap.files }
            .filter { it.category != "delete" }
            .map { it.path }
            .distinct()

        val message = "${feature.name}\n\n${feature.description}"
        val ok = GitOps.commit(project, paths, message)
        if (!ok) {
            Messages.showErrorDialog(project, "Git commit failed. Check the Version Control log.", "LucidForge")
            return
        }
        service.updateStatus(feature.id, STATUS_APPROVED)
        onChanged()
    }

    private fun cancel() {
        val confirm = Messages.showYesNoDialog(
            project,
            "Mark '${feature.name}' as cancelled? This does not revert files.",
            "Cancel Feature",
            Messages.getQuestionIcon(),
        )
        if (confirm != Messages.YES) return
        service.updateStatus(feature.id, STATUS_CANCELLED)
        onChanged()
    }
}

private class StepCellRenderer : ListCellRenderer<Step> {
    private val label = JLabel()
    override fun getListCellRendererComponent(
        list: JList<out Step>, value: Step, index: Int, isSelected: Boolean, cellHasFocus: Boolean,
    ): Component {
        label.text = "<html><b>${value.order + 1}. ${value.title}</b><br/><small>${value.agent} · ${value.status}</small></html>"
        label.isOpaque = true
        label.background = if (isSelected) list.selectionBackground else list.background
        label.foreground = if (isSelected) list.selectionForeground else list.foreground
        label.border = javax.swing.BorderFactory.createEmptyBorder(6, 8, 6, 8)
        return label
    }
}

private class FileCellRenderer : ListCellRenderer<ChangedFile> {
    private val label = JLabel()
    override fun getListCellRendererComponent(
        list: JList<out ChangedFile>, value: ChangedFile, index: Int, isSelected: Boolean, cellHasFocus: Boolean,
    ): Component {
        val tag = when (value.category) { "add" -> "[+]"; "delete" -> "[-]"; else -> "[~]" }
        label.text = "$tag ${value.path}"
        label.isOpaque = true
        label.background = if (isSelected) list.selectionBackground else list.background
        label.foreground = if (isSelected) list.selectionForeground else list.foreground
        label.border = javax.swing.BorderFactory.createEmptyBorder(4, 8, 4, 8)
        return label
    }
}
