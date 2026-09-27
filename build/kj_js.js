
/* ==================== 主题换肤（墨绿 / 浅蓝 / 深蓝 / 浅灰 / 深褐） ==================== */
const SKINS=[
  {k:"green",n:"墨绿色（默认）",c:"#123528"},
  {k:"sky",n:"浅蓝色",c:"#e9f2fb"},
  {k:"navy",n:"深蓝色",c:"#0b1a2e"},
  {k:"gray",n:"浅灰色",c:"#ececec"},
  {k:"brown",n:"深褐色",c:"#1e1611"}
];
function applyTheme(k){
  document.documentElement.setAttribute("data-theme",k);
  try{ localStorage.setItem(window.FMG_THEME_KEY, k); }catch(e){}
}
function markSkin(k){ [...$("skinMenu").querySelectorAll(".skin-opt")].forEach(b=>b.classList.toggle("on", b.dataset.k===k)); }
(function initSkin(){
  const menu=$("skinMenu");
  SKINS.forEach(s=>{
    const b=document.createElement("button");
    b.className="skin-opt"; b.dataset.k=s.k;
    b.innerHTML='<span class="sw" style="background:'+s.c+'"></span>'+esc(s.n);
    b.addEventListener("click",()=>{ applyTheme(s.k); markSkin(s.k); menu.classList.remove("show"); tip("🎨 已切换主题："+s.n); });
    menu.appendChild(b);
  });
  let cur=null;
  try{ cur=localStorage.getItem(window.FMG_THEME_KEY); }catch(e){}
  if(!cur){
    const attr=document.documentElement.getAttribute("data-theme");
    cur = SKINS.some(s=>s.k===attr) ? attr : "green";
  }
  if(!SKINS.some(s=>s.k===cur)) cur="green";
  document.documentElement.setAttribute("data-theme",cur);
  markSkin(cur);
  $("skinBtn").addEventListener("click",e=>{
    e.stopPropagation();
    if(menu.classList.contains("show")){ menu.classList.remove("show"); return; }
    menu.classList.add("show");
    const r=$("skinBtn").getBoundingClientRect();
    const mw=menu.offsetWidth, mh=menu.offsetHeight;
    menu.style.left=Math.max(8, Math.min(window.innerWidth-mw-8, r.left))+"px";
    menu.style.top=Math.max(8, r.top-mh-8)+"px";
  });
  document.addEventListener("click",e=>{
    if(!menu.contains(e.target) && e.target!==$("skinBtn")) menu.classList.remove("show");
  });
})();

