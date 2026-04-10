package dev.lucidforge.jetbrains.toolwindow

import com.intellij.icons.AllIcons
import com.intellij.openapi.components.service
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.fileEditor.FileEditorManagerEvent
import com.intellij.openapi.fileEditor.FileEditorManagerListener
import com.intellij.openapi.fileEditor.TextEditorWithPreview
import com.intellij.openapi.fileTypes.FileTypeManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.ComboBox
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.testFramework.LightVirtualFile
import com.intellij.ui.CheckBoxList
import com.intellij.ui.CheckBoxListListener
import com.intellij.ui.SimpleListCellRenderer
import com.intellij.ui.components.JBScrollPane
import com.intellij.util.ui.UIUtil
import dev.lucidforge.jetbrains.access.TextEditorPreviewBridge
import dev.lucidforge.jetbrains.diff.DiffPresenter
import dev.lucidforge.jetbrains.model.ChangedFile
import dev.lucidforge.jetbrains.model.Feature
import dev.lucidforge.jetbrains.model.Issue
import dev.lucidforge.jetbrains.model.Review
import dev.lucidforge.jetbrains.model.Step
import dev.lucidforge.jetbrains.service.FeatureService
import java.awt.BorderLayout
import java.awt.Font
import java.awt.GridBagConstraints
import java.awt.GridBagLayout
import java.awt.Insets
import java.awt.event.MouseAdapter
import java.awt.event.MouseEvent
import javax.swing.BorderFactory
import javax.swing.Box
import javax.swing.BoxLayout
import javax.swing.JCheckBox
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.JToggleButton
import javax.swing.KeyStroke
import javax.swing.ListSelectionModel

/**
 * Minimal navigation panel: pick a feature, pick a step, double-click a file
 * to see its diff in the main editor area. Each file has a checkbox to mark it
 * as viewed (persisted to the step JSON). The "Group by folder" toggle clusters
 * files under bold parent-folder headers.
 */
class LucidForgeNavigationPanel(private val project: Project) : JPanel(BorderLayout()) {

    private val service = project.service<FeatureService>()

    private val featureCombo = ComboBox<Feature>().apply {
        renderer = SimpleListCellRenderer.create("") { f -> f.name }
    }
    private val stepCombo = ComboBox<Step>().apply {
        renderer = SimpleListCellRenderer.create("") { s -> s.title }
    }

    private val discoveryBtn = JToggleButton("Discovery").apply {
        addActionListener { openDocFor { f -> service.discoveryFile(f.id) } }
    }
    private val planBtn = JToggleButton("Plan").apply {
        addActionListener { openDocFor { f -> service.planFile(f.id) } }
    }
    private val issuesBtn = JToggleButton("Issues").apply {
        addActionListener { openIssues() }
    }
    private val insightsBtn = JToggleButton("Insights").apply {
        addActionListener { openInsights() }
    }

    private val groupByFolderCheckBox = JCheckBox("Group by folder").apply {
        addActionListener { reloadFiles() }
    }

    /**
     * Cache of generated in-memory markdown files (Issues, per-step Insights). Keyed
     * by a stable string so reopening focuses the existing tab; content is regenerated
     * fresh on each open in case the underlying artifacts changed.
     */
    private val generatedDocs = mutableMapOf<String, LightVirtualFile>()

    /** Rows currently shown in the file list. Headers and items intermixed when grouped. */
    private var currentRows: List<FileRow> = emptyList()

    private val fileList = FileRowCheckBoxList(
        rowsSupplier = { currentRows },
        groupedSupplier = { groupByFolderCheckBox.isSelected },
    ).apply {
        selectionMode = ListSelectionModel.SINGLE_SELECTION
        setCheckBoxListListener(CheckBoxListListener { index, _ ->
            val row = currentRows.getOrNull(index) as? FileRow.Item ?: return@CheckBoxListListener
            val feature = featureCombo.selectedItem as? Feature ?: return@CheckBoxListListener
            val step = stepCombo.selectedItem as? Step ?: return@CheckBoxListListener
            service.toggleViewed(feature.id, step.order, row.file.path)
        })
    }

