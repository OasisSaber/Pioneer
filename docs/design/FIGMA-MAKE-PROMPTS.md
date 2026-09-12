# Figma Make 专用提示词集 (Figma Make Prompts)
> **使用方法**：直接复制下方对应模块的 Markdown 提示词，粘贴至 Figma Make / AI UI 生成插件中，即可自动生成符合 Wonderwall-Pi Agent 规范的高保真设计帧与组件。

---

## 模块一：设计系统组件库 (Component Sets)

```markdown
Role: Senior UI/UX Design System Specialist
Task: Generate a comprehensive, minimalist Component Set in Figma for an AI Task Assistant Agent system called "Wonderwall-Pi Agent".

Design Rules:
- Aesthetic: Apple HIG minimalism meets opencode terminal precision.
- Canvas Background: #FDFCFC (Warm White).
- Card Surface: #F5F5F7 (Light Gray, border: 1px solid #E0DEDE, radius: 14px).
- Dark Elements: #161413 (Terminal Dark, text: #FDFCFC, border: 1px solid #4B4646, radius: 8px).
- Primary Ink: #1D1D1F, Secondary Ink: #6E6E73, Muted: #86868B.
- Single Accent Color: #0071E3 (Apple Blue, strictly restrained, max 2 uses per component).
- Typography: SF Pro Text/Display for titles & body; SF Mono for code, status, terminal lines.
- No drop shadows, no glassmorphism, no gradient mesh. Pure flat with 1px hairline borders.

Components to Generate in AutoLayout:
1. Pill Badges:
   - Variant P0: background #0071E3, text #FFFFFF, font SF Mono 14px Semibold, height 32px, radius 999px.
   - Variant P1: background #FDFCFC, border 1px solid #86868B, text #6E6E73, font SF Mono 14px.
   - Variant Model Badge: background #F5F5F7, border 1px solid #E0DEDE, text #1D1D1F ("Qwen3.6-27B · local").

2. Intent Card (意图核对卡):
   - Container: 640px width, padding 24px, radius 14px, background #F5F5F7, border 1px solid #E0DEDE, left accent stripe 3px #0071E3.
   - Header: Model pill on left, status dot on right.
   - Title: "意图核对 · 整理本地 D:\Project 目录" (SF Pro 20px Bold #1D1D1F).
   - Body Summary: "检测到 14 个散乱目录，计划归组为 3 个分类并统一前缀，删除操作已自动关闭。"
   - Step Checklist: 3 steps with check circles, clear concise text.
   - Action Bar: Primary pill button "批准执行 [Enter]" (#0071E3), Secondary button "修改步骤 [E]" (#F8F7F7 border #E0DEDE).

3. Adaptive Light-Hint Bar (模型自适应轻提示条):
   - Container: 640px width, height 44px, padding 0 16px, background #161413, radius 8px, text #FDFCFC.
   - Content: "$ [Qwen3-27B 适配] 检测到大目录遍历，已动态挂载深度优先与防早停策略 · [查看规则 →]".

4. Bookshelf Project Card:
   - Container: 360px × 180px, padding 20px, radius 14px, background #F5F5F7, border 1px solid #E0DEDE.
   - Header: Project name (SF Pro 18px Bold), Git Branch badge ("main / clean").
   - Meta Row: Language tag ("TypeScript / React"), Last Active ("2 小时前").
   - Action Hover: "进入会话 →" / "执行 Runbook".
```

---

## 模块二：三页设计范例 (Design Spec Exemplars)

### 范例 1：Design Tokens & Typography 规范页
```markdown
Task: Create a 1920x1080 Design Token & Typography Spec Board for Wonderwall-Pi Agent.
Layout: 16:9 widescreen presentation slide.
Background: #FDFCFC. Header: "01 · DESIGN TOKENS & TYPOGRAPHY / 规范范例".
Left Column: Color Palette swatches with hex codes, roles, and usage rules (#FDFCFC, #F5F5F7, #1D1D1F, #6E6E73, #86868B, #E0DEDE, #0071E3, #161413).
Right Column: Typography scale hierarchy (Display 56px, Title 28px, Body 16px, Mono 14px) showing bilingual Chinese/English pairings in SF Pro + SF Mono.
Bottom: 4px base grid & 14px/8px/999px radius rules.
```

