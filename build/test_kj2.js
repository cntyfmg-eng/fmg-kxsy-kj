const fs = require("fs");
const { JSDOM } = require("jsdom");

const FILE = "H:/WorkBuddy/科学课件平台/科学实验演示课件框架.html";
let html = fs.readFileSync(FILE, "utf8");
const EXPOSE = "\n;window.__T={LESSON:function(){return LESSON;}, MODULES:MODULES, HIST:HIST, sec:sec," +
  " secMats:secMats, selMat:selMat, selMatId:function(){return selMatId;}, histSnap:histSnap," +
  " undo:histUndo, redo:histRedo, SKINS:SKINS, editMode:function(){return editMode;}," +
  " setEditMode:setEditMode, moveSec:moveSec, openMatModal:openMatModal, refreshMats:refreshMats};";
const anchor = '/* ==================== 启动 ==================== */\nrenderAll();\n';
if (html.indexOf(anchor) < 0) { console.error("ANCHOR MISSING"); process.exit(1); }
html = html.replace(anchor, anchor + EXPOSE + "\n", 1);

const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/" });
const win = dom.window, doc = win.document;

const results = [];
const ok = (name, cond, extra) => results.push({ name, ok: !!cond, extra: extra === undefined ? "" : String(extra) });

function pev(el, type, x, y) {
  const e = new win.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
}
function pevWin(type, x, y) {
  const e = new win.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true });
  win.dispatchEvent(e);
}
const rect = (l, t, w, h) => () => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h, x: l, y: t });

