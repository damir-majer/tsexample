# CHANGELOG

All notable changes to the TSExample project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- Project scaffolding via ASE-AIDW Init Agent
- Deno 2.x configuration (deno.json with test, check, lint tasks)
- Directory structure: src/core, src/runner, tests, docs
- Five slash commands: shape, build, review, ship, cooldown
- Git initialization and .gitignore
- Project CLAUDE.md with AIDW workflow configuration

### Infrastructure

- `.gitignore` with Deno defaults
- `deno.json` with tasks: test, test:coverage, check, fmt, fmt:check, lint
- `.claude/commands/` directory with phase-specific workflows
- `docs/` subdirectories: pitches/archive, decisions, 3-60-9, retrospectives

---

## Vision

TSExample is an Example-Driven Development framework for TypeScript/Deno, inspired by JExample research from the University of Bern. The goal is to enable declarative test organization using decorators and example linking, making test suites more readable and maintainable for Deno developers.

---

**Notes for Contributors**:

- Update this file after each completed vertical slice (PEP cycle)
- Document major decisions in `docs/decisions/`
- Use semantic versioning: MAJOR.MINOR.PATCH
- Reference phase command (e.g., completed `/build Cycle 1`) when applicable
