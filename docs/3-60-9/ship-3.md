# SHIP Documentation — TSExample v0.3.0

> **Date**: 2026-02-28 | **Phase**: SHIP | **Tier**: 2 (Light Cycle)

---

## 3-Sentence Summary

**TSExample v0.3** is a housekeeping and hardening cycle that closes two
long-standing tech debt items: missing decision records (deferred since v0.1)
and deno-adapter.ts low branch coverage (40% since v0.1). Four ADR files
document the key architecture decisions that shaped v0.1 and v0.2. Two pure
helper functions were extracted from the adapter's imperative shell, doubling
its branch coverage to 80% with 9 new tests.

---

## 60-Second Explainer

### What's New in v0.3

**1. Decision Records** — Four ADR files in `docs/decisions/`:

- DEC-001: Why `addInitializer` fires at construction, not definition
- DEC-002: Why `Cloneable<T>` interface over decorator/registry alternatives
- DEC-003: Why one `Deno.test()` per suite with `t.step()` children
- DEC-004: Why custom > Cloneable > structuredClone priority order

Each record captures context, decision, rejected alternatives, and consequences.
These prevent future re-exploration of already-decided paths.

**2. Adapter Test Extraction** — Two pure helpers extracted from
`deno-adapter.ts`:

- `formatStepName(name, skipped)` — prepends `[SKIPPED]` when needed
- `resolveStepError(result, name)` — returns error or null based on status

These are FCIS-compliant: pure functions with no I/O, testable in isolation.

### Quality

| Metric          | v0.2  | v0.3  | Delta  |
| --------------- | ----- | ----- | ------ |
| Tests           | 91    | 100   | +9     |
| Line coverage   | 92.8% | 94.9% | +2.1%  |
| Branch coverage | 86.9% | 88.5% | +1.6%  |
| deno-adapter.ts | 40%   | 80%   | +40 pp |

### What Was NOT Changed

- No new source files created
- No new public API exports
- No new dependencies
- Primary API surface (`@Example`, `@Given`, `registerSuite`) unchanged
- FCIS architecture unchanged

---

## Release Checklist

- [x] All quality gates pass (fmt, lint, check, test, coverage)
- [x] W-Model Review #3 passed (`docs/3-60-9/review-3.md`)
- [x] README.md updated (version, test count, coverage numbers)
- [x] CHANGELOG.md updated with v0.3.0 release notes
- [x] Ship documentation created (`docs/3-60-9/ship-3.md`)
- [ ] Git commit and tag v0.3.0
- [ ] GitHub release published

---

**Shipped**: 2026-02-28
