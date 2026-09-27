const fs = require("fs");
const path = require("path");

/* 可复现构建：base-scaffold.html（纯净基底，勿改） + 本目录增量文件 -> scaffold.html
   用法: node build_kj.cjs [输出路径]
   默认输出: <skill>/templates/scaffold.html（同时会再写一份到 templates/scaffold.html） */
const HERE = __dirname;
const SKILL = path.resolve(HERE, "..");
const SRC = path.join(SKILL, "templates", "base-scaffold.html");
const OUT = process.argv[2] || path.join(SKILL, "templates", "scaffold.html");
const INCR = (f) => fs.readFileSync(path.join(HERE, f), "utf8");

let html = fs.readFileSync(SRC, "utf8");
const before = html.length;
const must = (cond, msg) => { if (!cond) { console.error("FAIL: " + msg); process.exit(1); } };

/* ---------- 1. 标题 ---------- */
html = html.replace(/<title>[^<]*<\/title>/, "<title>科学实验演示课件框架 · 可编辑通用版</title>");
must(/科学实验演示课件框架/.test(html), "title");

/* ---------- 2. CSS 变量化 ---------- */
const styleStart = html.indexOf("<style>");
const styleEnd = html.indexOf("</style>");
must(styleStart > 0 && styleEnd > styleStart, "style block");
let css = html.slice(styleStart, styleEnd);

const rootSplit = css.indexOf("*{box-sizing:border-box;");
must(rootSplit > 0, "root split marker");
let head = css.slice(0, rootSplit);
let rest = css.slice(rootSplit);

const PAIRS = [
  ["border-spacing:0;background:#fff;", "border-spacing:0;background:var(--paper);"],
  ["#17483a", "var(--glow-1)"],
  ["#143d2e", "var(--glow-2)"],
  ["#174534", "var(--bar-1)"],
  ["#153f2f", "var(--bar-1)"],
  ["#0f3427", "var(--bar-2)"],
  ["#103226", "var(--bar-2)"],
  ["#1d5640", "var(--surf-btn)"],
  ["#15432f", "var(--surf-btn-2)"],
  ["#1c5138", "var(--surf-btn)"],
  ["#14402c", "var(--surf-btn-2)"],
  ["#16432f", "var(--surf)"],
  ["#113726", "var(--surf-2)"],
  ["#1f6a4c", "var(--surf-on)"],
  ["#175138", "var(--surf-on-2)"],
  ["#2c7c58", "var(--accent)"],
  ["#17492f", "var(--surf-on-2)"],
  ["#235c45", "var(--line-3)"],
  ["#245c45", "var(--line-3)"],
  ["#2a6a50", "var(--line-2)"],
  ["#2f7a58", "var(--line-strong)"],
  ["#3c8a67", "var(--accent)"],
  ["rgba(63,174,130,.08)", "var(--tint-08)"],
  ["rgba(63,174,130,.13)", "var(--tint-13)"],
  ["rgba(63,174,130,.10)", "var(--tint-10)"],
  ["rgba(95,208,160,.45)", "var(--tint-45)"],
  ["rgba(10,35,27,.6)", "var(--veil)"],
  ["#f2fbf7", "var(--paper)"],
  ["#dff0e7", "var(--scene-2)"],
  ["#cfe6da", "var(--scene-3)"],
  ["#2c6f53", "var(--scene-line)"],
  ["#cfe0d6", "var(--paper-line)"],
  ["#1e3a2f", "var(--ink)"],
  ["#eef7f1", "var(--paper-2)"],
  ["#c0392b", "var(--hot)"],
  ["#e2f2ea", "var(--paper-3)"],
  ["#14614a", "var(--ink-strong)"],
  ["#8fc4ac", "var(--ink-line)"],
  ["#fff8e6", "var(--note-bg)"],
  ["#e8a33d", "var(--note-line)"],
  ["#e9f7ef", "var(--good-bg)"],
  ["#2e9e6b", "var(--good-line)"],
  ["#b9d9c9", "var(--paper-line)"],
  ["#d9efe4", "var(--paper-3)"],
  ["#123528", "var(--bg-panel)"],
  ["#0e2c21", "var(--bg-panel-2)"],
  ["#ffe59e", "var(--gold-hover)"]
];
PAIRS.forEach(p => { rest = rest.split(p[0]).join(p[1]); });

const cssAdd = INCR("kj_css.css");
html = html.slice(0, styleStart) + head + rest + cssAdd + html.slice(styleEnd);
must(html.indexOf('html[data-theme="brown"]') > 0, "theme css appended");