    init {
        add(buildSelectorBar(), BorderLayout.NORTH)
        add(buildFileListSection(), BorderLayout.CENTER)

        featureCombo.addActionListener { reloadSteps() }
        stepCombo.addActionListener { reloadFiles() }

        fileList.addMouseListener(object : MouseAdapter() {
            override fun mouseClicked(e: MouseEvent) {
                if (e.clickCount != 1) return
                val index = fileList.locationToIndex(e.point)
                if (index < 0) return
                val bounds = fileList.getCellBounds(index, index) ?: return
                if (fileList.isInCheckboxZone(e.x - bounds.x, index)) return
                openSelectedDiff()
            }
        })
        fileList.registerKeyboardAction(
            { openSelectedDiff() },
            KeyStroke.getKeyStroke(java.awt.event.KeyEvent.VK_ENTER, 0),
            JComponent.WHEN_FOCUSED,
        )

        // Track which editor tab is active so the Discovery / Plan toggles reflect it.
        // Connection lifetime is the project — the panel is created once per project
        // by the tool window factory, so this isn't a leak.
        project.messageBus.connect(project).subscribe(
            FileEditorManagerListener.FILE_EDITOR_MANAGER,
            object : FileEditorManagerListener {
                override fun selectionChanged(event: FileEditorManagerEvent) {
                    syncDocToggleStates(event.newFile)
                }
            },
        )

        reloadFeatures()
    }

    private fun buildSelectorBar(): JPanel {
        val panel = JPanel(GridBagLayout())
        panel.border = BorderFactory.createEmptyBorder(6, 8, 6, 8)
        val c = GridBagConstraints().apply {
            fill = GridBagConstraints.HORIZONTAL
            insets = Insets(2, 0, 2, 4)
        }
        c.gridx = 0; c.gridy = 0; c.weightx = 0.0
        panel.add(JLabel("Feature:"), c)
        c.gridx = 1; c.weightx = 1.0
        panel.add(featureCombo, c)

        // Discovery / Plan / Issues buttons live between Feature and Step.
        val docRow = JPanel().apply {
            layout = BoxLayout(this, BoxLayout.LINE_AXIS)
            isOpaque = false
            add(discoveryBtn)
            add(Box.createHorizontalStrut(4))
            add(planBtn)
            add(Box.createHorizontalStrut(4))
            add(issuesBtn)
            add(Box.createHorizontalGlue())
        }
        c.gridx = 0; c.gridy = 1; c.weightx = 0.0
        panel.add(JLabel(""), c)
        c.gridx = 1; c.weightx = 1.0
        panel.add(docRow, c)

        c.gridx = 0; c.gridy = 2; c.weightx = 0.0
        panel.add(JLabel("Step:"), c)
        c.gridx = 1; c.weightx = 1.0
        panel.add(stepCombo, c)
        return panel
    }

    private fun buildFileListSection(): JPanel {
        val toolbar = JPanel().apply {
            layout = BoxLayout(this, BoxLayout.LINE_AXIS)
            border = BorderFactory.createEmptyBorder(2, 8, 2, 8)
            add(insightsBtn)
            add(Box.createHorizontalStrut(8))
            add(groupByFolderCheckBox)
            add(Box.createHorizontalGlue())
        }
        return JPanel(BorderLayout()).apply {
            add(toolbar, BorderLayout.NORTH)
            add(JBScrollPane(fileList), BorderLayout.CENTER)
        }
    }

    fun reloadFeatures() {
        val previouslySelectedId = (featureCombo.selectedItem as? Feature)?.id
        val features = service.listFeatures()
        featureCombo.removeAllItems()
        features.forEach { featureCombo.addItem(it) }
        if (features.isEmpty()) {
            stepCombo.removeAllItems()
            currentRows = emptyList()
            fileList.clear()
            updateDocButtons(null)
            return
        }
        val toSelect = features.firstOrNull { it.id == previouslySelectedId } ?: features.first()
        featureCombo.selectedItem = toSelect
    }

    private fun reloadSteps() {
        val feature = featureCombo.selectedItem as? Feature
        stepCombo.removeAllItems()
        currentRows = emptyList()
        fileList.clear()
        updateDocButtons(feature)
        // Doc toggle highlight depends on the current feature, so re-evaluate against
        // whatever tab is currently active.
        syncDocToggleStates(FileEditorManager.getInstance(project).selectedEditor?.file)
        if (feature == null) return
        val steps = service.listSteps(feature.id)
        steps.forEach { stepCombo.addItem(it) }
        if (steps.isNotEmpty()) stepCombo.selectedIndex = 0
    }

    private fun updateDocButtons(feature: Feature?) {
        discoveryBtn.isEnabled = feature != null && service.discoveryFile(feature.id) != null
        planBtn.isEnabled = feature != null && service.planFile(feature.id) != null
        issuesBtn.isEnabled = feature != null && service.readReview(feature.id) != null
    }

