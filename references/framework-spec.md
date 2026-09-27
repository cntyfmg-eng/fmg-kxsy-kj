# 框架技术规范（供新增实验模块 / 深度定制参考）

> 配套文件：`templates/scaffold.html`（可直接运行的模板）、`references/example-lesson-air.html`（粤教版四上《空气》全套 7 环节真实范例）。

---

## 1. 文件结构
单文件 HTML：内联 `<style>`（设计系统）+ `<body>`（骨架）+ 单个 `<script>`（引擎+数据+模块）。
**零外部依赖**，二维码以 `data:image/jpeg;base64,...` 内嵌在 `#qrImg` 的 `src`。

骨架（不要改动，仅改 `defaultLesson()` 与模块）：
```
<header class="topbar">   单元/课/课题(metaUnit/metaLesson/metaTitle) + 品牌 brandBtn
<div class="qr-overlay">  二维码弹窗（brandBtn 点击触发）
<main class="layout">
  <aside> 左侧 .section-list  环节导航
  <section class="center"> .equip-bar 器材条 → .demo-wrap 演示区(.stage-3d>.stage-card) → .steps-bar 步骤条+控制台
  <aside class="right"> 上 .opt-box 实验选项(器材展示chips/方案chips/学习提示) + 下 .ana-box 实验分析
<footer class="toolbar"> 编辑模式/保存/导出/导入/恢复默认
```

---

## 2. 数据模型 `defaultLesson()`
返回一个对象：
```js
{
  meta:{ unit:"第一单元 空气", lesson:"第 1 课", title:"感受身边的空气" },
  activeId:"intro",                 // 默认进入的环节 id
  sections:[ /* 环节数组，按顺序排列 */ ]
}
```
每个 `section`（环节）：
| 字段 | 作用 |
|---|---|
| `id` | 唯一标识（如 `"t1"`），`EQUIP_TARGETS` 用它映射器材高亮 |
| `title` | 左侧导航与演示区标题 |
| `module` | 演示区模块名：`bottle/plastic/softbag/mass/sponge/balloon/balance/flybag/board/media` |
| `equip` | 器材条文字 |
| `equipOpts` | 右侧“实验器材展示”标签数组（点击高亮） |
| `plans` | 右侧“不同实验方案” `[{id,label}]`，切换触发 `module.setPlan(id,ctx)` |
| `analysis/principle/examples` | 右侧“实验分析”三栏 |
| `board` | 仅 `module:"board"` 用，纯 HTML/SVG 字符串 |
| `materials` | 授课素材数组（可选，任意模块都可用），见 §11 |

---

## 11. 授课素材（materials）与舞台覆盖层

任意环节都可以有 `materials`，渲染在**演示画面之上**的独立覆盖层，因此**不会替换原有 SVG 实验内容**。

```js
materials:[
  {id:"m1", type:"text",  name:"标题", text:"文字内容", x:6,y:7,w:56,h:12,
   fontSize:30, color:"#14614a", weight:"700", align:"left", rich:false},
  {id:"m2", type:"video", name:"视频", src:"demo.mp4", x:10,y:40,w:44,h:36,
   controls:true, autoplay:false, loop:false},
  {id:"m3", type:"audio", name:"音频", src:"https://…/a.mp3", x:60,y:80,w:34,h:16},
  {id:"m4", type:"image", name:"图片", src:"pic.png", x:60,y:10,w:32,h:38}
]
```
- `x/y/w/h` 均为**相对舞台的百分比**（0–100）。文字用 `fontSize/color/weight("700")/align("left|center|right")`。
- `rich:true` 时文字按 HTML 解析（`b/br` 等）；默认按纯文本转义 + `\n`→`<br>`。
- `src` 支持网址、同目录文件名，或在弹窗里选本地文件自动转 base64 内嵌。
- DOM：`renderCenter()` 产出
  `<div class="stage-box" id="stageBox">M.scene(s) + <div class="mat-layer" id="matLayer">素材</div></div>`。
- 交互（仅编辑模式）：拖动移动、8 个 `.mh-*` 控制点缩放、`.mat-bar` 浮动工具条（设置/▲/▼/⤒/✕）。
- CSS 关键点：`.mat{pointer-events:none}` 保证浏览模式不挡底下的 SVG；`.mat.pm,.edit-mode .mat{pointer-events:auto}`。
- 新增素材：`[data-add-mat="video|audio|image|text"]` 按钮；管理弹窗 `#matModal`（`openMatModal(idx)`）。

