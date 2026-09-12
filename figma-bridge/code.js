/**
 * Wonderwall-Pi Figma Bridge Plugin Code
 * Executes directly inside the Figma Sandbox.
 */

figma.showUI(__html__, { width: 360, height: 640, themeColors: true });

// Color Token Constants (Normalized 0-1 for Figma API)
const COLORS = {
  canvas: { r: 253/255, g: 252/255, b: 252/255 },       // #FDFCFC
  surface: { r: 245/255, g: 245/255, b: 247/255 },      // #F5F5F7
  surface2: { r: 248/255, g: 247/255, b: 247/255 },     // #F8F7F7
  ink: { r: 29/255, g: 29/255, b: 31/255 },             // #1D1D1F
  ink2: { r: 110/255, g: 110/255, b: 115/255 },         // #6E6E73
  ink3: { r: 134/255, g: 134/255, b: 139/255 },         // #86868B
  line: { r: 224/255, g: 222/255, b: 222/255 },         // #E0DEDE
  accent: { r: 0/255, g: 113/255, b: 227/255 },         // #0071E3
  accent2: { r: 0/255, g: 102/255, b: 204/255 },        // #0066CC
  dark: { r: 22/255, g: 20/255, b: 19/255 },            // #161413
  darkSurface: { r: 30/255, g: 28/255, b: 27/255 },     // #1E1C1B
  white: { r: 1, g: 1, b: 1 }
};

async function loadFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: "Inter", style: "Regular" }).catch(() => {}),
    figma.loadFontAsync({ family: "Inter", style: "Medium" }).catch(() => {}),
    figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(() => {}),
    figma.loadFontAsync({ family: "Inter", style: "Bold" }).catch(() => {})
  ]);
}

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16) / 255,
    g: parseInt(c.substring(2, 4), 16) / 255,
    b: parseInt(c.substring(4, 6), 16) / 255
  };
}

// 1. Create Local Variables & Styles
async function createDesignTokens() {
  await loadFonts();
  
  // Create Paint Styles
  const styleEntries = [
    { name: "Wonderwall / Canvas", color: COLORS.canvas },
    { name: "Wonderwall / Surface", color: COLORS.surface },
    { name: "Wonderwall / Surface-2", color: COLORS.surface2 },
    { name: "Wonderwall / Ink (Primary)", color: COLORS.ink },
    { name: "Wonderwall / Ink-2 (Secondary)", color: COLORS.ink2 },
    { name: "Wonderwall / Ink-3 (Muted)", color: COLORS.ink3 },
    { name: "Wonderwall / Hairline", color: COLORS.line },
    { name: "Wonderwall / Accent (Apple Blue)", color: COLORS.accent },
    { name: "Wonderwall / Dark Terminal", color: COLORS.dark }
  ];

  const existingStyles = figma.getLocalPaintStyles();
  for (const item of styleEntries) {
    let style = existingStyles.find(s => s.name === item.name);
    if (!style) {
      style = figma.createPaintStyle();
      style.name = item.name;
    }
    style.paints = [{ type: 'SOLID', color: item.color }];
  }

  figma.notify("✓ Wonderwall-Pi Design Tokens 已成功同步至 Figma 局部样式！");
}

// 2. Create Pill Badge Component
async function createPillBadge(text, isPrimary = true) {
  await loadFonts();
  const frame = figma.createFrame();
  frame.name = `Pill / ${isPrimary ? 'P0-Primary' : 'P1-Secondary'}`;
  frame.layoutMode = "HORIZONTAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.paddingLeft = 16;
  frame.paddingRight = 16;
  frame.paddingTop = 8;
  frame.paddingBottom = 8;
  frame.cornerRadius = 999;
  frame.itemSpacing = 8;

  if (isPrimary) {
    frame.fills = [{ type: 'SOLID', color: COLORS.accent }];
  } else {
    frame.fills = [{ type: 'SOLID', color: COLORS.canvas }];
    frame.strokes = [{ type: 'SOLID', color: COLORS.line }];
    frame.strokeWeight = 1;
  }

  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Medium" };
  label.characters = text;
  label.fontSize = 13;
  label.fills = [{ type: 'SOLID', color: isPrimary ? COLORS.white : COLORS.ink2 }];
  frame.appendChild(label);

  return frame;
}