    private fun updateInsightsButton() {
        // Insights are per-step, so the button is only meaningful when a step is selected.
        insightsBtn.isEnabled = (stepCombo.selectedItem as? Step) != null
    }

    private fun openDocFor(pathPicker: (Feature) -> java.nio.file.Path?) {
        val feature = featureCombo.selectedItem as? Feature ?: return
        val path = pathPicker(feature) ?: return
        val vf = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(path) ?: return

        // Default the markdown split editor to preview-only mode. Setting this user
        // data key on the VirtualFile before openFile() is the public way to seed
        // the initial layout — TextEditorWithPreview reads it during construction.
        // No dependency on the Markdown plugin needed since the key lives in the
        // platform.
        vf.putUserData(
            TextEditorPreviewBridge.DEFAULT_LAYOUT_FOR_FILE,
            TextEditorWithPreview.Layout.SHOW_PREVIEW,
        )

        FileEditorManager.getInstance(project).openFile(vf, true)
    }

    private fun openIssues() {
        val feature = featureCombo.selectedItem as? Feature ?: return
        val review = service.readReview(feature.id) ?: return
        openGenerated(
            cacheKey = "issues/${feature.id}",
            displayName = "${feature.name} — Issues.md",
            content = renderIssuesMarkdown(review),
        )
    }

    private fun openInsights() {
        val feature = featureCombo.selectedItem as? Feature ?: return
        val step = stepCombo.selectedItem as? Step ?: return
        openGenerated(
            cacheKey = "insights/${feature.id}/${step.order}",
            displayName = "${feature.name} — ${step.title} Insights.md",
            content = renderInsightsMarkdown(step),
        )
    }

    /**
     * Open (or refocus) a generated markdown tab in the main editor area. The content
     * is written into a LightVirtualFile cached by [cacheKey], and refreshed on every
     * call so the tab always shows the latest data. Opens in preview mode.
     */
    private fun openGenerated(cacheKey: String, displayName: String, content: String) {
        val mdType = FileTypeManager.getInstance().getFileTypeByFileName("x.md")
        val vf = generatedDocs.getOrPut(cacheKey) {
            LightVirtualFile(displayName, mdType, content).apply {
                putUserData(
                    TextEditorPreviewBridge.DEFAULT_LAYOUT_FOR_FILE,
                    TextEditorWithPreview.Layout.SHOW_PREVIEW,
                )
            }
        }
        if (vf.content.toString() != content) {
            vf.setContent(null, content, false)
        }
        FileEditorManager.getInstance(project).openFile(vf, true)
    }

    /**
     * Highlight whichever doc toggle matches the currently active editor tab. Driven
     * by FileEditorManagerListener so closing or switching tabs updates the toggles
     * automatically. Handles both on-disk markdown (Discovery, Plan) and in-memory
     * generated docs (Issues, Insights — compared by reference).
     */
    private fun syncDocToggleStates(activeFile: VirtualFile?) {
        val feature = featureCombo.selectedItem as? Feature
        val step = stepCombo.selectedItem as? Step
        val activePath = activeFile?.path?.replace('\\', '/')
        val discoveryPath = feature?.let { service.discoveryFile(it.id) }?.toString()?.replace('\\', '/')
        val planPath = feature?.let { service.planFile(it.id) }?.toString()?.replace('\\', '/')

        discoveryBtn.isSelected = activePath != null && activePath == discoveryPath
        planBtn.isSelected = activePath != null && activePath == planPath

        val issuesVf = feature?.let { generatedDocs["issues/${it.id}"] }
        val insightsVf = if (feature != null && step != null) {
            generatedDocs["insights/${feature.id}/${step.order}"]
        } else null

        issuesBtn.isSelected = activeFile != null && activeFile === issuesVf
        insightsBtn.isSelected = activeFile != null && activeFile === insightsVf
    }