/* ==================== 撤销 / 重做（还原 / 恢复） ==================== */
const HIST={stack:[], i:-1, last:0, label:""};
function histInit(){
  HIST.stack=[JSON.stringify(LESSON)]; HIST.i=0; HIST.last=0; HIST.label="";
  histSync();
}
function histSnap(label){
  try{
    const json=JSON.stringify(LESSON), now=Date.now();
    if(HIST.i>=0 && HIST.label===label && now-HIST.last<900){ HIST.stack[HIST.i]=json; HIST.last=now; histSync(); return; }
    HIST.stack=HIST.stack.slice(0,HIST.i+1);
    HIST.stack.push(json);
    if(HIST.stack.length>100) HIST.stack.shift();
    HIST.i=HIST.stack.length-1; HIST.last=now; HIST.label=label;
    histSync();
  }catch(e){}
}
function histSync(){
  const u=$("undoBtn"), r=$("redoBtn");
  if(u){ u.disabled = HIST.i<=0; u.style.opacity = HIST.i<=0 ? ".42":"1"; u.title = HIST.i<=0 ? "还原上一步（无可还原操作）" : "还原上一步（Ctrl+Z）· 还有 "+HIST.i+" 步"; }
  if(r){ const n=HIST.stack.length-1-HIST.i; r.disabled = n<=0; r.style.opacity = n<=0 ? ".42":"1"; r.title = n<=0 ? "恢复下一步（无可恢复操作）" : "恢复下一步（Ctrl+Shift+Z）· 还有 "+n+" 步"; }
}
function histApply(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(LESSON)); }catch(e){}
  renderAll();
  if(matEditIdx>=secMats(sec()).length) matEditIdx=secMats(sec()).length-1;
  renderMatList(); renderMatForm();
  histSync();
}
/* 撤销/重做时保留用户当前所在环节，避免视图跳走 */
function histKeep(){
  const aid = LESSON.activeId;
  if(!LESSON.sections.some(s=>s.id===aid)) LESSON.activeId = LESSON.sections[0].id;
}
function histUndo(){
  if(HIST.i<=0){ tip("⚠️ 已经是最早的状态，无法再还原"); return; }
  const aid = LESSON.activeId;
  HIST.i--; LESSON=JSON.parse(HIST.stack[HIST.i]);
  if(LESSON.sections.some(s=>s.id===aid)) LESSON.activeId=aid;
  histKeep(); histApply(); tip("↶ 已还原上一步（还可还原 "+HIST.i+" 步）");
}
function histRedo(){
  if(HIST.i>=HIST.stack.length-1){ tip("⚠️ 已经是最新状态，没有可恢复的操作"); return; }
  const aid = LESSON.activeId;
  HIST.i++; LESSON=JSON.parse(HIST.stack[HIST.i]);
  if(LESSON.sections.some(s=>s.id===aid)) LESSON.activeId=aid;
  histKeep(); histApply(); tip("↷ 已恢复下一步（还可恢复 "+(HIST.stack.length-1-HIST.i)+" 步）");
}
$("undoBtn").addEventListener("click",histUndo);
$("redoBtn").addEventListener("click",histRedo);
document.addEventListener("keydown",e=>{
  if(!(e.ctrlKey||e.metaKey)) return;
  const t=e.target;
  if(t && (t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable)) return;
  const k=(e.key||"").toLowerCase();
  if(k==="z" && !e.shiftKey){ e.preventDefault(); histUndo(); }
  else if((k==="z" && e.shiftKey) || k==="y"){ e.preventDefault(); histRedo(); }
});

/* ==================== 模块中文名（添加环节用） ==================== */
const MODULE_LABELS={
  bottle:"透明瓶+漏斗+橡皮泥（空气占空间）",
  plastic:"弹性塑料瓶（压缩空气有力）",
  softbag:"软塑料包+橡皮筋（负压吸水）",
  mass:"皮球+打气筒+电子秤（空气有质量）",
  sponge:"保鲜袋+干湿海绵（小孔藏空气）",
  balloon:"瓶中气球（留出口才吹得大）",
  balance:"纸杯天平（热空气上升）",
  flybag:"模拟热气球（热空气上升）",
  board:"图文页（纯文字/图片说明）",
  media:"素材页（视频/音频/图片/文字）"
};

/* ==================== 素材页模块（空白舞台，可自由摆放素材） ==================== */
const mediaMod = {
  scene(secObj){
    const has=(secObj.materials||[]).length;
    return '<div class="media-canvas"></div>'+(has?'':'<div class="media-empty">本环节为「素材展示页」。<br>开启编辑模式后，点右侧「🎬 授课素材」的 ＋ 添加视频 / 音频 / 图片 / 文字；<br>素材可用鼠标<b>拖动移动</b>、拖<b>八个控制点缩放</b>。</div>');
  },
  init(){}, setPlan(){}, reset(){},
  steps(){ return [{t:"本环节为「素材展示页」：可直接播放视频/音频、查看图片与文字。开启编辑模式后，可在演示区拖动素材移动位置、拖控制点缩放大小。", ms:2000}]; }
};