## 12. 撤销 / 重做（历史栈）
```js
HIST = {stack:[JSON], i:0, last:0, label:""}   // 快照式，上限 100 步
histInit()          // 启动时压入初始快照（构建脚本已在 renderAll() 前调用）
histSnap(label)     // 任何改动 LESSON 之后调用；同 label 且 900ms 内会合并为一步
histUndo()/histRedo()   // 工具栏 #undoBtn / #redoBtn，快捷键 Ctrl+Z / Ctrl+Shift+Z
```
- 撤销/重做会**保留用户当前所在环节**（不会跳走）。
- 已接入的位置：环节排序/增删、素材增删/层级/拖动/缩放/表单字段、正文 contenteditable 失焦、
  器材与方案标签增删、恢复示例课。
- ⚠️ 新增任何会改 `LESSON` 的交互时，务必在同一处补 `histSnap("你的标签")`。

## 13. 换肤
`SKINS` 定义 5 套：`green`(默认) / `sky`(浅蓝) / `navy`(深蓝) / `gray`(浅灰) / `brown`(深褐)。
实现为 `<html data-theme="…">` + `kj_css.css` 顶部 5 组 CSS 变量覆盖；`applyTheme(k)` 写入
`localStorage[window.FMG_THEME_KEY]`。**新增硬编码颜色时必须同时加到 5 组变量里**，否则换肤会漏色。

---

## 3. 模块契约 `MODULES`
```js
const bottleMod = {
  scene(secObj){            // 返回演示区 HTML 字符串（SVG 用 scene() 包裹或返回 div）
    return scene('<svg>…</svg>');   // scene(inner) 自动加 REAL_DEFS 与 viewBox=0 0 700 430
  },
  init(){},                 // 挂载后初始化状态（可选）
  setPlan(id, ctx){         // 右侧方案切换时调用（可选）；ctx={rebuild:rebuildSteps}
    this.x = (id==="open");
    ctx.rebuild();          // 改条件后必须重算步骤
  },
  steps(secObj){            // 返回步骤数组（见下）
    return [
      { t:"【准备】文字说明", ms:1800, act:async()=>{ await this.reset(); } },
      { t:"【步骤1】…", ms:2000, act:async()=>{ await fade("b-funnel",1,350); } },
      // …更多步骤；末尾可放 {t:"【结论】…", ms:2800, act:async()=>{}}
    ];
  },
  async reset(){            // 复位到初始 SVG 状态（重置/重新演示时调用）
    ["b-funnel","b-clay"].forEach(id=>{ const e=$(id); if(e){ e.style.transition="none"; e.style.opacity="0"; }});
  }
};
const MODULES = { bottle:bottleMod, plastic:plasticMod, softbag:softbagMod, mass:massMod, sponge:spongeMod, balloon:balloonMod, board:boardMod };
```
内置模块一览：
- `bottle`：透明 PET 瓶 + 漏斗 + 橡皮泥，演示“空气占有空间”（密封后水进不去）。
- `plastic`：弹性空瓶 + 漏斗 + 橡皮泥/水壶，演示“压缩空气产生力”。
- `softbag`：软塑料包 + 漏斗 + 橡皮筋，演示“泵效应/负压吸水”。
- `mass`：小皮球 + 打气筒 + 电子秤 + 记录表，演示“空气有质量”（称前 36.24g / 放气后 35.34g）。
- `sponge`：保鲜袋 + 干/湿海绵 + 扎带，演示“海绵小孔藏空气”。
- `balloon`：瓶中套气球 + 瓶底开孔，演示“给空气留出口才能吹大”。
- `balance`：纸杯天平 + 蜡烛，演示“热空气上升”（加热哪边哪边上翘，带左右记录表；方案=两侧对比/只左/只右）。
- `flybag`：轻薄袋 + 纸筒 + 蜡烛 + 高度标尺，演示“模拟热气球升空”（鼓起→升空→冷却落回，带飞行高度记录表；方案=普通/更轻薄/更大袋子）。
- `board`：纯图文页（导入/结论/研讨），`scene(secObj)` 直接返回 `<div class="board">…</div>`。

### ⚠️ 大坑：被动画的元件不要加 `.obj3d` 类
框架在每次 `renderCenter()` 都会调用 `resetView()`，它给**所有 `.obj3d` 元素写入 `style.transform`**（3D 视角占位）。
内联 style 的优先级高于 SVG `transform` 属性——所以凡是你用 `setA(id,"transform",…)` 驱动动画的元件，
一旦带 `.obj3d` 类，transform 属性会被 style 覆盖，**画面纹丝不动且无报错**。
正确做法二选一：
1. 该元件不加 `.obj3d` 类（推荐，`balance` 的横梁/纸杯/蜡烛即如此）；
2. 改用 `$(id).style.transform = "translate(...px, ...px)"` 驱动（`sponge` 模块的做法，注意此时原点受 `transform-box:fill-box` 影响，只适合平移）。

