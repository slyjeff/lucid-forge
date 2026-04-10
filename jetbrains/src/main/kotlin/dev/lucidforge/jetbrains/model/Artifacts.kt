package dev.lucidforge.jetbrains.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Feature(
    val schemaVersion: Int = 1,
    val id: String,
    val name: String,
    val description: String,
    val status: String,
    val sourceBranch: String,
    val workingBranch: String,
    val baseCommit: String,
    val createdAt: String,
    val hasUxDesign: Boolean = false,
    val stepCount: Int = 0,
    val usage: Usage? = null,
)

@Serializable
data class Usage(
    val discovery: PhaseUsage? = null,
    val planning: PhaseUsage? = null,
    val execution: PhaseUsage? = null,
    val review: PhaseUsage? = null,
    val totalCostUsd: Double = 0.0,
)

@Serializable
data class PhaseUsage(
    val inputTokens: Long = 0,
    val outputTokens: Long = 0,
    val costUsd: Double = 0.0,
)

@Serializable
data class Step(
    val order: Int,
    val agent: String,
    val title: String,
    val status: String,
    val tasks: List<Task> = emptyList(),
    val validation: Validation? = null,
    val changeMap: ChangeMap = ChangeMap(),
    val patterns: List<Pattern> = emptyList(),
    val changeSummary: String = "",
    val usage: PhaseUsage? = null,
    val viewedFiles: List<String> = emptyList(),
)

@Serializable
data class Task(val description: String, val completed: Boolean = false)

@Serializable
data class Validation(val passed: Boolean = false, val retries: Int = 0)

@Serializable
data class ChangeMap(
    val files: List<ChangedFile> = emptyList(),
    val connections: List<Connection> = emptyList(),
)

@Serializable
data class ChangedFile(
    val path: String,
    val category: String,
    val reasoning: String = "",
    val members: List<Member> = emptyList(),
)

@Serializable
data class Member(val name: String, val kind: String)

@Serializable
data class Connection(val from: String, val to: String, val relationship: String)

@Serializable
data class Pattern(val name: String, val description: String = "")

@Serializable
data class Review(
    val issues: List<Issue> = emptyList(),
    val usage: PhaseUsage? = null,
)

@Serializable
data class Issue(
    val severity: String,
    val step: Int,
    val agent: String,
    val file: String,
    val description: String,
    val fixed: Boolean = false,
)

const val STATUS_USER_REVIEW = "user-review"
const val STATUS_APPROVED = "approved"
const val STATUS_CANCELLED = "cancelled"

val DISPLAY_STATUSES = setOf(STATUS_USER_REVIEW, STATUS_APPROVED, STATUS_CANCELLED)