/* ---------- 3. head 主题预置脚本 ---------- */
const headScript = '<script>window.FMG_THEME_KEY="fmg-kxsy-theme";(function(){try{var k=localStorage.getItem(window.FMG_THEME_KEY);if(k)document.documentElement.setAttribute("data-theme",k);}catch(e){}})();</script>\n';
html = html.replace("</head>", headScript + "</head>");
must(html.indexOf("FMG_THEME_KEY") > 0, "head theme script");

/* ---------- 4. 工具栏：撤销/重做 + 恢复示例课 + 换肤 ---------- */
const editLine = html.match(/[ \t]*<button class="tb-btn" id="editToggle"[^>]*>[^<]*<\/button>\r?\n/);
must(editLine, "editToggle line");
html = html.replace(editLine[0], editLine[0] +
  '  <button class="tb-btn" id="undoBtn" title="还原上一步（Ctrl+Z）" disabled style="opacity:.42">↶ 还原</button>\n' +
  '  <button class="tb-btn" id="redoBtn" title="恢复下一步（Ctrl+Shift+Z）" disabled style="opacity:.42">↷ 恢复</button>\n');
must(html.indexOf('id="undoBtn"') > 0 && html.indexOf('id="redoBtn"') > 0, "undo/redo buttons");

const resetLine = html.match(/[ \t]*<button class="tb-btn gold" id="resetBtn"[^>]*>♻️ 恢复默认<\/button>\r?\n/);
must(resetLine, "resetBtn line");
const resetNew = resetLine[0].replace("♻️ 恢复默认", "♻️ 恢复示例课");
html = html.replace(resetLine[0],
  resetNew +
  '  <button class="tb-btn" id="skinBtn" style="background:linear-gradient(145deg,#4a6fa5,#33507c);border-color:#7f9bc9;color:#fff">🎨 换肤</button>\n');
must(html.indexOf('id="skinBtn"') > 0, "skinBtn");
must(html.indexOf("恢复示例课") > 0, "reset renamed");

/* ---------- 5. 右侧「授课素材」分组 ---------- */
const tipMark = '        <div class="opt-group-title" data-page-node-id="ZfDTuYZmFtkbaH3Canb0nW">💡 学习提示</div>';
must(html.indexOf(tipMark) > 0, "learn-tip marker");
html = html.replace(tipMark,
  '        <div class="opt-group-title">🎬 授课素材 <button class="mat-add" data-mat-add="1" title="添加/管理本环节素材">＋</button></div>\n' +
  '        <div class="chips" id="matChips"></div>\n' + tipMark);
must(html.indexOf('id="matChips"') > 0, "matChips");

/* ---------- 6. 弹窗 HTML ---------- */
const htmlAdd = INCR("kj_html.html");
const scriptMark = '<script>\n"use strict";';
must(html.indexOf(scriptMark) > 0, "script mark");
html = html.replace(scriptMark, htmlAdd + "\n" + scriptMark);
must(html.indexOf('id="matModal"') > 0 && html.indexOf('id="secModal"') > 0, "modals");

/* ---------- 7. renderCenter：舞台外框 + 素材层 ---------- */
const rcOld = '  card.innerHTML = M.scene(s);\n  resetView(false);\n  if(M.init) M.init();';
must(html.indexOf(rcOld) > 0, "renderCenter card");
html = html.replace(rcOld,
  '  selMatId=null;\n' +
  '  card.innerHTML = \'<div class="stage-box" id="stageBox">\' + M.scene(s) + \'<div class="mat-layer" id="matLayer">\' + matsHtml(s) + \'</div></div>\';\n' +
  '  resetView(false);\n  if(M.init) M.init();\n  bindMatLayer();');

/* ---------- 8. renderList：排序 / 素材按钮 / 历史 ---------- */
const rlOld = "    d.innerHTML='<span class=\"idx\">'+(i+1)+'</span><span class=\"nm\">'+esc(s.title)+'</span><button class=\"del-btn\" title=\"删除\">✕</button>';\n" +
  "    d.querySelector(\".nm\").addEventListener(\"click\",()=>{ LESSON.activeId=s.id; saveLesson(true); renderAll(); });\n";
must(html.indexOf(rlOld) > 0, "renderList innerHTML");
const rlNew =
  "    d.innerHTML='<span class=\"idx\">'+(i+1)+'</span><span class=\"nm\">'+esc(s.title)+'</span>'+\n" +
  "      '<span class=\"sec-ops\">'+\n" +
  "      '<button class=\"mini-btn\" data-op=\"up\" title=\"上移\">▲</button>'+\n" +
  "      '<button class=\"mini-btn\" data-op=\"down\" title=\"下移\">▼</button>'+\n" +
  "      '<button class=\"mini-btn mmat\" data-op=\"mat\" title=\"授课素材\">🎬</button>'+\n" +
  "      '<button class=\"del-btn\" title=\"删除\">✕</button></span>';\n" +
  "    d.querySelector(\".nm\").addEventListener(\"click\",()=>{ LESSON.activeId=s.id; saveLesson(true); renderAll(); });\n" +
  "    d.querySelector('[data-op=\"up\"]').addEventListener(\"click\",e=>{ e.stopPropagation(); moveSec(i,-1); });\n" +
  "    d.querySelector('[data-op=\"down\"]').addEventListener(\"click\",e=>{ e.stopPropagation(); moveSec(i,1); });\n" +
  "    d.querySelector('[data-op=\"mat\"]').addEventListener(\"click\",e=>{ e.stopPropagation(); LESSON.activeId=s.id; saveLesson(true); renderAll(); openMatModal(-1); });\n";