/* ==================== 授课素材（视频 / 音频 / 图片 / 文字） ==================== */
const MAT_ICON={video:"🎥",audio:"🎵",image:"🖼",text:"📝"};
const MAT_DIRS=["nw","n","ne","e","se","s","sw","w"];
let selMatId=null;
function secMats(s){ if(!Array.isArray(s.materials)) s.materials=[]; return s.materials; }
function num(v,d){ const n=Number(v); return isFinite(n)?n:d; }
function safeUrl(u){ u=String(u==null?"":u).trim(); return /^javascript:/i.test(u)?"":u; }
function newMat(type, count){
  const base={video:{w:44,h:36},audio:{w:34,h:16},image:{w:32,h:38},text:{w:48,h:14}}[type]||{w:30,h:20};
  const k=count||0;
  return {id:"m"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    type:type, name:({video:"视频素材",audio:"音频素材",image:"图片素材",text:"文字素材"})[type]||"素材",
    src:"", text:type==="text"?"在这里输入要展示的文字":"",
    x:6+(k%4)*5, y:6+(k%4)*5, w:base.w, h:base.h,
    fontSize:24, color:"#14614a", weight:"", align:"left", rich:false,
    controls:true, autoplay:false, loop:false};
}
function matsHtml(s){ return secMats(s).map(matHtml).join(""); }
function matHtml(m){
  const pos="left:"+num(m.x,6)+"%;top:"+num(m.y,6)+"%;width:"+num(m.w,30)+"%;height:"+num(m.h,20)+"%;";
  const pm=(m.type==="video"||m.type==="audio")?" pm":"";
  if(m.type==="video"){
    return '<div class="mat'+pm+'" data-mid="'+m.id+'" style="'+pos+'"><video src="'+esc(safeUrl(m.src))+'" style="width:100%;height:100%;object-fit:contain;background:#000;border-radius:8px;display:block"'+(m.controls?" controls":"")+(m.autoplay?" autoplay":"")+(m.loop?" loop":"")+' playsinline preload="metadata"></video></div>';
  }
  if(m.type==="audio"){
    return '<div class="mat'+pm+'" data-mid="'+m.id+'" style="'+pos+'"><div class="mat-audio">🎵 '+esc(m.name||"音频")+'<audio src="'+esc(safeUrl(m.src))+'" style="width:100%;margin-top:6px;display:block"'+(m.controls?" controls":"")+(m.autoplay?" autoplay":"")+(m.loop?" loop":"")+' preload="metadata"></audio></div></div>';
  }
  if(m.type==="image"){
    return '<div class="mat" data-mid="'+m.id+'" style="'+pos+'"><img src="'+esc(safeUrl(m.src))+'" alt="'+esc(m.name||"")+'" style="width:100%;height:100%;object-fit:contain;border-radius:8px;display:block"></div>';
  }
  const body = m.rich ? (m.text||"") : esc(m.text||"").replace(/\n/g,"<br>");
  const st = pos+"font-size:"+num(m.fontSize,24)+"px;color:"+(m.color||"var(--ink)")+";font-weight:"+(m.weight||"")+";text-align:"+(m.align||"left")+";line-height:1.6;white-space:pre-wrap;";
  return '<div class="mat" data-mid="'+m.id+'" style="'+st+'">'+body+'</div>';
}
function matEl(mid){ const l=$("matLayer"); return l ? l.querySelector('.mat[data-mid="'+mid+'"]') : null; }
function refreshMats(){
  const l=$("matLayer"); if(!l) return;
  l.innerHTML=matsHtml(sec());
  bindMatLayer();
}
/* ---- 选中素材：显示 8 个缩放控制点 + 浮动工具条 ---- */
function clearSel(){
  const l=$("matLayer"); if(!l) return;
  l.querySelectorAll(".mat").forEach(el=>{
    el.classList.remove("sel");
    el.querySelectorAll(".mh,.mat-bar").forEach(n=>n.remove());
  });
}
function selMat(mid){
  clearSel(); selMatId=mid||null;
  if(!mid) return;
  const el=matEl(mid); if(!el) { selMatId=null; return; }
  el.classList.add("sel");
  MAT_DIRS.forEach(d=>{
    const h=document.createElement("div");
    h.className="mh mh-"+d; h.dataset.dir=d; h.title="拖动缩放";
    el.appendChild(h);
    h.addEventListener("pointerdown",e=>startResize(e,mid,d));
  });
  const bar=document.createElement("div");
  bar.className="mat-bar";
  bar.innerHTML=
    '<button data-a="edit" title="打开素材设置">✎ 设置</button>'+
    '<button data-a="up" title="上移一层">▲</button>'+
    '<button data-a="down" title="下移一层">▼</button>'+
    '<button data-a="top" title="置于顶层">⤒</button>'+
    '<button data-a="del" title="删除素材">✕</button>';
  bar.style.top = (num(secMats(sec()).find(x=>x.id===mid)?.y, 0) < 9) ? "4px" : "-34px";
  bar.addEventListener("pointerdown",e=>e.stopPropagation());
  bar.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click",e=>{
      e.stopPropagation(); e.preventDefault();
      const s=sec(), ms=secMats(s); const i=ms.findIndex(x=>x.id===mid); if(i<0) return;
      const a=b.dataset.a;
      if(a==="edit"){ openMatModal(i); return; }
      if(a==="up" && i<ms.length-1){ const t=ms[i]; ms[i]=ms[i+1]; ms[i+1]=t; }
      if(a==="down" && i>0){ const t=ms[i]; ms[i]=ms[i-1]; ms[i-1]=t; }
      if(a==="top"){ ms.push(ms.splice(i,1)[0]); }
      if(a==="del"){ ms.splice(i,1); selMatId=null; }
      histSnap("matbar-"+a+"-"+mid); saveLesson(true); refreshMats(); renderMatList(); renderMatForm(); renderRight();
      tip(a==="del" ? "🗑 已删除素材" : "🧩 素材层级已调整");
    });
  });
  el.appendChild(bar);
}
/* ---- 拖动缩放 ---- */
function startResize(e,mid,dir){
  if(!editMode) return;
  e.preventDefault(); e.stopPropagation();
  const s=sec(); const m=secMats(s).find(x=>x.id===mid); if(!m) return;
  const box=$("stageBox"); if(!box) return;
  const br=box.getBoundingClientRect();
  const el=matEl(mid); if(!el) return;
  const x0=num(m.x,0), y0=num(m.y,0), w0=num(m.w,30), h0=num(m.h,20);
  const sx=e.clientX, sy=e.clientY;
  el.classList.add("resizing");
  const move=ev=>{
    const dx=(ev.clientX-sx)/br.width*100, dy=(ev.clientY-sy)/br.height*100;
    let x=x0,y=y0,w=w0,h=h0;
    if(dir.indexOf("e")>=0) w=Math.max(3, Math.min(100-x0, w0+dx));
    if(dir.indexOf("s")>=0) h=Math.max(3, Math.min(100-y0, h0+dy));
    if(dir.indexOf("w")>=0){ const nx=Math.max(0, Math.min(x0+w0-3, x0+dx)); w=w0+(x0-nx); x=nx; }
    if(dir.indexOf("n")>=0){ const ny=Math.max(0, Math.min(y0+h0-3, y0+dy)); h=h0+(y0-ny); y=ny; }
    m.x=x; m.y=y; m.w=w; m.h=h;
    el.style.left=x+"%"; el.style.top=y+"%"; el.style.width=w+"%"; el.style.height=h+"%";
  };
  const up=()=>{
    el.classList.remove("resizing");
    window.removeEventListener("pointermove",move);
    window.removeEventListener("pointerup",up);
    histSnap("mat-resize-"+mid); saveLesson(true); syncMatForm();
    selMat(mid);
    tip("📐 素材已缩放：W "+Math.round(num(m.w,0))+"% · H "+Math.round(num(m.h,0))+"%");
  };
  window.addEventListener("pointermove",move);
  window.addEventListener("pointerup",up);
}
/* ---- 拖动移动 + 选中 ---- */
function bindMatLayer(){
  const box=$("stageBox"); if(!box) return;
  if(!box._mb){
    box._mb=true;
    box.addEventListener("pointerdown",e=>{
      if(editMode && !e.target.closest(".mat")) selMat(null);
    });
  }
  box.querySelectorAll(".mat").forEach(el=>{
    if(el._md) return; el._md=true;
    el.addEventListener("pointerdown",e=>{
      if(!editMode) return;
      if(e.target.closest("video,audio,input,button,a,textarea,.mh,.mat-bar")) return;
      const s=sec(); const m=secMats(s).find(x=>x.id===el.dataset.mid); if(!m) return;
      selMat(m.id);
      e.preventDefault(); e.stopPropagation();
      const br=box.getBoundingClientRect(), er=el.getBoundingClientRect();
      const offX=e.clientX-er.left, offY=e.clientY-er.top;
      el.classList.add("dragging");
      let moved=false;
      const move=ev=>{
        moved=true;
        m.x=Math.max(0,Math.min(100-num(m.w,0),(ev.clientX-br.left-offX)/br.width*100));
        m.y=Math.max(0,Math.min(100-num(m.h,0),(ev.clientY-br.top-offY)/br.height*100));
        el.style.left=m.x+"%"; el.style.top=m.y+"%";
      };
      const up=()=>{
        el.classList.remove("dragging");
        window.removeEventListener("pointermove",move);
        window.removeEventListener("pointerup",up);
        if(moved){ histSnap("mat-move-"+m.id); saveLesson(true); syncMatForm(); tip("📍 素材位置已更新：X "+Math.round(m.x)+"% · Y "+Math.round(m.y)+"%"); }
      };
      window.addEventListener("pointermove",move);
      window.addEventListener("pointerup",up);
    });
  });
  if(selMatId) selMat(selMatId);
}
function renderMatChips(s){
  const ms=secMats(s);
  renderChips($("matChips"), ms.map(m=>(MAT_ICON[m.type]||"📦")+" "+m.name),
    i=>{ secMats(s).splice(i,1); histSnap("mat-del"); saveLesson(true); renderRight(); refreshMats(); },
    false,
    (label,i)=>{ openMatModal(i); selMat(ms[i] ? ms[i].id : null); });
}

