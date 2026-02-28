# TSExample

Example-Driven Development framework for TypeScript/Deno.

**Status**: Early development (SHAPE phase, v0.0.0)

---

## Overview

TSExample is inspired by [JExample](https://jexample.ch/) research from the University of Bern. It brings example-driven development patterns to TypeScript/Deno, allowing you to organize test suites declaratively using decorators and example linking.

### Why Example-Driven Development?

Traditional unit tests are often isolated and repetitive. EDD reduces boilerplate by allowing tests to inherit setup and fixtures from "example" tests, creating a readable chain of related examples.

---

## Quick Start

(Coming soon — see SHAPE phase documentation)

---

## Development

This project follows the [ASE AI Development Workflow](./CLAUDE.md):

### Phases

- **SHAPE**: Research and design (`/shape` command)
- **BUILD**: Implementation via PEP cycles (`/build` command)
- **REVIEW**: Quality assurance (`/review` command)
- **SHIP**: Release and documentation (`/ship` command)
- **COOL-DOWN**: Retrospective and reflection (`/cooldown` command)

### Running Quality Checks

```bash
deno task test                # Run all tests
deno task test:coverage       # Generate coverage report
deno task check               # Type checking
deno task lint                # Lint code
deno task fmt                 # Format code
```

---

## Architecture

TSExample follows the **FCIS pattern** (Functional Core, Imperative Shell):

- **Functional Core** (`src/core/`): Pure functions for example graph construction and analysis
- **Imperative Shell** (`src/runner/`): Deno.test() integration and decorator implementation

---

## Project Structure

```
src/
  core/              # Pure logic: example models, graph, scoring
  runner/            # Deno.test() integration, decorators
tests/               # Test suite organized by module
docs/
  pitches/           # SHAPE phase outputs
  decisions/         # Design decision records
  3-60-9/            # Phase documentation
  retrospectives/    # Cycle retrospectives
```

---

## Research & References

- **JExample**: University of Bern EDD framework for Java
- **Deno**: Modern TypeScript runtime for secure scripts and tools

---

## License

MIT (or Apache 2.0 — to be confirmed)

---

## Contributing

Contributions welcome! Please follow the ASE AI Development Workflow as documented in [CLAUDE.md](./CLAUDE.md).

---

**Last Updated**: 2026-02-28
