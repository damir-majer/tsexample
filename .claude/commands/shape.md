# /shape — SHAPE Phase Session

**Workflow**: ASE-AIDW SHAPE → Tier 2 (Light Cycle) → Explore 3X

## Context

- **Project**: tsexample — Example-Driven Development framework for TypeScript/Deno
- **Phase**: SHAPE (research, breadboarding, vertical slice identification)
- **Duration**: 1-2 hours
- **Rhythm**: Probe → Decide → Simplify

## Objectives

1. **Probe**: Understand the problem space
   - What is EDD (Example-Driven Development)?
   - How does JExample work? (University of Bern research)
   - Why TypeScript + Deno for this implementation?
   - User personas: who uses this? (Deno devs, example-driven testers)

2. **Decide**: Define the scope boundary
   - Core API surface (test decorators, result models, runner)
   - Example grouping/linking mechanism
   - What's in scope vs. nice-to-have

3. **Simplify**: Identify a vertical slice
   - What's the smallest working prototype?
   - Can we ship decorators + basic runner in first cycle?
   - Rabbit holes to avoid (full DSL, advanced filtering)

## Quality Gates

- [ ] Design doc drafted (mini pitch format)
- [ ] Vertical slice identified with 3-5 test cases
- [ ] Breadboard table created (inputs/outputs/states)
- [ ] Rabbit holes documented
- [ ] Team alignment on scope

## Output Files

Create in `docs/pitches/`:
- `tsexample-v1-mini-pitch.md` (Tier 2 format: 1-2 pages)
- `tsexample-breadboard.txt` (ASCII breadboard)
- `rabbit-holes.md` (risks & assumptions)

## References

- ASE-AIDW REFERENCE.md: SHAPE phase details, Probe-Decide-Simplify
- templates/pitch-mini.md: Tier 2 format template
- Zettelkasten: EDD research notes

## Next

If approved, proceed to `/build` for PEP cycles.