/* ==================== 环节排序 ==================== */
function moveSec(i,d){
  const a=LESSON.sections; const j=i+d;
  if(j<0||j>=a.length){ tip("⚠️ 已经在最"+(d<0?"前":"后")+"面了"); return; }
  const t=a[i]; a[i]=a[j]; a[j]=t;
  histSnap("sec-move"); saveLesson(true); renderAll(); tip("🔀 已调整顺序：「"+t.title+"」→ 第 "+(j+1)+" 步");
}

/* ==================== 素材编辑弹窗 ==================== */
let matEditIdx=-1;
function openMatModal(idx){
  matEditIdx=(typeof idx==="number")?idx:-1;
  $("matSecName").textContent="（当前环节："+sec().title+"）";
  $("matModal").classList.add("show");
  renderMatList(); renderMatForm();
}
function closeMatModal(){ $("matModal").classList.remove("show"); }
function renderMatList(){
  const box=$("matList"); const s=sec(); const ms=secMats(s);
  box.innerHTML="";
  if(!ms.length){ box.innerHTML='<div class="empty-note">本环节还没有素材，点上方「🎥 视频 / 🎵 音频 / 🖼 图片 / 📝 文字」添加。同一环节可以放任意多个素材，它们会叠加显示，不会覆盖原有实验内容。</div>'; return; }
  ms.forEach((m,i)=>{
    const d=document.createElement("div");
    d.className="mat-item"+(i===matEditIdx?" sel":"");
    d.style.width="100%";
    d.innerHTML='<span>'+(MAT_ICON[m.type]||"📦")+'</span><span class="mi-name">'+esc(m.name||"")+'</span><span class="mi-type">'+esc(m.type)+'</span>'+
      '<button class="mini-btn" title="上移一层">▲</button><button class="mini-btn" title="下移一层">▼</button><button class="del-btn" title="删除" style="display:block">✕</button>';
    d.querySelector(".mi-name").addEventListener("click",()=>{ matEditIdx=i; renderMatList(); renderMatForm(); selMat(m.id); });
    const btns=d.querySelectorAll(".mini-btn");
    btns[0].addEventListener("click",e=>{ e.stopPropagation(); if(i<ms.length-1){ const t=ms[i]; ms[i]=ms[i+1]; ms[i+1]=t; matEditIdx=i+1; histSnap("mat-up"); saveLesson(true); refreshMats(); renderMatList(); renderMatForm(); renderRight(); } });
    btns[1].addEventListener("click",e=>{ e.stopPropagation(); if(i>0){ const t=ms[i]; ms[i]=ms[i-1]; ms[i-1]=t; matEditIdx=i-1; histSnap("mat-down"); saveLesson(true); refreshMats(); renderMatList(); renderMatForm(); renderRight(); } });
    d.querySelector(".del-btn").addEventListener("click",e=>{ e.stopPropagation(); const id=m.id; ms.splice(i,1); if(matEditIdx>=ms.length) matEditIdx=ms.length-1; if(selMatId===id) selMatId=null; histSnap("mat-del"); saveLesson(true); refreshMats(); renderMatList(); renderMatForm(); renderRight(); });
    box.appendChild(d);
  });
}
function renderMatForm(){
  const box=$("matForm"); const s=sec(); const ms=secMats(s); const m=ms[matEditIdx];
  if(!m){
    box.innerHTML='<div class="hint">① 点上方「🎥 视频 / 🎵 音频 / 🖼 图片 / 📝 文字」可添加<b>任意多个</b>素材（视频+音频+图片+文字可共存）；<br>② 在上方列表点素材<b>名称</b>进入编辑；<br>③ 素材地址可填网址（https://…），也可填同目录文件名（如 <b>demo.mp4</b>），或点「📁 选择本地文件」把素材内嵌进课件；<br>④ 文字素材可单独设置<b>字号、颜色、加粗、对齐</b>；<br>⑤ 位置大小既可用下面的 <b>X / Y / 宽 / 高</b> 精确设定，也可开启<b>编辑模式</b>后在演示区直接<b>拖动移动</b>、拖<b>八个控制点缩放</b>。</div>';
    return;
  }
  const isTxt=(m.type==="text");
  const isMed=(m.type==="video"||m.type==="audio");
  const accept = m.type==="video"?"video/*" : m.type==="audio"?"audio/*" : m.type==="image"?"image/*" : "";
  let h="";
  h+='<div class="fld"><label>素材名称</label><input id="f-name" value="'+esc(m.name||"")+'" spellcheck="false"></div>';
  h+='<div class="grid4">';
  h+='<div class="fld"><label>位置 X（%）</label><input id="f-x" type="number" min="0" max="100" step="1" value="'+Math.round(num(m.x,6))+'"></div>';
  h+='<div class="fld"><label>位置 Y（%）</label><input id="f-y" type="number" min="0" max="100" step="1" value="'+Math.round(num(m.y,6))+'"></div>';
  h+='<div class="fld"><label>宽度 W（%）</label><input id="f-w" type="number" min="2" max="100" step="1" value="'+Math.round(num(m.w,30))+'"></div>';
  h+='<div class="fld"><label>高度 H（%）</label><input id="f-h" type="number" min="2" max="100" step="1" value="'+Math.round(num(m.h,20))+'"></div>';
  h+='</div>';
  if(!isTxt){
    h+='<div class="fld"><label>素材地址（网址 https://… 或 同目录文件名，如 demo.mp4）</label><input id="f-src" value="'+esc(m.src||"")+'" spellcheck="false" placeholder="https://… 或 demo.mp4"></div>';
    h+='<div class="mat-add-row"><button class="cbtn" id="f-pick">📁 选择本地文件（内嵌到课件）</button><span class="empty-note" style="align-self:center">内嵌后课件可单独拷贝使用，但 HTML 会变大</span></div>';
    h+='<input type="file" id="f-file" accept="'+accept+'" style="display:none">';
  }
  if(isMed){
    h+='<div class="mat-add-row">'+
      '<label class="chk"><input type="checkbox" id="f-ctrl"'+(m.controls?" checked":"")+'>显示播放控件</label>'+
      '<label class="chk"><input type="checkbox" id="f-auto"'+(m.autoplay?" checked":"")+'>自动播放</label>'+
      '<label class="chk"><input type="checkbox" id="f-loop"'+(m.loop?" checked":"")+'>循环播放</label></div>';
  }
  if(isTxt){
    h+='<div class="fld"><label>文字内容</label><textarea id="f-text" spellcheck="false">'+esc(m.text||"")+'</textarea></div>';
    h+='<div class="grid3">'+
      '<div class="fld"><label>字号（px）</label><input id="f-size" type="number" min="8" max="160" step="1" value="'+num(m.fontSize,24)+'"></div>'+
      '<div class="fld"><label>文字颜色</label><input id="f-color" type="color" value="'+(/^#[0-9a-f]{6}$/i.test(m.color||"")?m.color:"#14614a")+'"></div>'+
      '<div class="fld"><label>对齐方式</label><select id="f-align">'+
        ["left","center","right"].map(a=>'<option value="'+a+'"'+(m.align===a?" selected":"")+'>'+({left:"左对齐",center:"居中对齐",right:"右对齐"})[a]+'</option>').join("")+
      '</select></div></div>';
    h+='<div class="mat-add-row">'+
      '<label class="chk"><input type="checkbox" id="f-bold"'+(String(m.weight)==="700"||String(m.weight)==="bold"?" checked":"")+'>加粗</label>'+
      '<label class="chk"><input type="checkbox" id="f-rich"'+(m.rich?" checked":"")+'>按 HTML 解析（可用 b / br 等标签）</label></div>';
  }
  box.innerHTML=h;
  const bind=(id,ev,fn)=>{ const e=$(id); if(e) e.addEventListener(ev,fn); };
  bind("f-name","input",e=>{ m.name=e.target.value; histSnap("mf-name-"+m.id); refreshMats(); });
  bind("f-name","blur",()=>{ saveLesson(true); renderMatList(); renderRight(); });
  ["x","y","w","h"].forEach(k=>{
    bind("f-"+k,"input",e=>{ m[k]=Number(e.target.value)||0; histSnap("mf-"+k+"-"+m.id); refreshMats(); });
  });
  if(!isTxt){
    bind("f-src","input",e=>{ m.src=e.target.value; histSnap("mf-src-"+m.id); refreshMats(); });
    bind("f-pick","click",()=>{ const f=$("f-file"); if(f) f.click(); });
    bind("f-file","change",function(){
      const f=this.files&&this.files[0]; if(!f) return;
      if(f.size>8*1024*1024 && !confirm("该文件约 "+Math.round(f.size/1048576)+" MB，内嵌后课件会明显变大，确定继续？")){ this.value=""; return; }
      const fr=new FileReader();
      fr.onload=()=>{ m.src=fr.result; if(!m.name||/素材$/.test(m.name)) m.name=f.name; histSnap("mf-file-"+m.id); saveLesson(true); renderMatForm(); refreshMats(); renderMatList(); renderRight(); tip("📁 已内嵌本地文件："+f.name); };
      fr.readAsDataURL(f); this.value="";
    });
  }
  if(isMed){
    bind("f-ctrl","change",e=>{ m.controls=e.target.checked; histSnap("mf-ctrl-"+m.id); refreshMats(); });
    bind("f-auto","change",e=>{ m.autoplay=e.target.checked; histSnap("mf-auto-"+m.id); refreshMats(); });
    bind("f-loop","change",e=>{ m.loop=e.target.checked; histSnap("mf-loop-"+m.id); refreshMats(); });
  }
  if(isTxt){
    bind("f-text","input",e=>{ m.text=e.target.value; histSnap("mf-text-"+m.id); refreshMats(); });
    bind("f-size","input",e=>{ m.fontSize=Number(e.target.value)||24; histSnap("mf-size-"+m.id); refreshMats(); });
    bind("f-color","input",e=>{ m.color=e.target.value; histSnap("mf-color-"+m.id); refreshMats(); });
    bind("f-align","change",e=>{ m.align=e.target.value; histSnap("mf-align-"+m.id); refreshMats(); });
    bind("f-bold","change",e=>{ m.weight=e.target.checked?"700":""; histSnap("mf-bold-"+m.id); refreshMats(); });
    bind("f-rich","change",e=>{ m.rich=e.target.checked; histSnap("mf-rich-"+m.id); refreshMats(); });
  }
}
function syncMatForm(){
  const m=secMats(sec())[matEditIdx]; if(!m) return;
  const set=(id,v)=>{ const e=$(id); if(e && document.activeElement!==e) e.value=v; };
  set("f-x",Math.round(num(m.x,0))); set("f-y",Math.round(num(m.y,0)));
  set("f-w",Math.round(num(m.w,0))); set("f-h",Math.round(num(m.h,0)));
}
document.querySelectorAll("[data-add-mat]").forEach(b=>{
  b.addEventListener("click",()=>{
    const ms=secMats(sec());
    const nm=newMat(b.dataset.addMat, ms.length);
    ms.push(nm);
    matEditIdx=ms.length-1; selMatId=nm.id;
    histSnap("mat-add"); saveLesson(true); refreshMats(); renderMatList(); renderMatForm(); renderRight();
    tip("＋ 已添加「"+nm.name+"」，请设置地址；编辑模式下可在舞台上拖动/缩放");
  });
});
$("matClose").addEventListener("click",closeMatModal);
$("matDone").addEventListener("click",()=>{ histSnap("mat-done"); saveLesson(true); closeMatModal(); renderAll(); tip("✅ 素材设置已保存"); });
$("matModal").addEventListener("click",e=>{ if(e.target===$("matModal")) closeMatModal(); });

/* ==================== 添加环节弹窗 ==================== */
let secType="exp";
(function initSecModal(){
  const sel=$("s-module");
  if(sel) sel.innerHTML=Object.keys(MODULE_LABELS).filter(k=>k!=="media"&&k!=="board").map(k=>'<option value="'+k+'">'+esc(MODULE_LABELS[k])+'</option>').join("");
  const tips={
    exp:"选择一个内置实验模块，系统会自动带出该实验的动画场景与实验步骤。添加后仍可在右侧「🎬 授课素材」里叠加视频/音频/图片/文字。",
    board:"纯图文页面，适合导入新课、研讨交流、总结提升、布置作业等环节。同样可以叠加授课素材。",
    media:"空白素材页：可自由摆放视频、音频、图片、文字，并设定各自的位置与样式。"
  };
  const setType=t=>{
    secType=t;
    document.querySelectorAll("[data-stype]").forEach(b=>b.classList.toggle("on", b.dataset.stype===t));
    if($("s-modWrap")) $("s-modWrap").style.display = (t==="exp") ? "" : "none";
    if($("s-tip")) $("s-tip").innerHTML = tips[t];
  };
  document.querySelectorAll("[data-stype]").forEach(b=>b.addEventListener("click",()=>setType(b.dataset.stype)));
  setType("exp");
})();
$("secClose").addEventListener("click",()=>$("secModal").classList.remove("show"));
$("secCancel").addEventListener("click",()=>$("secModal").classList.remove("show"));
$("secModal").addEventListener("click",e=>{ if(e.target===$("secModal")) $("secModal").classList.remove("show"); });
$("secOk").addEventListener("click",()=>{
  const title=($("s-title").value||"").trim()||"新环节";
  const id="s"+Date.now().toString(36);
  let ns;
  if(secType==="exp"){
    ns={id:id,title:title,module:$("s-module").value,equip:"",equipOpts:[],plans:[{id:"p1",label:"默认方案"}],analysis:"",principle:"",examples:"",board:"",materials:[]};
  }else if(secType==="board"){
    ns={id:id,title:title,module:"board",equip:"",equipOpts:[],plans:[],analysis:"",principle:"",examples:"",board:'<h4>'+esc(title)+'</h4><p>在这里填写本环节内容（编辑模式下可直接在页面文字区修改）。</p>',materials:[]};
  }else{
    ns={id:id,title:title,module:"media",equip:"",equipOpts:[],plans:[],analysis:"",principle:"",examples:"",board:"",materials:[]};
  }
  LESSON.sections.push(ns);
  LESSON.activeId=id; selMatId=null; histSnap("sec-add"); saveLesson(true); renderAll();
  $("secModal").classList.remove("show");
  tip("＋ 已添加环节："+title);
  if(secType==="media") openMatModal(-1);
});
$("addSectionBtn").addEventListener("click",()=>{
  $("s-title").value="任务"+(LESSON.sections.length+1);
  $("secModal").classList.add("show");
});

/* ==================== 舞台区域拖拽滚动 ==================== */
(function(){
  var stage=$("stage3d"); if(!stage) return;
  /* 拖拽滚动状态 */
  var dragging=false, startY=0, startST=0;
  stage.addEventListener("pointerdown", function(e){
    if(e.target.closest(".stage-card,.mat,.mat-layer,video,audio,button,input,textarea,.mh,.mat-bar")) return;
    dragging=true; startY=e.clientY; startST=stage.scrollTop;
    stage.style.cursor="grabbing";
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", function(e){
    if(!dragging) return;
    e.preventDefault();
    stage.scrollTop = startST - (e.clientY - startY);
  });
  stage.addEventListener("pointerup", function(e){
    if(!dragging) return;
    dragging=false;
    stage.style.cursor="grab";
    try{ stage.releasePointerCapture(e.pointerId); }catch(x){}
  });
})();
