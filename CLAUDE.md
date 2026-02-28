# TSExample — AI Development Workflow

Project-level configuration for Claude Code in the tsexample workspace.

---

## Project Context

**Project Name**: TSExample **Description**: Example-Driven Development (EDD)
framework for TypeScript/Deno, inspired by JExample research from the University
of Bern. TSExample enables declarative test organization using decorators and
example linking, making test suites more readable and maintainable.

**Owner**: Damir Majer **GitHub**: `damir-majer/tsexample` (private repo)

---

## Tech Stack

- **Runtime**: Deno 2.x
- **Language**: TypeScript 5.x
- **Testing**: `Deno.test()` (native, no external frameworks)
- **Decorators**: Stage 3 (experimental decorators, when standardized)
- **Package Management**: None (pure Deno, no npm/Node.js dependencies)
- **Version Control**: Git (GitHub, private)

---

## Architecture

### FCIS Pattern (Functional Core, Imperative Shell)

The project separates concerns across two zones:

**Functional Core** (`src/core/`):

- Pure functions for example graph construction
- Result model definitions
- Scoring/analysis logic
- No side effects, testable in isolation

**Imperative Shell** (`src/runner/`):

- Deno.test() integration
- Decorator registration
- Example collection and execution
- I/O and test framework bridging

### Design Principles

- **IOSP**: Input (test data) → Operation (assertion) → State → Post-condition
- **PEP Cycle**: Prepare → Execute → Prove (atomic development unit)
- **TDD-First**: Write failing tests before implementation
- **Composability**: Core logic decoupled from test runner

---

## ASE-AIDW Workflow

This project follows the **ASE AI Development Workflow** with the following
configuration:

### Tier: 2 (Light Cycle)

- **Cycle Duration**: 2-3 days per vertical slice
- **PEP Duration**: <1 day per Prepare-Execute-Prove unit
- **Preconditions**: Git (mandatory), GitHub private repo (mandatory)

### 3X Level: Explore

- **Quality Threshold**: 50% test coverage minimum (advisory, not gating)
- **Process Rigor**: Loose (high agent autonomy, prototype-friendly)
- **Code Review**: Core lenses (CONTEXT, BUSINESS, ARCHITECTURE, DESIGN, CODE
  QUALITY, SECURITY, INFO ARCHITECTURE)

### Phases

| Phase     | Command     | Description                                        |
| --------- | ----------- | -------------------------------------------------- |
| SHAPE     | `/shape`    | Research, breadboarding, vertical slice definition |
| BUILD     | `/build`    | PEP cycles, TDD-first implementation               |
| REVIEW    | `/review`   | W-Model verification + validation                  |
| SHIP      | `/ship`     | Release prep, 3-60-9 documentation, deployment     |
| COOL-DOWN | `/cooldown` | 4L retrospective, SMART check, handoff prep        |

### Quality Gates

All gates must pass before advancing phases:

```bash
deno task test           # All tests pass
deno task check          # Type checking clean
deno task lint           # Lint clean
deno task fmt:check      # Formatting clean
deno task test:coverage  # 50%+ coverage (Explore level)
```

---

## Directory Structure

```
tsexample/
├── .claude/
│   └── commands/              # AIDW slash commands
│       ├── shape.md
│       ├── build.md
│       ├── review.md
│       ├── ship.md
│       └── cooldown.md
├── src/
│   ├── core/                  # Functional Core (pure logic)
│   │   ├── example.ts         # Example model & graph
│   │   ├── result.ts          # Test result model
│   │   └── scoring.ts         # Analysis functions
│   └── runner/                # Imperative Shell (Deno integration)
│       ├── decorators.ts      # @Example() decorator implementation
│       └── integration.ts     # Deno.test() integration
├── tests/                     # Test suite
│   ├── core/
│   ├── runner/
│   └── integration/
├── docs/
│   ├── pitches/               # SHAPE phase outputs
│   │   └── archive/           # Old pitches
│   ├── decisions/             # Design decisions (one per file)
│   ├── 3-60-9/                # Phase documentation
│   └── retrospectives/        # Cycle retrospectives
├── coverage/                  # Test coverage reports (gitignored)
├── deno.json                  # Deno configuration
├── .gitignore
├── CLAUDE.md                  # This file
├── CHANGELOG.md               # Version history
└── README.md                  # Public documentation
```

---

## Development Workflow

### Getting Started

1. **Understand the AIDW workflow**:
   - Read `~/.claude/skills/ase-aidw/REFERENCE.md` for detailed phase guide
   - Review the 5 slash commands in `.claude/commands/`

2. **Start SHAPE phase**:
   - Run `/shape` to begin research and breadboarding
   - Produce mini-pitch doc + breadboard table

3. **Move to BUILD when approved**:
   - Run `/build` to execute PEP cycles
   - Keep `CHANGELOG.md` updated

### Key Practices

- **TDD-First**: Write failing tests before implementation
- **One PEP per feature**: Keep cycles atomic and reversible
- **Decision Documentation**: Create one file per major choice in
  `docs/decisions/`
- **Changelog Discipline**: Update `CHANGELOG.md` after each completed slice
- **Coverage Tracking**: Run `deno task test:coverage` regularly

### Code Quality

All code must pass before committing:

```bash
deno task fmt                 # Auto-format
deno task lint                # Check for issues
deno task check               # Verify types
deno task test                # Run tests
deno task test:coverage       # Check coverage
```

---

## Research & References

### EDD Inspiration

- **JExample**: University of Bern research on example-driven development
- **Paper**: Focus on reducing boilerplate, improving test readability through
  declarative linking
- **Zettelkasten Notes**: References in PKM at
  `/Users/eazzy/Library/CloudStorage/Dropbox/Private/workspaces/ws-ai/projects/_PKM/sources/zettelkasten/`

### ASE Core Principles

- **IOSP**: Input → Operation → State → Post-condition (test structure)
- **FCIS**: Functional Core (pure) + Imperative Shell (I/O) = composable systems
- **PEP**: Prepare-Execute-Prove cycle for sustainable development

---

## Collaboration

- **AI Assistants**: Multiple Claude instances may contribute. Maintain
  consistency in formatting, naming, and decision documentation.
- **Handoff Readiness**: Always leave work in a state another AI (or human) can
  continue. Update `CHANGELOG.md` and create `NEXT-CYCLE.md` when pausing.

---

## Notes for Claude Code

### Before Each Session

1. Read this CLAUDE.md to understand project context
2. Check `CHANGELOG.md` for prior work
3. Review relevant slash commands in `.claude/commands/`
4. If continuing a cycle, check `docs/3-60-9/` for phase status

### During Development

- Use TDD: write tests first, implement second
- Update `CHANGELOG.md` after each completed slice
- Create decision files for non-obvious choices
- Run quality gates before committing

### After Phase Completion

- Run the next phase's slash command (e.g., after BUILD, run `/review`)
- Create retrospective in `docs/retrospectives/`
- Update SMART check in `NEXT-CYCLE.md`

---

## Git Workflow

- **Commit Policy**: Atomic commits, one feature per commit
- **Branch**: Work on `main` (Light Cycle, small team)
- **Tags**: Create git tags for each completed phase (v0.1.0, v0.2.0, etc.)
- **Push**: Push after each completed PEP cycle

---

**Version**: 1.0 **Created**: 2026-02-28 **Last Updated**: 2026-02-28
