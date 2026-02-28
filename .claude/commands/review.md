# /review — W-Model Review Phase

**Workflow**: ASE-AIDW REVIEW → W-Model dual-track verification

## Context

- **Project**: tsexample
- **Phase**: REVIEW (quality assurance before SHIP)
- **Model**: W-Model (Track 1: Verification, Track 2: Validation)

## Track 1: Verification (Did we build it right?)

Run all Deno quality commands:

```bash
deno task fmt:check      # Formatting compliant
deno task lint           # No lint violations
deno task check          # Type checking clean
deno task test           # All tests pass
deno task test:coverage  # Coverage metrics
```

**Gate**: All pass, no exceptions.

## Track 2: Validation (Did we build the right thing?)

### Core Lenses (All Projects)

- [ ] **CONTEXT**: Does the solution fit the problem space? (Probe design,
      users, constraints)
- [ ] **BUSINESS**: Does it deliver value? (Entry criteria met, ROI positive,
      clear positioning)
- [ ] **ARCHITECTURE**: Is it composable and maintainable? (FCIS respected,
      dependencies clean, growth path clear)
- [ ] **DESIGN**: Is the API intuitive? (Examples work as promised, decorators
      are natural)
- [ ] **CODE QUALITY**: Is it clean and testable? (SOLID principles, minimal
      tech debt)
- [ ] **SECURITY**: Are there no vulnerabilities? (No injection vectors, safe
      defaults)

### Conditional Lenses

- [ ] **INFO ARCHITECTURE** ← **ACTIVATED** (this is a library/composable
      framework)
  - Public API clearly documented?
  - Examples in README or docs/?
  - Test suite serves as documentation?

## Review Questions

For each lens, ask:

> "Is this evidence of quality or just evidence of passing a gate?"

Distinguish between:

- **Passing the gate** (technical compliance)
- **Evidence of quality** (design insight, user value, maintainability)

## Output

- [ ] Create `docs/3-60-9/review-1.md` (3-part summary: What worked? What's
      missing? What's next?)
- [ ] Flag any validation gaps for post-SHIP fixes
- [ ] Update CHANGELOG.md with review date and findings

## Next

If both tracks pass, proceed to `/ship` for pre-release preparation.