    private fun reloadFiles() {
        currentRows = emptyList()
        fileList.clear()
        updateInsightsButton()
        // Insights toggle highlight depends on the current step.
        syncDocToggleStates(FileEditorManager.getInstance(project).selectedEditor?.file)
        val feature = featureCombo.selectedItem as? Feature ?: return
        val step = stepCombo.selectedItem as? Step ?: return

        val files = step.changeMap.files
        val viewed = service.viewedFiles(feature.id, step.order)

        val rows = if (groupByFolderCheckBox.isSelected) {
            files
                .groupBy { parentFolder(it.path) }
                .toSortedMap(compareBy { it })
                .flatMap { (folder, group) ->
                    val sorted = group.sortedBy { fileName(it.path).lowercase() }
                    listOf<FileRow>(FileRow.Header(folder)) + sorted.map { FileRow.Item(it) }
                }
        } else {
            files.map { FileRow.Item(it) }
        }
        currentRows = rows

        rows.forEach { row ->
            when (row) {
                is FileRow.Header -> fileList.addItem(row, row.folder, false)
                is FileRow.Item -> fileList.addItem(row, fileName(row.file.path), row.file.path in viewed)
            }
        }
    }

    private fun openSelectedDiff() {
        val feature = featureCombo.selectedItem as? Feature ?: return
        val row = currentRows.getOrNull(fileList.selectedIndex) as? FileRow.Item ?: return
        DiffPresenter.show(project, feature.baseCommit, row.file)
    }
}

private fun fileName(path: String): String =
    path.substringAfterLast('/').substringAfterLast('\\')

private fun parentFolder(path: String): String {
    val normalized = path.replace('\\', '/')
    val lastSlash = normalized.lastIndexOf('/')
    return if (lastSlash <= 0) "(root)" else normalized.substring(0, lastSlash)
}

/** Just the last segment of a path like "src/models/auth" → "auth". */
private fun lastSegment(folder: String): String =
    folder.replace('\\', '/').substringAfterLast('/')

private fun renderInsightsMarkdown(step: Step): String = buildString {
    if (step.changeSummary.isNotBlank()) {
        appendLine("## Summary")
        appendLine()
        appendLine(step.changeSummary)
        appendLine()
    }
    if (step.patterns.isNotEmpty()) {
        appendLine("## Patterns")
        appendLine()
        step.patterns.forEach { p ->
            append("- **${p.name}**")
            if (p.description.isNotBlank()) append(" — ${p.description}")
            appendLine()
        }
    }
}

private fun renderIssuesMarkdown(review: Review): String = buildString {
    appendLine("# Code Review Issues")
    appendLine()
    if (review.issues.isEmpty()) {
        appendLine("_No issues reported._")
        return@buildString
    }
    val bySeverity = review.issues.groupBy { it.severity.lowercase() }
    listOf("error", "warning", "info").forEach { severity ->
        val items = bySeverity[severity].orEmpty()
        if (items.isEmpty()) return@forEach
        val heading = severity.replaceFirstChar { it.uppercase() } + "s"
        appendLine("## $heading")
        appendLine()
        items.forEach { issue ->
            renderIssue(issue)
        }
        appendLine()
    }
    // Catch any severities we don't recognize
    val unknown = bySeverity.keys - setOf("error", "warning", "info")
    unknown.forEach { severity ->
        appendLine("## ${severity.replaceFirstChar { it.uppercase() }}")
        appendLine()
        bySeverity[severity]?.forEach { renderIssue(it) }
        appendLine()
    }
}

private fun StringBuilder.renderIssue(issue: Issue) {
    val fixedTag = if (issue.fixed) " _(auto-fixed)_" else ""
    appendLine("- **${issue.file}** (step ${issue.step}, ${issue.agent})$fixedTag")
    appendLine("  - ${issue.description}")
}

private sealed class FileRow {
    data class Header(val folder: String) : FileRow()
    data class Item(val file: ChangedFile) : FileRow()
}

/**
 * CheckBoxList that renders [FileRow.Item] rows as checkbox + filetype-icon + name
 * (matching Solution Explorer's icon convention) and [FileRow.Header] rows as bold,
 * non-toggleable folder labels.
 */
private const val GROUPED_INDENT_PX = 14
private const val HIT_ZONE_TOLERANCE = 4
// Approximate checkbox icon width — CheckBoxList's getCheckBoxDimension
// returns roughly icon.width + margin.left, which is ~20 on most themes.
private const val CHECKBOX_ICON_WIDTH = 20

