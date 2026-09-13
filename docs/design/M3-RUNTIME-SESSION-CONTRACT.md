# M3 Runtime Session Contract · READY → Session Bootstrap

> Status: approved engineering boundary for the second M3 vertical slice  
> Precondition: the first M3 `Input → Intent Review → READY` slice is already on `main`  
> This contract defines bootstrap only; it does not define Agent execution.

## 1. Purpose

A Runtime Session is the first explicit execution-side container created after human approval.

The bootstrap boundary is:

```text
TaskIntent.status = ready
  → validate approved intent
  → clone approved intent into RuntimeSession
  → RuntimeSession.status = initialized
```

The session consumes the **approved TaskIntent snapshot**. It does not reinterpret the user's original input and does not regenerate the approved plan.

## 2. Required invariants

A bootstrapped Runtime Session:

- references exactly one project;
- contains a cloned `approvedIntent` whose status is `ready`;
- preserves the approved intent id, revision, instruction and ordered steps;
- uses a deterministic session id derived from the approved intent id and revision;
- starts with status `initialized`;
- records model access, tool execution and file mutation as disabled.

Changing the source TaskIntent after bootstrap must not mutate the session snapshot.

## 3. Explicit non-capabilities

`initialized` does **not** mean running.

This slice must not:

- call a model/provider;
- create a Pi-Agent process;
- execute tools or shell commands;
- modify project files;
- add generic filesystem IPC;
- create snapshots;
- emit a real runtime event stream;
- fabricate tokens, costs, timings or successful tool activity;
- reinterpret the approved instruction.

Those behaviors require later contracts and explicit authorization.

## 4. UI contract

After TaskIntent reaches `READY`, the Input scene may expose one explicit action:

`初始化运行会话`

After bootstrap, the UI must state that:

- the approved intent revision is locked into the session;
- model access is off;
- tool execution is off;
- file writes are off;
- execution has not started.

The top-level scene remains `输入`. `审阅` and `输出` remain unavailable until later runtime slices create real file changes or artifacts.

## 5. Verification

The slice is valid only when:

- non-ready intents cannot bootstrap a session;
- invalid intents are rejected;
- a ready intent creates a valid initialized session;
- the session contains an independent clone of the approved intent;
- all runtime capabilities remain false;
- Real Electron E2E reaches session initialization from the approved READY UI;
- fixture workspaces remain byte-for-byte unchanged;
- `pnpm check` passes.
