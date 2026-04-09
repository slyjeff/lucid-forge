package dev.lucidforge.jetbrains.toolwindow

import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.ui.OnePixelSplitter
import com.intellij.ui.components.JBList
import com.intellij.ui.components.JBScrollPane
import dev.lucidforge.jetbrains.model.Feature
import dev.lucidforge.jetbrains.service.FeatureService
import java.awt.BorderLayout
import java.awt.Component
import javax.swing.DefaultListModel
import javax.swing.JLabel
import javax.swing.JList
import javax.swing.JPanel
import javax.swing.ListCellRenderer
import javax.swing.ListSelectionModel

/**
 * Two-pane layout: feature list on the left, feature review on the right.
 * Selecting a feature swaps the right panel.
 */
class LucidForgePanel(private val project: Project) : JPanel(BorderLayout()) {

    private val service = project.service<FeatureService>()
    private val listModel = DefaultListModel<Feature>()
    private val featureList = JBList(listModel).apply {
        selectionMode = ListSelectionModel.SINGLE_SELECTION
        cellRenderer = FeatureCellRenderer()
    }
    private val splitter = OnePixelSplitter(false, 0.3f)
    private val rightPlaceholder = JPanel(BorderLayout()).apply {
        add(JLabel("Select a feature to review", JLabel.CENTER), BorderLayout.CENTER)
    }

    init {
        splitter.firstComponent = JBScrollPane(featureList)
        splitter.secondComponent = rightPlaceholder
        add(splitter, BorderLayout.CENTER)

        featureList.addListSelectionListener { e ->
            if (e.valueIsAdjusting) return@addListSelectionListener
            val selected = featureList.selectedValue
            splitter.secondComponent = if (selected != null) {
                FeatureReviewPanel(project, selected, service) { reload() }
            } else {
                rightPlaceholder
            }
        }

        reload()
    }

    fun reload() {
        val previouslySelected = featureList.selectedValue?.id
        listModel.clear()
        service.listFeatures().forEach { listModel.addElement(it) }
        if (previouslySelected != null) {
            for (i in 0 until listModel.size()) {
                if (listModel.getElementAt(i).id == previouslySelected) {
                    featureList.selectedIndex = i
                    return
                }
            }
        }
        if (!listModel.isEmpty) featureList.selectedIndex = 0
    }
}

private class FeatureCellRenderer : ListCellRenderer<Feature> {
    private val label = JLabel()
    override fun getListCellRendererComponent(
        list: JList<out Feature>, value: Feature, index: Int, isSelected: Boolean, cellHasFocus: Boolean,
    ): Component {
        label.text = "<html><b>${value.name}</b><br/><small>${value.status} · ${value.id}</small></html>"
        label.isOpaque = true
        label.background = if (isSelected) list.selectionBackground else list.background
        label.foreground = if (isSelected) list.selectionForeground else list.foreground
        label.border = javax.swing.BorderFactory.createEmptyBorder(6, 8, 6, 8)
        return label
    }
}
