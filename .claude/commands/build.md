# /build — BUILD Phase with PEP Cycles

**Workflow**: ASE-AIDW BUILD → Tier 2 (Light Cycle) → Explore 3X

## Context

- **Project**: tsexample — TypeScript/Deno EDD framework
- **Phase**: BUILD (implementation via PEP cycles)
- **Tier 2 Cycle**: Light Cycle — 2-3 days per vertical slice
- **3X Level**: Explore — loose quality, 50% coverage minimum, high agent autonomy

## PEP Cycle Structure

Each PEP (Prepare-Execute-Prove) is <1 day:

1. **Prepare** (15-30 min)
   - Review requirements for this slice
   - Set up test fixtures
   - Identify blockers

2. **Execute** (1-2 hours)
   - Write failing tests first (TDD)
   - Implement feature
   - Run deno task test

3. **Prove** (15-30 min)
   - Verify all tests pass
   - Check code quality gates
   - Document learning

## Quality Gates (Explore 3X)

ALL gates must pass before marking PEP complete:

```bash
deno task test           # All tests pass
deno task check          # Type checking clean
deno task lint           # Lint clean
deno task fmt:check      # Formatting clean
deno task test:coverage  # 50% coverage minimum
```

Coverage is advisory at Explore level (not gating) but should trend upward.

## Example PEP Cycle

**Slice 1: Core Decorator API**
- Requirement: `@Example()` decorator + result model
- Tests: 3-4 test files in tests/
- Estimated PEPs: 2-3

**Slice 2: Test Runner Integration**
- Requirement: Register with Deno.test(), collect results
- Tests: Integration tests
- Estimated PEPs: 2-3

## Logging & Decisions

- Keep `CHANGELOG.md` updated with each completed slice
- Document decisions in `docs/decisions/` (one file per major choice)
- After 2-3 slices, create retrospective

## Deno-Specific Notes

- Use `Deno.test()` with sync/async support
- Import directly from JSR or npm: via deno imports
- No node_modules — keep it pure Deno
- Coverage reports in coverage/ (gitignored)

## Next

After all BUILD PEPs are complete, move to `/review` for W-Model verification.