html = html.replace(rlOld, rlNew);

const delOld = "      LESSON.sections = LESSON.sections.filter(x=>x.id!==s.id);\n      if(LESSON.activeId===s.id) LESSON.activeId = LESSON.sections[0].id;\n      saveLesson(true); renderAll();";
must(html.indexOf(delOld) > 0, "section delete");
html = html.replace(delOld,
  "      LESSON.sections = LESSON.sections.filter(x=>x.id!==s.id);\n      if(LESSON.activeId===s.id) LESSON.activeId = LESSON.sections[0].id;\n      selMatId=null; histSnap(\"sec-del\"); saveLesson(true); renderAll();");

/* ---------- 9. renderRight：渲染素材 chips ---------- */
const rrOld = '  $("anaAnalysis").textContent = s.analysis||"";';
must(html.indexOf(rrOld) > 0, "renderRight anchor");
html = html.replace(rrOld, '  renderMatChips(s);\n' + rrOld);

/* ---------- 10. 正文编辑：变更入历史 ---------- */
const beOld = 'function bindEditable(el, setter){\n  if(!el) return;\n  el.addEventListener("blur",()=>setter(el.innerText.trim()));\n}';
must(html.indexOf(beOld) > 0, "bindEditable");
html = html.replace(beOld,
  'function bindEditable(el, setter){\n' +
  '  if(!el) return;\n' +
  '  const txt=()=>String(el.innerText!=null?el.innerText:(el.textContent||"")).trim();\n' +
  '  el._fmgOld = txt();\n' +
  '  el.addEventListener("focus",()=>{ el._fmgOld = txt(); });\n' +
  '  el.addEventListener("blur",()=>{ const v=txt(); if(v!==el._fmgOld){ el._fmgOld=v; setter(v); histSnap("editable-"+el.id); } });\n' +
  '}');

/* ---------- 11. 器材/方案 chip 增删入历史 ---------- */
const chipOld = '    saveLesson(true); renderRight();\n  });\n});\n$("exportBtn")';
must(html.indexOf(chipOld) > 0, "add-chip handler");
html = html.replace(chipOld, '    histSnap("chip-"+key); saveLesson(true); renderRight();\n  });\n});\n$("exportBtn")');

const chipDel1 = 'renderChips($("equipChips"), s.equipOpts, i=>{ s.equipOpts.splice(i,1); saveLesson(true); renderRight(); }';
must(html.indexOf(chipDel1) > 0, "equip chip del");
html = html.replace(chipDel1, 'renderChips($("equipChips"), s.equipOpts, i=>{ s.equipOpts.splice(i,1); histSnap("chip-del-equip"); saveLesson(true); renderRight(); }');
const chipDel2 = 'renderChips($("planChips"), s.plans.map(p=>p.label), i=>{ s.plans.splice(i,1); saveLesson(true); renderRight(); }';
must(html.indexOf(chipDel2) > 0, "plan chip del");
html = html.replace(chipDel2, 'renderChips($("planChips"), s.plans.map(p=>p.label), i=>{ s.plans.splice(i,1); histSnap("chip-del-plan"); saveLesson(true); renderRight(); }');

/* ---------- 12. 恢复示例课入历史 ---------- */
const rstOld = '  LESSON=defaultLesson(); saveLesson(true); renderAll(); tip("♻️ 已恢复默认数据");';
must(html.indexOf(rstOld) > 0, "resetBtn handler");
html = html.replace(rstOld, '  selMatId=null; LESSON=defaultLesson(); histSnap("reset"); saveLesson(true); renderAll(); tip("♻️ 已恢复示例课件");');

/* ---------- 13. 注册 media 模块 + 追加新 JS + 初始化历史 ---------- */
const modLine = "const MODULES = {bottle:bottleMod, plastic:plasticMod, softbag:softbagMod, mass:massMod, sponge:spongeMod, balloon:balloonMod, balance:balanceMod, flybag:flybagMod, board:boardMod};";
must(html.indexOf(modLine) > 0, "MODULES line");