### 步骤对象 `{t, ms, act}`
- `t`：步骤文字（演示区步骤条 + 每步自动执行 `act`）。
- `ms`：该步骤自动演示停留毫秒（默认 2000）。
- `act`：进入该步骤时执行的函数（动画/状态变更），返回 Promise（`async`）以等待动画完成。

### 新增模块步骤
克隆 `const bottleMod = {...}` 块 → 改 `scene()` 内 SVG（保持 `viewBox 0 0 700 430`，写实器材用 `REAL_DEFS` 里的渐变）→ 写 `steps()` → 实现 `reset()` → 在 `MODULES` 注册 → 在 `EQUIP_TARGETS` 加映射。

---

## 4. 引擎工具函数（步骤/动画里直接调用）
| 函数 | 说明 |
|---|---|
| `$ (id)` | `document.getElementById` |
| `tween(dur, cb)` | 返回 Promise；`cb(p)` 中 `p` 从 0→1，`cb` 内用 `setA` 改 SVG 属性做补间 |
| `fade(id, to, dur)` | 透明度渐变（id 可为字符串或元素），返回 Promise |
| `setA(id, attr, v)` | `setAttribute`（改 SVG 的 d/cx/cy/width/height/fill 等） |
| `wait(ms)` | `setTimeout` Promise |
| `gVal(id, v)` | 设置元素 `textContent`（如读数、标签） |
| `esc(s)` | HTML 转义（渲染用户文本时用） |
| `scene(inner)` | 包裹 SVG 场景（加 `REAL_DEFS` + viewBox） |
| `airDots([[x,y,r,s],…])` | 生成上浮气泡动画（空气可视化） |
| `TABLE` | 桌面/地面矩形常量 |
| `REAL_DEFS` | 渐变定义（petGrad/glassGrad/metalGrad/rubberGrad/waterGrad/bagGrad/lcdGrad/clayGrad/spongeGrad） |
| `spotlight(label, ids)` | 高亮指定 SVG 元件（其余淡出 + 金色虚线框 + ★ 标签），用于器材展示 |
| `clearSpot()` | 清除高亮 |

---

## 5. 器材高亮 `EQUIP_TARGETS`
```js
const EQUIP_TARGETS = {
  t1:{"透明塑料瓶":["o-bottle"],"漏斗":["b-funnel"],"橡皮泥":["b-clay"],"水杯":["o-cup"],"清水":["o-cup"]},
  // 环节id : { 右侧器材标签文字 : [该环节 SVG 内的元件 id 数组] }
};
```
用户点击右侧“实验器材展示”标签 → 查 `EQUIP_TARGETS[当前环节id][标签]` → `spotlight(label, ids)`。
SVG 元件若带 `.obj3d` 类可单独 3D 观察（见下）。**务必让标签文字与 `equipOpts` 完全一致**。

---

## 6. 主题与配色（`:root` 变量）
`--bg-deep:#0a231b`(主背景) `--bg-panel:#123528` `--accent:#3fae82`(亮绿) `--gold:#d9b45c`(金) `--text:#e9f4ee`。
立体凸起靠三套阴影：`--raise`(外凸) `--raise-sm` `--inset-sh`(内凹)。改动配色只改 `:root` 即可全站统一。

---

## 7. 二维码（公众号）
`#qrImg` 的 `src` 已是 `data:image/jpeg;base64,…`。替换时：把新二维码 jpg 读成 base64 字符串，
整体替换 `<img id="qrImg" alt="公众号二维码" src="...">` 中的 `src`。弹窗文案在 `.qr-box p` 内。

---

## 8. 持久化 / 编辑
- `STORE_KEY`：localStorage 键，每课件唯一。
- 编辑模式（✏️）：开启后文字区 `contenteditable`、可增删环节/器材/方案。
- 保存/导出(JSON)/导入(JSON)/恢复默认 按钮已绑定，无需改动。
- `beforeunload` 自动存 localStorage。

---

## 9. 3D 视角引擎（当前默认未启用 UI，代码保留可恢复）
`applyView(anim)` 对带 `.obj3d` 类的 SVG 元件施加 `perspective+rotateX/Y+scale`（只转器材、不转台面）；
`enableDragRotate()` 提供鼠标拖拽旋转；`resetView()` 复位。早期版本有右侧“裸眼 3D 视角控制”面板，
后续按需求移除。如需恢复：在 `.right` 加控制按钮并调用 `enableDragRotate()` + `applyView()` 即可。

---

## 10. 验证清单
1. 抽出 `<script>` 跑 `node --check` 语法零错误。
2. jsdom 加载 → `renderAll()` → 遍历每个环节点击切换 + 单步/自动演示，捕获异常。
3. （可选）Edge headless 截图肉眼复核布局与动画关键帧。
4. 确认 `EQUIP_TARGETS` 标签与 `equipOpts` 一致、点击能高亮。
5. 确认 `STORE_KEY` 已设为本课唯一值。