setTimeout(() => {
  const T = win.__T;
  ok("page loaded (__T exposed)", !!T);
  if (!T) { report(); return; }

  /* ---------- 工具栏结构 ---------- */
  const tb = [...doc.querySelectorAll(".toolbar .tb-btn")].map(b => b.id);
  ok("toolbar has undoBtn/redoBtn", tb.includes("undoBtn") && tb.includes("redoBtn"), tb.join(","));
  ok("skinBtn after resetBtn", tb.indexOf("skinBtn") === tb.indexOf("resetBtn") + 1, tb.join(","));
  ok("reset label = 恢复示例课", /恢复示例课/.test(doc.getElementById("resetBtn").textContent));
  ok("undo disabled initially", doc.getElementById("undoBtn").disabled === true);
  ok("redo disabled initially", doc.getElementById("redoBtn").disabled === true);
  ok("HIST seeded with 1", T.HIST.stack.length === 1 && T.HIST.i === 0, "len=" + T.HIST.stack.length);

  /* ---------- 环节排序 ---------- */
  const secs0 = T.LESSON().sections.map(s => s.id);
  ok("has >=4 sections", secs0.length >= 4, secs0.length);
  T.moveSec(0, 1);
  const secs1 = T.LESSON().sections.map(s => s.id);
  ok("moveSec swaps order", secs1[0] === secs0[1] && secs1[1] === secs0[0], secs1.join(","));
  ok("moveSec pushed history", T.HIST.i === 1, "i=" + T.HIST.i);
  T.undo();
  ok("undo restores section order", T.LESSON().sections.map(s => s.id).join(",") === secs0.join(","));
  ok("undo moved index back", T.HIST.i === 0, "i=" + T.HIST.i);
  T.redo();
  ok("redo re-applies order", T.LESSON().sections.map(s => s.id).join(",") === secs1.join(","));
  T.undo();

  /* ---------- 进入素材示例环节 ---------- */
  const mediaSec = T.LESSON().sections.find(s => s.module === "media");
  ok("default lesson has media section", !!mediaSec);
  T.LESSON().activeId = mediaSec.id;
  win.eval("renderAll()");

  const mats0 = doc.querySelectorAll("#matLayer .mat");
  ok("3 demo materials coexist", mats0.length === 3, "count=" + mats0.length);
  const types = T.secMats(T.sec()).map(m => m.type);
  ok("all demo materials are text", types.every(t => t === "text"), types.join(","));

  /* ---------- 编辑模式 + 选中素材 ---------- */
  T.setEditMode(true);
  ok("editMode on", T.editMode() === true);

  const first = doc.querySelector("#matLayer .mat");
  const mid = first.dataset.mid;
  const m0 = T.secMats(T.sec()).find(x => x.id === mid);
  const w0 = m0.w, h0 = m0.h, x0 = m0.x, y0 = m0.y;

  T.selMat(mid);
  ok("selMatId set", T.selMatId() === mid);
  ok("selected has .sel", first.classList.contains("sel"));
  ok("8 resize handles rendered", first.querySelectorAll(".mh").length === 8, first.querySelectorAll(".mh").length);
  ok("float toolbar rendered", !!first.querySelector(".mat-bar"));
  ok("toolbar has 5 buttons", first.querySelectorAll(".mat-bar button").length === 5);

  /* ---------- 拖动缩放（se 手柄） ---------- */
  const box = doc.getElementById("stageBox");
  box.getBoundingClientRect = rect(0, 0, 1000, 600);
  first.getBoundingClientRect = rect(0, 0, w0 / 100 * 1000, h0 / 100 * 600);
  const se = first.querySelector(".mh-se");
  pev(se, "pointerdown", 100, 100);
  pevWin("pointermove", 200, 260);           // +100px x (=>+10%), +160px y (=>+26.67%)
  pevWin("pointerup", 200, 260);
  const m1 = T.secMats(T.sec()).find(x => x.id === mid);
  ok("resize changed width", Math.abs(m1.w - (w0 + 10)) < 0.6, "w " + w0 + "->" + m1.w.toFixed(2));
  ok("resize changed height", Math.abs(m1.h - (h0 + 26.67)) < 0.8, "h " + h0 + "->" + m1.h.toFixed(2));
  ok("resize kept x/y", Math.abs(m1.x - x0) < 0.01 && Math.abs(m1.y - y0) < 0.01);

  /* ---------- 撤销缩放 ---------- */
  T.undo();
  const m2 = T.secMats(T.sec()).find(x => x.id === mid);
  ok("undo restored size", Math.abs(m2.w - w0) < 0.01 && Math.abs(m2.h - h0) < 0.01, m2.w + "x" + m2.h);
  T.redo();
  const m3 = T.secMats(T.sec()).find(x => x.id === mid);
  ok("redo re-applied size", Math.abs(m3.w - (w0 + 10)) < 0.6, m3.w.toFixed(2));
  T.undo();

  /* ---------- 拖动移动 ---------- */
  const box2 = doc.getElementById("stageBox");
  box2.getBoundingClientRect = rect(0, 0, 1000, 600);
  const el2 = doc.querySelector("#matLayer .mat");
  el2.getBoundingClientRect = rect(x0 / 100 * 1000, y0 / 100 * 600, 560, 120);
  pev(el2, "pointerdown", 100, 100);
  pevWin("pointermove", 300, 220);            // dx=200px => +20%, dy=120px => +20%
  pevWin("pointerup", 300, 220);
  const m4 = T.secMats(T.sec()).find(x => x.id === mid);
  ok("drag moved x", Math.abs(m4.x - (x0 + 20)) < 0.6, "x " + x0 + "->" + m4.x.toFixed(2));
  ok("drag moved y", Math.abs(m4.y - (y0 + 20)) < 0.8, "y " + y0 + "->" + m4.y.toFixed(2));
  T.undo();
  const m5 = T.secMats(T.sec()).find(x => x.id === mid);
  ok("undo restored position", Math.abs(m5.x - x0) < 0.01 && Math.abs(m5.y - y0) < 0.01);

  /* ---------- 新增素材：多类型共存 ---------- */
  const before = T.secMats(T.sec()).length;
  doc.querySelector('[data-add-mat="video"]').dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  doc.querySelector('[data-add-mat="audio"]').dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  doc.querySelector('[data-add-mat="image"]').dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  const after = T.secMats(T.sec());
  ok("3 materials added", after.length === before + 3, before + "->" + after.length);
  ok("video+audio+image+text coexist",
    ["video", "audio", "image", "text"].every(t => after.some(m => m.type === t)));
  ok("layer renders all mats", doc.querySelectorAll("#matLayer .mat").length === after.length,
    doc.querySelectorAll("#matLayer .mat").length);
  ok("video mat has .pm (interactive)", !!doc.querySelector('#matLayer .mat.pm video'));
  T.undo(); T.undo(); T.undo();
  ok("undo x3 removes added materials", T.secMats(T.sec()).length === before, T.secMats(T.sec()).length);
  T.redo(); T.redo(); T.redo();
  ok("redo x3 restores them", T.secMats(T.sec()).length === before + 3);

  /* ---------- 已有实验环节追加素材（不替换原内容） ---------- */
  const expSec = T.LESSON().sections.find(s => s.module === "bottle") || T.LESSON().sections.find(s => s.module !== "media");
  T.LESSON().activeId = expSec.id;
  win.eval("renderAll()");
  const svgBefore = doc.querySelectorAll("#stageBox svg").length;
  ok("experiment section renders svg scene", svgBefore > 0, "svg=" + svgBefore);
  const expMatsBefore = T.secMats(T.sec()).length;
  doc.querySelector('[data-add-mat="text"]').dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  const svgAfter = doc.querySelectorAll("#stageBox svg").length;
  ok("svg scene preserved after adding material", svgAfter === svgBefore, svgBefore + "->" + svgAfter);
  ok("material added to experiment section", T.secMats(T.sec()).length === expMatsBefore + 1);
  ok("material rendered over experiment", doc.querySelectorAll("#matLayer .mat").length === expMatsBefore + 1);
  T.undo();
  ok("undo removes it, svg still there",
    T.secMats(T.sec()).length === expMatsBefore && doc.querySelectorAll("#stageBox svg").length === svgBefore);

  /* ---------- 换肤 ---------- */
  const skinBtn = doc.getElementById("skinBtn");
  skinBtn.dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  const menu = doc.getElementById("skinMenu");
  ok("skin menu opens", menu.classList.contains("show"));
  ok("5 skin options", menu.querySelectorAll(".skin-opt").length === 5, menu.querySelectorAll(".skin-opt").length);
  const labels = [...menu.querySelectorAll(".skin-opt")].map(b => b.textContent.trim());
  ok("has 浅蓝色/深蓝色/浅灰色/深褐色",
    ["浅蓝色", "深蓝色", "浅灰色", "深褐色"].every(n => labels.some(l => l.indexOf(n) >= 0)), labels.join("|"));
  [...menu.querySelectorAll(".skin-opt")].find(b => b.textContent.indexOf("浅蓝色") >= 0)
    .dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  ok("theme switched to sky", doc.documentElement.getAttribute("data-theme") === "sky",
    doc.documentElement.getAttribute("data-theme"));
  [...menu.querySelectorAll(".skin-opt")].find(b => b.textContent.indexOf("深褐色") >= 0)
    .dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
  ok("theme switched to brown", doc.documentElement.getAttribute("data-theme") === "brown");

  report();
}, 700);

function report() {
  const pass = results.filter(r => r.ok).length;
  results.forEach(r => console.log((r.ok ? "PASS  " : "FAIL  ") + r.name + (r.extra ? "   [" + r.extra + "]" : "")));
  console.log("\n==== " + pass + "/" + results.length + " passed ====");
  win.close();
  process.exit(pass === results.length ? 0 : 1);
}