const jsAdd = INCR("kj_js.js");
const startMark = "/* ==================== 启动 ==================== */";
must(html.indexOf(startMark) > 0, "start mark");
html = html.replace(startMark,
  jsAdd + "\n" +
  "MODULES.media = mediaMod;\n" +
  'document.querySelector("[data-mat-add]").addEventListener("click",()=>openMatModal(-1));\n' +
  "histInit();\n" +
  "\n" + startMark);

/* ---------- 14. 替换「添加环节」旧逻辑 ---------- */
const addOld = '$("addSectionBtn").addEventListener("click",()=>{\n' +
  '  const t=prompt("新环节名称：","任务六");\n' +
  '  if(!t) return;\n' +
  '  const id="s"+Date.now().toString(36);\n' +
  '  LESSON.sections.push({id:id,title:t,module:"board",equip:"",equipOpts:[],plans:[],analysis:"",principle:"",examples:"",board:\'<h4>\'+esc(t)+\'</h4><p>在这里填写本环节内容（编辑模式下可直接在页面文字区修改）。</p>\'});\n' +
  '  LESSON.activeId=id; saveLesson(true); renderAll();\n' +
  '});';
must(html.indexOf(addOld) > 0, "old addSectionBtn");
html = html.replace(addOld,
  '$("addSectionBtn").addEventListener("click",()=>{\n' +
  '  $("s-title").value="任务"+(LESSON.sections.length+1);\n' +
  '  $("secModal").classList.add("show");\n' +
  '});');

/* ---------- 15. 编辑模式提示语 ---------- */
const tipOld = 'tip(on ? "✏️ 编辑模式：可直接修改文字；器材/方案右侧 ＋ 可添加选项；左侧可增删环节" : "🔒 已退出编辑模式");';
must(html.indexOf(tipOld) > 0, "edit tip");
html = html.replace(tipOld,
  'tip(on ? "✏️ 编辑模式：左侧 ▲▼ 调顺序、🎬 管素材；舞台上拖动素材移动、拖八个控制点缩放；工具栏 ↶还原 / ↷恢复 可撤销重做（Ctrl+Z）" : "🔒 已退出编辑模式");');
const setEditOld = 'function setEditMode(on){\n  editMode=on; document.body.classList.toggle("edit-mode", on);';
must(html.indexOf(setEditOld) > 0, "setEditMode head");
html = html.replace(setEditOld,
  'function setEditMode(on){\n  editMode=on; if(!on) selMat(null);\n  document.body.classList.toggle("edit-mode", on);');

/* ---------- 16. 默认数据增加「素材展示」示例环节（多素材共存） ---------- */
const arrEnd = "      }\n    ]\n  };\n}";
must(html.indexOf(arrEnd) > 0, "defaultLesson array end");
const mediaSec =
  "      },\n" +
  "      {\n" +
  "        id:\"media\", title:\"素材展示（示例）\", module:\"media\",\n" +
  "        equip:\"多媒体课件\",\n" +
  "        equipOpts:[\"多媒体课件\"],\n" +
  "        plans:[{id:\"mm1\",label:\"默认\"}],\n" +
  "        analysis:\"\", principle:\"\", examples:\"\", board:\"\",\n" +
  "        materials:[\n" +
  "          {id:\"mdemo1\", type:\"text\", name:\"标题文字\", text:\"在这里输入要展示的文字\", x:6, y:7, w:56, h:12, fontSize:30, color:\"#14614a\", weight:\"700\", align:\"left\", rich:false, src:\"\", controls:true, autoplay:false, loop:false},\n" +
  "          {id:\"mdemo2\", type:\"text\", name:\"说明文字\", text:\"同一环节可以放多个素材：视频、音频、图片、文字可以共存。\\n开启编辑模式后，拖动可移动，拖八个控制点可缩放。\", x:6, y:24, w:52, h:26, fontSize:18, color:\"#3d5c50\", weight:\"\", align:\"left\", rich:false, src:\"\", controls:true, autoplay:false, loop:false},\n" +
  "          {id:\"mdemo3\", type:\"text\", name:\"重点标注\", text:\"★ 重点结论写在这里\", x:64, y:70, w:30, h:14, fontSize:22, color:\"#c0392b\", weight:\"700\", align:\"center\", rich:false, src:\"\", controls:true, autoplay:false, loop:false}\n" +
  "        ]\n" +
  "      }";
html = html.replace(arrEnd, mediaSec + "\n    ]\n  };\n}");

/* ---------- 写盘 ---------- */
fs.writeFileSync(OUT, html, "utf8");
fs.writeFileSync(path.join(SKILL, "templates", "scaffold.html"), html, "utf8");
console.log("BUILD_OK");
console.log("  in :", before, "bytes");
console.log("  out:", html.length, "bytes");
console.log("  ->", OUT);