private class FileRowCheckBoxList(
    private val rowsSupplier: () -> List<FileRow>,
    private val groupedSupplier: () -> Boolean,
) : CheckBoxList<FileRow>() {

    /**
     * CheckBoxList calls this to convert a cell-relative click into a
     * checkbox-icon-relative point, which it then validates against the
     * checkbox icon's dimensions (~20×20). The default implementation
     * knows nothing about our custom layout, so when grouping shifts the
     * checkbox visually to the right, the hit zone stays at cell x=0 and
     * misses the actual icon. We subtract the indent so the returned
     * point lands inside the icon's coordinate space when the user clicks
     * on the shifted icon. Header rows return null so they stay
     * non-toggleable.
     */
    override fun findPointRelativeToCheckBox(
        x: Int,
        y: Int,
        checkBox: JCheckBox,
        index: Int,
    ): java.awt.Point? {
        val row = rowsSupplier().getOrNull(index)
        if (row !is FileRow.Item) return null
        val leftPad = if (groupedSupplier()) GROUPED_INDENT_PX else 0
        val cx = x - leftPad
        val cy = y
        return if (cx >= 0 && cy >= 0) java.awt.Point(cx, cy) else null
    }

    /**
     * Whether [relativeX] (from cell left edge) falls in the checkbox zone
     * for [index]. Mirrors CheckBoxList's internal check: the icon lives at
     * cell x ∈ [leftPad, leftPad + ~20]. Used by the mouse listener to
     * avoid opening the diff when the user clicks the checkbox.
     */
    fun isInCheckboxZone(relativeX: Int, index: Int): Boolean {
        val row = rowsSupplier().getOrNull(index)
        if (row !is FileRow.Item) return false
        val leftPad = if (groupedSupplier()) GROUPED_INDENT_PX else 0
        return relativeX in leftPad..(leftPad + CHECKBOX_ICON_WIDTH + HIT_ZONE_TOLERANCE)
    }

    override fun adjustRendering(
        rootComponent: JComponent,
        checkBox: JCheckBox,
        index: Int,
        selected: Boolean,
        hasFocus: Boolean,
    ): JComponent {
        val row = rowsSupplier().getOrNull(index) ?: return rootComponent
        val bg = if (selected) UIUtil.getListSelectionBackground(true) else UIUtil.getListBackground()
        val fg = if (selected) UIUtil.getListSelectionForeground(true) else UIUtil.getListForeground()

        return when (row) {
            is FileRow.Header -> renderHeader(row, bg, fg)
            is FileRow.Item -> renderItem(row, checkBox, bg, fg)
        }
    }

    private fun renderHeader(row: FileRow.Header, bg: java.awt.Color, fg: java.awt.Color): JComponent {
        val iconLabel = JLabel(AllIcons.Nodes.Folder).apply {
            border = BorderFactory.createEmptyBorder(0, 6, 0, 4)
        }
        val nameLabel = JLabel(lastSegment(row.folder)).apply {
            font = font.deriveFont(Font.BOLD)
            foreground = fg
            toolTipText = row.folder
        }
        val content = JPanel().apply {
            isOpaque = false
            layout = BoxLayout(this, BoxLayout.LINE_AXIS)
            add(iconLabel)
            add(nameLabel)
        }
        return JPanel(BorderLayout()).apply {
            isOpaque = true
            background = bg
            border = BorderFactory.createEmptyBorder(4, 0, 2, 0)
            add(content, BorderLayout.CENTER)
        }
    }

    private fun renderItem(
        row: FileRow.Item,
        checkBox: JCheckBox,
        bg: java.awt.Color,
        fg: java.awt.Color,
    ): JComponent {
        // Compute the display name from the row, not from checkBox.text — the
        // CheckBoxList reuses the same JCheckBox instance across paints, so any
        // mutation we make here persists. Reading and clearing checkBox.text
        // would lose the name on the second paint.
        val name = fileName(row.file.path)
        checkBox.text = ""
        checkBox.isOpaque = false
        checkBox.border = BorderFactory.createEmptyBorder()

        val icon = FileTypeManager.getInstance().getFileTypeByFileName(row.file.path).icon
        val iconLabel = JLabel(icon).apply {
            border = BorderFactory.createEmptyBorder(0, 2, 0, 4)
        }
        val nameLabel = JLabel(name).apply { foreground = fg }

        // Indent items under their headers when grouping is on. The click
        // handler compensates for this shift via findPointRelativeToCheckBox.
        val leftPad = if (groupedSupplier()) GROUPED_INDENT_PX else 0
        val center = JPanel().apply {
            isOpaque = false
            layout = BoxLayout(this, BoxLayout.LINE_AXIS)
            add(iconLabel)
            add(nameLabel)
        }
        return JPanel(BorderLayout()).apply {
            isOpaque = true
            background = bg
            border = BorderFactory.createEmptyBorder(0, leftPad, 0, 0)
            add(checkBox, BorderLayout.WEST)
            add(center, BorderLayout.CENTER)
        }
    }
}