### 范例 2：Component & Surface 交互组件范例页
```markdown
Task: Create a 1920x1080 Interactive Component Showcase Frame for Wonderwall-Pi Agent.
Layout: 16:9 widescreen. Background: #FDFCFC. Header: "02 · COMPONENTS & INTERACTION SURFACES / 组件范例".
Content Grid (2x2 AutoLayout cards):
- Card 1: Intent Card in active confirmation state.
- Card 2: Bookshelf Project Card with Git status & scratchpad indicator.
- Card 3: Adaptive Light-Hint banner with collapsed/expanded Profile drawer.
- Card 4: Clean-up Diff Proposal row showing source path -> target path with safety rollback badge.
```

### 范例 3：Restraint Principle & Pathology 适配轻提示范例页
```markdown
Task: Create a 1920x1080 Restraint Principle & Model Pathology Demonstration Frame.
Layout: 16:9 widescreen. Background: #FDFCFC. Header: "03 · RESTRAINT & MODEL PATHOLOGY / 克制与自适应范例".
Top Section: Comparison of "With Restraint" (Clean single-line hint, silence-first) vs "AI Clutter" (crossed out radar charts, noisy dashboards).
Bottom Section: 3 concrete Model Pathology adaptation cards:
1. Qwen3.6: Early stopping pathology -> Auto Deep Traversal strategy mounted.
2. DeepSeek-V3: JSON schema drift -> Strict regex post-filter patch.
3. Claude Code local: High token verbosity -> Compact diff output patch.
```

---

## 模块三：三页 Agent 页面 Demo (Core Agent Page Demos)

### 页面 Demo 1：GUI 书架与工作区首页 (Bookshelf & Workspace)
```markdown
Task: Design a complete Desktop Web App Screen (1440x900 or 1920x1080) for Wonderwall-Pi Agent GUI Bookshelf.
Top Header: Logo "Wonderwall-Pi", Workspace Selector ("D:\Project"), Search bar, "一键整理工作区" pill button (#0071E3), Model status badge ("Qwen3.6-27B Local Active").
Main Content:
- Hero Banner: Minimalist greeting with Workspace summary ("共发现 12 个项目，8 个 Git 仓库，4 个临时草稿目录").
- Project Grid: 6-8 Bookshelf Cards displaying projects (e.g. "demo-thesis-2027", "agent-runtime-pi", "dataset-cleaner", "tmp-scraps").
- Floating Drawer (Clean-up Proposal): Triggered by "一键整理", displaying path diff preview table ("tmp-notes" -> "archive/2026/tmp-notes") with "100% 可回滚" security badge.
```

### 页面 Demo 2：意图核对与执行会话页 (Intent Card & Execution Session)
```markdown
Task: Design a complete Desktop Screen for Wonderwall-Pi Agent Active Execution Session.
Top Header: Session Title "整理与格式化毕业设计开题材料", Target Workspace "demo-thesis-2027", Switch Model pill.
Center Column:
- Top Card: Large Intent Card showing natural language intent verification, structured 4-step checklist, and user approval buttons.
- Bottom Terminal Box: Monospace dark terminal block (#161413) showing real-time live execution event stream with single-line status ticker.
- Bottom Hint: Adaptive Light-Hint bar: "$ [Qwen3.6 适配] 已挂载单文件原子写入策略以防覆盖".
```

### 页面 Demo 3：任务收尾与成果画廊页 (Wrap-up & Gallery)
```markdown
Task: Design a complete Desktop Screen for Wonderwall-Pi Agent Task Wrap-up & Output Gallery.
Top Header: Task Summary "任务完成 · 3 个文件已规范整编", Execution Time "12.4s", Token Cost "0 (本地离线)".
Main Content:
- Summary Card: 3 concise bullet points of what was done.
- Artifacts & Changeset Gallery: 3 interactive artifact cards (e.g., Markdown clean document, Diff patch log, JSON metadata) with "一键回滚" and "打开文件" actions.
- Runbook Synthesis Card: "已自动提炼可复用 Runbook: 'project-asset-cleaner' (保存至本地 / 一键遗忘)".
- Footer: Restrained offline TTS voice summary bar ("不在场时已播报完成状态").
```
