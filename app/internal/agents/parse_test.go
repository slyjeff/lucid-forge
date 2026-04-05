package agents

import (
	"testing"
)

const sampleAgent = `---
name: Backend API
description: Handles REST endpoints and middleware
model: claude-sonnet-4-6
lucidforge: true
---

You are a backend API specialist. You own all REST endpoints and middleware.

## Directories

- src/endpoints/
- src/middleware/

## Instructions

Use dependency injection for all services.

## Learnings

The auth middleware must run before rate limiting.
`

func TestParseAgentFile_FullAgent(t *testing.T) {
	// Arrange / Act
	agent, err := ParseAgentFile(sampleAgent, "lf-backend-api.md")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agent.Name != "Backend API" {
		t.Errorf("expected name 'Backend API', got %q", agent.Name)
	}
	if agent.Description != "Handles REST endpoints and middleware" {
		t.Errorf("unexpected description: %q", agent.Description)
	}
	if agent.Model != "claude-sonnet-4-6" {
		t.Errorf("expected model 'claude-sonnet-4-6', got %q", agent.Model)
	}
	if !agent.LucidForge {
		t.Error("expected lucidforge to be true")
	}
	if agent.Identity != "You are a backend API specialist. You own all REST endpoints and middleware." {
		t.Errorf("unexpected identity: %q", agent.Identity)
	}
	if len(agent.Directories) != 2 {
		t.Fatalf("expected 2 directories, got %d", len(agent.Directories))
	}
	if agent.Directories[0] != "src/endpoints/" {
		t.Errorf("unexpected directory: %q", agent.Directories[0])
	}
	if agent.Instructions != "Use dependency injection for all services." {
		t.Errorf("unexpected instructions: %q", agent.Instructions)
	}
	if agent.Learnings != "The auth middleware must run before rate limiting." {
		t.Errorf("unexpected learnings: %q", agent.Learnings)
	}
	if agent.Filename != "lf-backend-api.md" {
		t.Errorf("unexpected filename: %q", agent.Filename)
	}
}

func TestParseAgentFile_EmptySections(t *testing.T) {
	// Arrange
	content := `---
name: General
model: claude-sonnet-4-6
lucidforge: true
---

You are the general agent.

## Directories

- src/

## Instructions

## Learnings
`

	// Act
	agent, err := ParseAgentFile(content, "lf-general.md")

	// Assert
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if agent.Instructions != "" {
		t.Errorf("expected empty instructions, got %q", agent.Instructions)
	}
	if agent.Learnings != "" {
		t.Errorf("expected empty learnings, got %q", agent.Learnings)
	}
}

func TestParseAgentFile_MissingFrontmatter(t *testing.T) {
	// Arrange
	content := "# Just a markdown file\nNo frontmatter here."

	// Act
	_, err := ParseAgentFile(content, "bad.md")

	// Assert
	if err == nil {
		t.Fatal("expected error for missing frontmatter")
	}
}

func TestSerializeAgent_RoundTrip(t *testing.T) {
	// Arrange
	agent, err := ParseAgentFile(sampleAgent, "lf-backend-api.md")
	if err != nil {
		t.Fatalf("parse error: %v", err)
	}

	// Act
	serialized := SerializeAgent(agent)
	reparsed, err := ParseAgentFile(serialized, "lf-backend-api.md")

	// Assert
	if err != nil {
		t.Fatalf("reparse error: %v", err)
	}
	if reparsed.Name != agent.Name {
		t.Errorf("name mismatch: %q vs %q", reparsed.Name, agent.Name)
	}
	if reparsed.Identity != agent.Identity {
		t.Errorf("identity mismatch: %q vs %q", reparsed.Identity, agent.Identity)
	}
	if len(reparsed.Directories) != len(agent.Directories) {
		t.Errorf("directory count mismatch: %d vs %d", len(reparsed.Directories), len(agent.Directories))
	}
	if reparsed.Instructions != agent.Instructions {
		t.Errorf("instructions mismatch: %q vs %q", reparsed.Instructions, agent.Instructions)
	}
	if reparsed.Learnings != agent.Learnings {
		t.Errorf("learnings mismatch: %q vs %q", reparsed.Learnings, agent.Learnings)
	}
}
