# TheMasterplan Agent Workflow · Pioneer

> 本文件是 Pioneer 仓库的 Agent 交付入口，遵循 TheMasterplan 协议规范（GitHub Flow + Jujutsu 适配）。
> 核心原则：单一交付责任人（Single Delivery Owner），严格执行质量门禁与真实验证，不跳过人类审批。

## 项目事实 (Project Facts)

- **项目名**：Pioneer (模块化 AI Agent 交互系统)
- **项目目标**：实现模块化 AI Agent 交互系统，践行「一切皆 UI」哲学，由两条主线构成——① 交互系统：Tabs 多标签页、媒体库海报墙、模块化工作区（场景切换 + 可停靠面板）；② Harness 工程：轻量上下文、能力模块化、统一接入，复用 Pi Agent Harness 运行底座。
- **默认分支 / 书签**：`main`
- **版本控制基线**：
  - Jujutsu: `jj 0.43.0` (Colocated with Git)
  - Git: `2.55.0`
- **当前核心验证入口**：
  ```powershell
  pnpm check
  ```
- **质量门禁 (Quality Gates)**：
  - **Contract Tests**：`pnpm test:contract`，验证共享契约、路径、扫描器、IPC、安全边界、设置存储与 Tabs reducer。
  - **Prototype Tests**：`pnpm test:prototype`，冻结 M1 Prototype Tests 为 210/210；这是模拟器和探针证据，不是 Electron proof。
  - **Real E2E**：`pnpm test:e2e`，由 Playwright 启动真实 Electron，跨越 main → preload → renderer，并校验 fixture 不变性。
  - `pnpm check` 依次执行格式、lint、类型检查、上述三层测试与最终 package smoke；M2 已完成，M3 继续以该门禁作为主线质量基线。
- **工作流规范**：
  - 采用 TheMasterplan 单一交付责任人机制，子代理可协助编码与调研，但主交付责任人统管最终 Diff 审阅、VCS 提交与人类交接；
  - 本地优先使用 `jj` 快照和变更描述（`jj describe`、`jj new`），通过 `main` 书签与远程 GitHub 保持同步；
  - 任何合并、远程发布与破坏性清理未经人类明确许可不得执行。

## 权威顺序 (Authority Order)

1. 系统安全、隐私、本地数据保护要求（数据不出本机、零意外删除）
2. 受保护分支与发布限制
3. 根部 `AGENTS.md` 与 `themasterplan/THEMASTERPLAN.md` 架构总纲
4. 当前 Issue / 用户明确指令
5. 项目架构、设计规范（`docs/design/`）与测试清单（`tests/`）
6. README 与辅助说明文档

## 测试真相与里程碑边界

- [`TEST_INFRA.md`](TEST_INFRA.md) 是 Contract Tests、Prototype Tests、Real E2E 的验证分类和命令边界。
- `pnpm test:contract`、`pnpm test:prototype` 与 `pnpm test:e2e` 都是可执行的真实命令，证据层级不可混用。
- 原生目录选择器不在确定性 E2E fixture seam 内；没有穿越 Electron main → preload → renderer 的真实流程，不能宣称 Real E2E。
- 原生目录选择器不属于确定性 E2E seam；M2 的人工验收证据已完成并保存在 `docs/testing/m2-native-picker-smoke.md`，后续 fixture seam 仍不得冒充该类人工证据。
- 里程碑状态只以 [`themasterplan/ROADMAP.md`](themasterplan/ROADMAP.md) 为准。
- `demos/` 与 `tests/prototype/` 是冻结的 M1 参考实现与测试证据，其内嵌文案沿用当时的题目口径（「基于模块化架构的桌面任务助理 Agent 交互系统」），**不代表当前课题定位**。当前题目与定位以 [`选题收敛说明.md`](选题收敛说明.md) 为准，开题汇报以 Figma `Pioneer-PPT` 为权威源。

## 常用工作流命令 (TheMasterplan + jj)

```powershell
# 1. 检查当前工作副本状态与快照
jj status

# 2. 执行当前完整质量门禁
pnpm check

# 3. 添加语义化变更说明
jj describe -m "feat/fix/docs: <description>"

# 4. 锁定当前阶段并将 main 书签推进至此
jj bookmark set main -r "@"
jj new

# 5. 推送至远程 GitHub（须经人类明确授权）
jj git push
```
