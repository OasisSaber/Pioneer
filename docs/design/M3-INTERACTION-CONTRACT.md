# M3 Interaction Contract · Input → Intent Review → READY

> Status: approved engineering handoff for the first M3 vertical slice  
> Figma file: `Pioneer`  
> Authoritative page: `Pioneer · DEMO Lab` — node `132:2`  
> Primary references: D03 `输入 / 新任务 Compose` — `135:258`; D04 `输入 / 执行与批准` — `136:105`

## 1. Authority order

For M3 workspace implementation, use this priority:

1. explicit user-approved Figma decisions;
2. current Figma DEMO Lab;
3. this contract;
4. current application architecture and shared contracts;
5. frozen HTML demos and older product prose.

Older labels such as `专注执行`, `状态全景`, and `成果画廊` are deprecated for the product workspace and must not be reintroduced.

## 2. Canonical scene vocabulary

The only top-level project-workspace scenes are:

- `输入` — task composition, context selection, pre-execution Intent Review and approval;
- `审阅` — Agent Files and concrete file Diff after an execution runtime exists;
- `输出` — generated Artifacts and standard output actions;
- `自定` — user-composed workspace modules.

**Intent Review stays inside `输入`.** It is a pre-execution human approval state, not the top-level `审阅` scene.

The first vertical slice implements only `输入`. Other scene controls may be visible as disabled future destinations but must not imply implemented behavior.

## 3. First M3 vertical slice

The slice is:

```text
Project tab
  → 输入 / Compose
  → submit instruction
  → TaskIntent.status = reviewing
  → Intent Review
  → approve
  → TaskIntent.status = ready
```

The slice ends at `ready`.

`READY` means **approved for a future runtime**, not executed.

This slice must not:

- modify project files;
- execute project code;
- add arbitrary filesystem IPC;
- start a model or Agent runtime;
- create snapshots;
- claim tool calls actually occurred;
- enter the top-level `审阅` or `输出` scenes.

## 4. Domain contract

Reuse `apps/desktop/src/shared/task-intent.ts` and `contracts/task-intent.ts`.

Required state semantics:

- initial draft uses revision `1`;
- submit: `draft → reviewing`;
- returning to edit preserves the review object until resubmission;
- resubmission uses the domain `revise` transition and increments revision;
- approve: `reviewing → ready`;
- cancel uses the existing domain cancellation transition;
- the renderer does not invent a parallel TaskIntent state machine.

For this slice, the plan may be generated deterministically in the renderer because no model runtime exists yet. It must be presented as a local preview, not as model output.

## 5. D03 compose contract

The compose state follows D03:

- project identity and read-only context remain visible;
- the `输入` scene is the only active scene;
- the task composer is the dominant surface;
- workspace context is secondary and restrained;
- one clear primary action submits the instruction for Intent Review;
- no dashboard metrics or fake execution telemetry.

The implementation should expose real project data already available from `ProjectSummary` and must not fabricate branch names or runtime status.

## 6. D04 Intent Review contract

Intent Review follows D04's two-column hierarchy:

- left: task/request context and local preflight summary;
- right: Intent Card with pending/ready status, instruction and ordered plan steps;
- user actions: return to edit, cancel, approve;
- approval changes domain state only.

Do not display fake tool timings, token counts, costs, or successful file operations before a runtime exists.

## 7. Visual language

Current Figma uses an editorial desktop palette and restrained flat surfaces:

- canvas `#F1F2EE`;
- surface `#F9FAF7`;
- ink/navy `#333C50`;
- secondary text `#646E72`;
- hairline `#D3D3D3`;
- mint `#D7E3DA`;
- slate `#DDE2E9`;
- jade `#DCEADF`;
- warm pending surface `#EDE4D6`;
- gold/hairline accent `#C6AF94`;
- gold ink `#76614B`;
- success ink `#35644B`.

Use flat 1px hairlines and restrained radii. Avoid large diffuse shadows, glass effects, gradients used as decoration, dashboard gauges, radar charts, or decorative AI telemetry.

## 8. Verification

The slice is complete only when:

- a real Electron project tab exposes the Input composer;
- blank instructions are rejected locally;
- submitting a valid instruction reaches `reviewing`;
- returning to edit and resubmitting increments TaskIntent revision;
- approving reaches `ready`;
- the UI explicitly states that execution has not started;
- fixture workspaces remain byte-for-byte unchanged in Real E2E;
- `pnpm check` passes.

Future Agent runtime work requires a separate contract and authorization boundary.
