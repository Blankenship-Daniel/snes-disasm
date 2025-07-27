#!/bin/bash

# SNES Disassembler Project - GitHub Project Setup Script
# This script helps set up GitHub Issues and Project Board for implementation tracking

set -e  # Exit on any error

echo "🚀 SNES Disassembler Project Tracking Setup"
echo "============================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   macOS: brew install gh"
    echo "   Linux: https://cli.github.com/manual/installation"
    echo "   Windows: https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Please authenticate with GitHub first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Get repository information
REPO_INFO=$(gh repo view --json nameWithOwner,url)
REPO_NAME=$(echo $REPO_INFO | jq -r '.nameWithOwner')
REPO_URL=$(echo $REPO_INFO | jq -r '.url')

echo "📊 Working with repository: $REPO_NAME"
echo "🔗 Repository URL: $REPO_URL"
echo ""

# Confirm with user
read -p "Do you want to create GitHub Issues for the implementation tasks? (y/N): " confirm_issues
read -p "Do you want to create a GitHub Project Board? (y/N): " confirm_project

# Create labels first
echo "🏷️  Creating project labels..."

gh label create "high-priority" --color "d73a4a" --description "High priority task requiring immediate attention" || true
gh label create "medium-priority" --color "fbca04" --description "Medium priority task for next sprint" || true
gh label create "typescript" --color "007acc" --description "TypeScript related issue" || true
gh label create "cli" --color "28a745" --description "Command line interface related" || true
gh label create "testing" --color "6f42c1" --description "Testing and quality assurance" || true
gh label create "documentation" --color "0e8a16" --description "Documentation improvements" || true
gh label create "compilation" --color "e99695" --description "Build and compilation issues" || true
gh label create "refactoring" --color "fef2c0" --description "Code refactoring and cleanup" || true
gh label create "technical-debt" --color "d1ecf1" --description "Technical debt resolution" || true

echo "✅ Labels created successfully"