// 3. Create Intent Card Component
async function createIntentCard(title, summary, steps) {
  await loadFonts();
  const card = figma.createFrame();
  card.name = "Component / Intent-Card";
  card.layoutMode = "VERTICAL";
  card.primaryAxisSizingMode = "AUTO";
  card.counterAxisSizingMode = "FIXED";
  card.resize(680, 300);
  card.paddingLeft = 28;
  card.paddingRight = 28;
  card.paddingTop = 24;
  card.paddingBottom = 24;
  card.itemSpacing = 16;
  card.cornerRadius = 14;
  card.fills = [{ type: 'SOLID', color: COLORS.surface }];
  card.strokes = [{ type: 'SOLID', color: COLORS.line }];
  card.strokeWeight = 1;

  // Header Row
  const headerRow = figma.createFrame();
  headerRow.layoutMode = "HORIZONTAL";
  headerRow.primaryAxisSizingMode = "AUTO";
  headerRow.counterAxisSizingMode = "AUTO";
  headerRow.layoutAlign = "STRETCH";
  headerRow.fills = [];
  
  const tag = await createPillBadge("意图核对 · 闸门生效中", false);
  headerRow.appendChild(tag);
  card.appendChild(headerRow);

  // Title
  const titleNode = figma.createText();
  titleNode.fontName = { family: "Inter", style: "Bold" };
  titleNode.characters = title || "意图核对 · 整理本地 D:\\Project 目录";
  titleNode.fontSize = 20;
  titleNode.fills = [{ type: 'SOLID', color: COLORS.ink }];
  titleNode.layoutAlign = "STRETCH";
  card.appendChild(titleNode);

  // Summary
  const descNode = figma.createText();
  descNode.fontName = { family: "Inter", style: "Regular" };
  descNode.characters = summary || "Agent 已识别出 8 个 Git 仓库与未分类草稿，将自动生成路径重构提案，全程支持 100% 撤销回滚。";
  descNode.fontSize = 14;
  descNode.fills = [{ type: 'SOLID', color: COLORS.ink2 }];
  descNode.layoutAlign = "STRETCH";
  card.appendChild(descNode);

  // Action Buttons Row
  const btnRow = figma.createFrame();
  btnRow.layoutMode = "HORIZONTAL";
  btnRow.primaryAxisSizingMode = "AUTO";
  btnRow.counterAxisSizingMode = "AUTO";
  btnRow.itemSpacing = 12;
  btnRow.fills = [];

  const btnApprove = await createPillBadge("批准执行 [Enter]", true);
  const btnEdit = await createPillBadge("修改方案 [E]", false);
  btnRow.appendChild(btnApprove);
  btnRow.appendChild(btnEdit);
  card.appendChild(btnRow);

  figma.currentPage.appendChild(card);
  figma.currentPage.selection = [card];
  figma.viewport.scrollAndZoomIntoView([card]);
  figma.notify("✓ 意图核对卡组件已成功生成在画布上！");
}

// 4. Create Adaptive Light Hint Bar
async function createLightHint(hintText) {
  await loadFonts();
  const bar = figma.createFrame();
  bar.name = "Component / Adaptive-Light-Hint";
  bar.layoutMode = "HORIZONTAL";
  bar.primaryAxisSizingMode = "AUTO";
  bar.counterAxisSizingMode = "FIXED";
  bar.resize(680, 48);
  bar.paddingLeft = 18;
  bar.paddingRight = 18;
  bar.itemSpacing = 12;
  bar.cornerRadius = 8;
  bar.fills = [{ type: 'SOLID', color: COLORS.dark }];
  bar.strokes = [{ type: 'SOLID', color: COLORS.ink3 }];
  bar.strokeWeight = 1;

  const badge = figma.createFrame();
  badge.layoutMode = "HORIZONTAL";
  badge.paddingLeft = 8;
  badge.paddingRight = 8;
  badge.paddingTop = 4;
  badge.paddingBottom = 4;
  badge.cornerRadius = 4;
  badge.fills = [{ type: 'SOLID', color: COLORS.accent }];
  
  const badgeText = figma.createText();
  badgeText.fontName = { family: "Inter", style: "Bold" };
  badgeText.characters = "B层适配";
  badgeText.fontSize = 11;
  badgeText.fills = [{ type: 'SOLID', color: COLORS.white }];
  badge.appendChild(badgeText);
  bar.appendChild(badge);

  const contentText = figma.createText();
  contentText.fontName = { family: "Inter", style: "Regular" };
  contentText.characters = hintText || "$ [Qwen3.6 适配] 遇到大目录易早停，已自动挂载深度优先遍历补偿策略";
  contentText.fontSize = 13;
  contentText.fills = [{ type: 'SOLID', color: COLORS.canvas }];
  contentText.layoutGrow = 1;
  bar.appendChild(contentText);

  figma.currentPage.appendChild(bar);
  figma.currentPage.selection = [bar];
  figma.viewport.scrollAndZoomIntoView([bar]);
  figma.notify("✓ 模型适配轻提示组件已生成！");
}

