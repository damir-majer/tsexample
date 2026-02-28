# /ship — SHIP Phase (Release & Documentation)

**Workflow**: ASE-AIDW SHIP → Pre-release checklist + deployment

## Context

- **Project**: tsexample
- **Phase**: SHIP (prepare for production / public release)
- **Duration**: 30-60 minutes

## Pre-Ship Checklist

### Documentation (3-60-9 Format)

Create in `docs/3-60-9/ship-1.md`:

**3-Sentence Summary:**

- What is tsexample?
- What problem does it solve?
- Who should use it?

**60-Second Explainer:**

- Core API overview
- Installation & quick start
- Example usage (copy-paste ready)

**9-Minute Deep Dive:**

- Architecture (FCIS structure)
- Why Deno?
- Advanced patterns (if any)
- Contributing guidelines

### Deployment Steps

1. **Verify all quality gates pass**
   ```bash
   deno task test
   deno task check
   deno task lint
   deno task fmt:check
   ```

2. **Create release version**
   ```bash
   git tag -a v0.1.0 -m "Initial release: EDD framework"
   git push origin main --tags
   ```

3. **GitHub release**
   - Create GitHub release on `damir-majer/tsexample`
   - Use 3-60-9 summary as release notes
   - Attach any artifacts (zipped deno.lock, etc.)

4. **JSR Publishing (optional, future)**
   - For now, GitHub release is sufficient

### README.md

Create/update `README.md` in project root:

- [ ] Project title & description
- [ ] Installation (Deno import URL)
- [ ] Quick start (working example)
- [ ] API reference (core decorators, types)
- [ ] Testing (how to contribute tests)
- [ ] License (MIT or Apache 2.0)

## Gate

> All documentation complete and deployment checklist verified before merge to
> main.

## Next

After SHIP, proceed to `/cooldown` for retrospective and handoff preparation.
