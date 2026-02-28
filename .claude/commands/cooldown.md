# /cooldown — COOL-DOWN Phase (Retrospective & Learning)

**Workflow**: ASE-AIDW COOL-DOWN → 4L Retrospective + SMART Check + Handoff

## Context

- **Project**: tsexample
- **Phase**: COOL-DOWN (reflection, knowledge capture, team learning)
- **Tier 2 Duration**: 30-60 minutes (Light Cycle scaled)

## 4L Retrospective

Create in `docs/retrospectives/cycle-1.md`:

### Liked

- What went well?
- Which design decisions felt natural?
- What surprised you positively?

### Learned

- What did you discover about the problem space?
- Which assumptions were wrong?
- Any architectural lessons?

### Lacked

- What was missing?
- What slowed you down?
- Any tech debt or shortcuts?

### Long-Term Improvements

- What should change for the next cycle?
- Any process improvements?
- Skills or knowledge gaps to address?

## SMART Check

Evaluate against original SHAPE objectives:

| Objective | Status | Evidence |
|-----------|--------|----------|
| Core decorator API | ✓/✗ | Tests pass, examples work |
| Test runner integration | ✓/✗ | Deno.test() registration working |
| Documentation | ✓/✗ | README + API docs complete |
| 50% coverage (Explore) | ✓/✗ | `deno task test:coverage` result |

## Context Hygiene

- [ ] CHANGELOG.md updated with cycle summary
- [ ] Old brainstorming notes archived (move to docs/pitches/archive/)
- [ ] Decision log cleaned (link to docs/decisions/)
- [ ] test coverage report reviewed (coverage/index.html)
- [ ] README reviewed for accuracy

## Handoff Preparation

If pausing development:

- [ ] Create `docs/NEXT-CYCLE.md` with:
  - What's ready to build next
  - Blocked items needing unblock
  - Suggested slices for Cycle 2
  - Known rabbit holes to avoid

If continuing:

- [ ] Review `/shape` to scope Cycle 2
- [ ] Identify next vertical slice
- [ ] Schedule next BUILD session

## Team Sync (if applicable)

- Share 4L retrospective with team
- Discuss Long-Term Improvements
- Align on Cycle 2 direction

## Completion

- [ ] All retrospective files created
- [ ] CHANGELOG.md final update
- [ ] Context hygiene complete
- [ ] Next cycle scoped (or paused)

**End of Cycle 1.**