// 5. Create Desktop App Frame (1440x900)
async function createDesktopPage(pageTitle) {
  await loadFonts();
  const page = figma.createFrame();
  page.name = `Page / ${pageTitle || 'Wonderwall-Pi App'}`;
  page.resize(1440, 900);
  page.fills = [{ type: 'SOLID', color: COLORS.canvas }];
  
  // Header
  const header = figma.createFrame();
  header.name = "App-Header";
  header.layoutMode = "HORIZONTAL";
  header.layoutAlign = "STRETCH";
  header.primaryAxisSizingMode = "FIXED";
  header.counterAxisSizingMode = "FIXED";
  header.resize(1440, 64);
  header.paddingLeft = 40;
  header.paddingRight = 40;
  header.itemSpacing = 16;
  header.fills = [{ type: 'SOLID', color: COLORS.white }];
  header.strokes = [{ type: 'SOLID', color: COLORS.line }];
  header.strokeWeight = 1;

  const brand = figma.createText();
  brand.fontName = { family: "Inter", style: "Bold" };
  brand.characters = "Wonderwall-Pi Agent";
  brand.fontSize = 18;
  brand.fills = [{ type: 'SOLID', color: COLORS.ink }];
  header.appendChild(brand);

  page.appendChild(header);
  figma.currentPage.appendChild(page);
  figma.currentPage.selection = [page];
  figma.viewport.scrollAndZoomIntoView([page]);
  figma.notify(`✓ 桌面画板「${pageTitle}」已创建！`);
}

// ============================================================
// 整理 Pages · Page Butler
// ------------------------------------------------------------
// 只做两件事：改 figma.root.children 中每个 PageNode 的 name，
// 以及调整它们在 children 里的排列顺序。
// 不读取、不创建、不删除、不修改任何页面内部的图层 / 组件 / 样式。
// 因此「不动 DemoLab 里的内容」是结构上保证的，而不是靠约定。
// ============================================================

// 整理方案（改这里即可换规则）
const PAGE_PLAN = {
  archiveDate: "2026-09-11",

  // 改名规则。全部规则先解析出目标页面，再统一改名，避免改名链互相覆盖。
  //   from : 当前页名
  //   to   : 目标页名
  //   allowTargetTaken : 允许目标名此刻已被别的页面占用（默认 false）
  //
  // 幂等闸门：默认情况下，若文档里已存在名为 to 的页面，该规则直接跳过，
  // 判定「上次已经执行过」。这让插件可以安全地重复运行。
  // 只有「目标名正被另一个即将让位的页面占着」时才需要置 true ——
  // 例如把 DEMO Lab 扶正为 Main，而 Main 此刻正被旧 Main 占用。
  renames: [
    { from: "Pioneer · DEMO Lab", to: "Pioneer — Main", allowTargetTaken: true },
    { from: "Pioneer — Main", to: "Archive · Superseded Main · 2026-09-11" },
    { from: "HTML Demo · Final Sync 2026-09-05", to: "Archive · HTML Demo · 2026-09-05" }
  ],

  // 目标排列顺序；未列出的页保持相对顺序、追加在末尾
  order: [
    "Pioneer — Main",
    "Archive · Superseded Main · 2026-09-11",
    "Archive · Before Viridis · 2026-09-09",
    "Archive · Before Layout Polish · 2026-09-09",
    "Archive · HTML Demo · 2026-09-05"
  ]
};

// 归一化，用于宽松匹配（容忍空格 / 大小写 / 连字符 / 间隔号差异）
function normalizeName(name) {
  return String(name)
    .replace(/[\s\u00A0]+/g, "")
    .replace(/[—–‑−_]/g, "-")
    .replace(/[·•・]/g, "·")
    .toLowerCase();
}

