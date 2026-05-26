# PrePro Studio Stabilization Plan

> **For Hermes:** Use this as the medium-term execution map. Keep moving without asking after each small step; only stop for blocked credentials, destructive scope changes, or product decisions that materially change direction.

**Goal:** Stabilize PrePro Studio into a field-ready pre-production tool that can be trusted for actual shoot planning.

**Architecture:** Keep the app no-login/BYOK/local-first. Improve in small, verifiable increments: dependency hygiene first, then smoke QA, then UX polish, then export/share reliability. Every code change must pass `npm run release:check` and production smoke checks.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, GitHub Actions, Vercel.

---

## Phase 1: Dependency and CI Hygiene

**Objective:** Keep the project green and reduce dependency noise.

1. Merge safe Dependabot PRs with green checks.
2. After each batch, run:
   ```bash
   npm run release:check
   ```
3. Confirm GitHub Actions and Vercel status are green.
4. Block or close grouped dependency updates that break the current stack.

**Current policy:** ESLint 10 grouped tooling updates are blocked until `eslint-config-next` / the Next lint stack is compatible.

---

## Phase 2: Production Smoke QA

**Objective:** Confirm a first-time user can understand and navigate the app.

Test these flows on production:

1. Empty first-run state
   - Direct add path
   - Sample data path
   - Planning-first path
2. Sample project review
   - Schedule tab
   - Cue sheet tab
   - Storyboard tab
   - Report tab
3. Export / backup controls
   - JSON backup
   - Share link
   - PDF buttons where available
4. Console health
   - Check for JavaScript errors after every major interaction.

---

## Phase 3: UX Polish

**Objective:** Make the product feel like a guided field tool rather than a dense spreadsheet.

Priority polish areas:

1. First-run guidance
   - Keep choices minimal.
   - Make the next step obvious.
   - Hide advanced panels until the first scene exists.
2. Schedule workflow
   - Scene add/edit should feel like the main path.
   - Day/time/location changes should be visible and recoverable.
3. Field-readiness dashboard
   - Surface blockers: missing calltime, missing contact, unconfirmed locations, missing props/costumes/sound notes.
4. Report mode
   - Make Done/NG flow obvious for shoot-day use.

---

## Phase 4: Export and Handoff Reliability

**Objective:** Make outputs usable by a director/producer on set.

1. Verify JSON backup/restore round trip.
2. Verify schedule PDF readability.
3. Verify cue sheet PDF readability.
4. Verify report PDF readability.
5. Confirm share link behavior does not overwrite existing local work without confirmation.

---

## Phase 5: Release Discipline

**Objective:** Keep every shipped change small and reversible.

For every implementation PR:

1. One focused change per branch.
2. Run local verification:
   ```bash
   npm run release:check
   ```
3. Open or merge PR only when checks are green.
4. Confirm production Vercel deployment.
5. Smoke test the affected flow on `https://prepro-studio.vercel.app`.

---

## Immediate Next Tasks

1. Finish dependency cleanup.
2. Keep ESLint 10 tooling update blocked until compatible.
3. Run first-run and sample-project smoke QA.
4. Turn any real UX issue into a small PR.
5. Re-run production smoke after deployment.