# Create issues if confirmed
if [[ $confirm_issues =~ ^[Yy]$ ]]; then
    echo "📝 Creating GitHub Issues..."
    
    # Issue 1: TypeScript Compilation Errors
    ISSUE_1=$(gh issue create \
        --title "[HIGH PRIORITY] Fix TypeScript Compilation Errors" \
        --label "bug,typescript,high-priority,compilation" \
        --body "## Problem Description
The project currently has TypeScript compilation errors that prevent successful builds and may cause runtime issues.

## Analysis Results
From our comprehensive code review, the following compilation issues were identified:
- Import/export mismatches
- Undefined properties in strict mode
- Type checking warnings

## Acceptance Criteria
- [ ] All TypeScript files compile without errors
- [ ] Build process (\`npm run build\`) completes successfully
- [ ] No type checking warnings in strict mode
- [ ] All tests pass after compilation fixes

## Estimated Effort
1-2 days

## Dependencies
None - this is a blocking issue for other tasks

## Implementation Notes
1. Run \`tsc --noEmit\` to identify all compilation errors
2. Fix import/export statements
3. Address undefined property errors
4. Ensure strict TypeScript compliance
5. Verify all tests still pass

## Definition of Done
- [ ] \`npm run build\` succeeds without errors
- [ ] \`npm test\` passes all tests  
- [ ] Code review completed and approved
- [ ] Changes merged to main branch")
    
    echo "✅ Created Issue #$ISSUE_1: TypeScript Compilation Errors"
    
    # Issue 2: CLI Implementation
    ISSUE_2=$(gh issue create \
        --title "[HIGH PRIORITY] Implement Missing CLI Functionality" \
        --label "feature,cli,high-priority,enhancement" \
        --body "## Problem Description
The \`src/cli/\` directory is empty, but the package.json references \`dist/cli.js\` as a binary executable. This breaks the CLI functionality for end users.

## Requirements
Based on our analysis, the CLI should support:
- Basic disassembly operations
- Asset extraction commands
- Analysis and reporting features
- Help documentation and usage examples

## Acceptance Criteria
- [ ] Create functional CLI implementation in \`src/cli/\`
- [ ] Ensure \`dist/cli.js\` generates properly during build
- [ ] Implement basic CLI commands:
  - [ ] \`snes-disasm disassemble <rom-file>\`
  - [ ] \`snes-disasm extract <rom-file> [options]\`
  - [ ] \`snes-disasm analyze <rom-file>\`
  - [ ] \`snes-disasm --help\`
- [ ] Include comprehensive help documentation
- [ ] Add usage examples and error handling

## Estimated Effort
3-5 days

## Dependencies
- Depends on: Fix TypeScript Compilation Errors (#$ISSUE_1)

## Technical Requirements
- Use yargs or commander.js for argument parsing
- Implement proper error handling and user feedback
- Support common ROM formats and output options
- Include progress indicators for long operations

## Definition of Done
- [ ] CLI functionality works as expected
- [ ] All commands have proper help text
- [ ] Error handling provides useful feedback
- [ ] Code review completed and approved
- [ ] CLI testing completed by QA team
- [ ] Documentation updated")
    
    echo "✅ Created Issue #$ISSUE_2: CLI Implementation"
    
    # Issue 3: Testing Strategy
    ISSUE_3=$(gh issue create \
        --title "[HIGH PRIORITY] Consolidate Mixed Testing Strategy" \
        --label "testing,refactoring,high-priority,technical-debt" \
        --body "## Problem Description
The project currently has mixed-language tests (Python and TypeScript) in the tests/ directory, causing inconsistency and potential integration issues.

## Current State Analysis
- TypeScript tests in \`tests/\` directory
- Python test files mixed with TypeScript tests
- Audio module has proper co-located tests in \`src/audio/__tests__/\`
- Inconsistent test organization patterns

## Acceptance Criteria
- [ ] Convert Python tests to TypeScript or relocate appropriately
- [ ] Implement co-located test pattern across all modules
- [ ] Follow audio module structure: \`src/[module]/__tests__/\`
- [ ] Ensure test consistency and remove language mixing
- [ ] Update Jest configuration if needed
- [ ] Maintain 100% test pass rate throughout refactoring

## Estimated Effort
2-3 days

## Dependencies
None - can be worked on in parallel with other tasks

## Definition of Done
- [ ] All tests follow consistent co-located pattern
- [ ] No mixed-language testing (or clearly documented exceptions)
- [ ] All tests pass in new structure
- [ ] Jest configuration updated appropriately
- [ ] Code review completed and approved
- [ ] Testing documentation updated")
    
    echo "✅ Created Issue #$ISSUE_3: Testing Strategy"
    
    # Issue 4: Documentation
    ISSUE_4=$(gh issue create \
        --title "[MEDIUM PRIORITY] Populate Documentation Directory" \
        --label "documentation,medium-priority,enhancement" \
        --body "## Problem Description
The \`docs/\` directory is currently mostly empty, lacking essential project documentation for developers and users.

## Required Documentation
Based on our analysis, the following documentation is needed:

### Core Documentation
- [ ] API Reference documentation
- [ ] Getting Started guide
- [ ] Architecture overview
- [ ] Contributing guidelines

### Technical Documentation
- [ ] Build and deployment instructions
- [ ] Testing guidelines
- [ ] Code style and conventions
- [ ] Troubleshooting guide

## Acceptance Criteria
- [ ] API Reference with complete method documentation
- [ ] Getting Started guide for new developers
- [ ] Architecture overview explaining project structure
- [ ] Contributing guidelines for external contributors
- [ ] All documentation is accurate and up-to-date
- [ ] Documentation follows consistent formatting standards

## Estimated Effort
2-3 days

## Dependencies
- Depends on: TypeScript Compilation Fixes (#$ISSUE_1) for accurate API docs
- Depends on: CLI Implementation (#$ISSUE_2) for complete usage documentation

## Definition of Done
- [ ] All planned documentation files created
- [ ] Documentation is technically accurate
- [ ] New developer can follow Getting Started guide successfully
- [ ] API documentation covers all public interfaces
- [ ] Code review completed for technical accuracy
- [ ] Documentation team review completed")
    
    echo "✅ Created Issue #$ISSUE_4: Documentation"
    
    echo ""
    echo "📊 Summary of created issues:"
    echo "   #$ISSUE_1 - TypeScript Compilation Errors (HIGH PRIORITY)"
    echo "   #$ISSUE_2 - CLI Implementation (HIGH PRIORITY)"  
    echo "   #$ISSUE_3 - Testing Strategy (HIGH PRIORITY)"
    echo "   #$ISSUE_4 - Documentation (MEDIUM PRIORITY)"
    echo ""
fi

# Create project board if confirmed
if [[ $confirm_project =~ ^[Yy]$ ]]; then
    echo "📋 Creating GitHub Project Board..."
    
    # Note: GitHub CLI project commands are in beta and may need different syntax
    # This is a template - adjust based on your GitHub CLI version
    
    PROJECT_NAME="SNES Disassembler Implementation"
    PROJECT_BODY="Implementation tracking for SNES Disassembler code review recommendations"
    
    # Try to create project (syntax may vary by CLI version)
    if gh project create --title "$PROJECT_NAME" --body "$PROJECT_BODY" 2>/dev/null; then
        echo "✅ Created project board: $PROJECT_NAME"
        echo "📝 Note: Please manually add the created issues to the project board"
        echo "📝 Recommended columns: Backlog, Ready, In Progress, Review, Testing, Done"
    else
        echo "⚠️  Project board creation may require manual setup"
        echo "📝 Go to: $REPO_URL/projects/new"
        echo "📝 Create project with columns: Backlog, Ready, In Progress, Review, Testing, Done"
    fi
fi

echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "📋 Next steps:"
echo "   1. Review created issues and assign team members"
echo "   2. Set up project board columns if not automated"
echo "   3. Add issues to project board for tracking"
echo "   4. Share implementation plan with team"
echo "   5. Begin high-priority task assignments"
echo ""
echo "📚 Reference documents created in docs/:"
echo "   - IMPLEMENTATION_TRACKING.md"
echo "   - GITHUB_ISSUES_TEMPLATE.md"
echo "   - TEAM_COMMUNICATION_TEMPLATE.md"
echo ""
echo "🔗 View issues: $REPO_URL/issues"
echo "🔗 View projects: $REPO_URL/projects"
echo ""
echo "Happy coding! 🚀"