// 只读：扫描当前页面并算出改名 / 排序方案，不产生任何写入
function buildPagePlan() {
  const pages = figma.root.children.slice();
  const claimed = {};
  const renameById = {};

  // 当前已占用的页名（归一化）
  const nameTaken = {};
  pages.forEach((p) => { nameTaken[normalizeName(p.name)] = true; });

  function findPage(from) {
    const exact = pages.filter((p) => p.name === from && !claimed[p.id])[0];
    if (exact) return exact;
    const key = normalizeName(from);
    return pages.filter((p) => !claimed[p.id] && normalizeName(p.name) === key)[0];
  }

  // 关键：先把「当前页名 -> 新页名」全部解析完，再执行改名。
  // 否则存在改名链冲突（Pioneer · DEMO Lab -> Pioneer — Main，
  // 同时 Pioneer — Main -> Archive · …），后者会匹配到刚被改名的那个。
  const applied = [];
  const skipped = [];
  const notFound = [];

  PAGE_PLAN.renames.forEach((rule) => {
    const page = findPage(rule.from);
    if (!page) {
      notFound.push(rule.from);
      return;
    }

    const alreadyNamed = normalizeName(page.name) === normalizeName(rule.to);
    const takenByOther = !alreadyNamed && nameTaken[normalizeName(rule.to)];

    if (takenByOther && !rule.allowTargetTaken) {
      skipped.push({ from: rule.from, to: rule.to, reason: "目标名已被占用，判定为上次已执行" });
      return;
    }

    claimed[page.id] = true;
    renameById[page.id] = rule.to;
    if (!alreadyNamed) applied.push({ from: page.name, to: rule.to });
  });

  const orderIndex = {};
  PAGE_PLAN.order.forEach((n, i) => { orderIndex[normalizeName(n)] = i; });

  const rows = pages.map((p, i) => {
    const next = Object.prototype.hasOwnProperty.call(renameById, p.id) ? renameById[p.id] : p.name;
    let status = "保持";
    if (next !== p.name) status = "改名";
    else if (/^Archive\s*·/.test(next)) status = "已归档";
    return { id: p.id, current: p.name, next: next, status: status, originalIndex: i };
  });

  // 排序：方案里列出的按方案顺序，未列出的保持相对顺序追加在末尾
  const planned = [];
  const rest = [];
  rows.forEach((r) => {
    const k = normalizeName(r.next);
    if (Object.prototype.hasOwnProperty.call(orderIndex, k)) planned.push({ row: r, rank: orderIndex[k] });
    else rest.push(r);
  });
  planned.sort((a, b) => a.rank - b.rank);
  const order = planned.map((x) => x.row).concat(rest);
  order.forEach((r, idx) => { r.target = idx; });

  return {
    rows: order,
    total: pages.length,
    renamedCount: rows.filter((r) => r.status === "改名").length,
    movedCount: rows.filter((r) => r.originalIndex !== r.target).length,
    applied: applied,
    skipped: skipped,
    notFound: notFound,
    // 一条规则都没匹配上 → 多半是打开错文件了，需要明确警告
    suspicious: applied.length === 0 && skipped.length === 0 && notFound.length === PAGE_PLAN.renames.length
  };
}

// 写入：按方案改名 + 重排，仅触碰 PageNode.name 与 children 顺序
function applyPagePlan() {
  const plan = buildPagePlan();
  const byId = {};
  figma.root.children.forEach((p) => { byId[p.id] = p; });

  // 1) 改名（全部目标节点引用此时已解析完毕）
  let renamed = 0;
  plan.rows.forEach((row) => {
    const page = byId[row.id];
    if (!page || page.removed) return;
    if (page.name !== row.next) {
      page.name = row.next;
      renamed++;
    }
  });

  // 2) 重排：保证第 i 位正好是方案里的第 i 页
  plan.rows.forEach((row, i) => {
    const page = byId[row.id];
    if (!page || page.removed) return;
    const children = figma.root.children;
    if (i < children.length && children[i].id !== page.id) {
      figma.root.insertChild(i, page);
    }
  });

  return { renamed: renamed, moved: plan.movedCount, total: plan.total };
}

// Message Listener from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'ui-ready') {
    figma.ui.postMessage({ type: 'pages-preview', plan: buildPagePlan() });
  } else if (msg.type === 'preview-pages') {
    figma.ui.postMessage({ type: 'pages-preview', plan: buildPagePlan() });
  } else if (msg.type === 'apply-pages') {
    const result = applyPagePlan();
    figma.notify(`✓ 页面已整理：${result.renamed} 个改名 / ${result.moved} 处顺序调整`);
    figma.ui.postMessage({ type: 'pages-applied', result: result, plan: buildPagePlan() });
  } else if (msg.type === 'sync-tokens') {
    await createDesignTokens();
  } else if (msg.type === 'create-intent-card') {
    await createIntentCard(msg.title, msg.summary, msg.steps);
  } else if (msg.type === 'create-light-hint') {
    await createLightHint(msg.hint);
  } else if (msg.type === 'create-desktop-page') {
    await createDesktopPage(msg.title);
  } else if (msg.type === 'eval-code') {
    try {
      const fn = new Function('figma', 'COLORS', 'loadFonts', msg.code);
      await fn(figma, COLORS, loadFonts);
      figma.notify("✓ 自定义指令执行成功！");
    } catch (err) {
      figma.notify("✕ 执行出错: " + err.message, { error: true });
    }
  }
};
