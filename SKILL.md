---
name: fmg-kxsy-kj
description: 科学实验演示课件生成器（墨绿立体凸起风格单文件 HTML）。内置瓶/塑料瓶/软包/称量皮球/海绵/瓶中气球/纸杯天平/模拟热气球等可复用 SVG 实验模块，支持步骤动画、器材高亮、环节排序、多素材共存（视频/音频/图片/文字拖动+八点缩放）、撤销重做、五套换肤、**舞台垂直滚动与拖拽**、编辑保存、导出导入与公众号二维码。调用后按同一框架生成任意科学实验演示网页课件。
slug: fmg-kxsy-kj
version: "1.3.3"
displayName: 科学实验演示课件生成器
---

# 科学实验演示课件生成器（fmg-kxsy-kj）

为小学/初中科学课生成**墨绿立体凸起风格**的单文件交互式实验演示课件（HTML）。
输出是一个双击即开的 `.html`，无需任何外部依赖，可离线使用、可投屏、可发微信群。

框架已在一线教学中打磨多轮，包含：顶栏（单元/课/课题 + 公众号品牌）、左侧环节导航、
中间演示区（SVG 动画 + 步骤条 + 控制台 + **垂直滚动/拖拽**）、右侧实验选项（器材展示/方案切换/授课素材/学习提示）
与实验分析（分析/原理/生活实例）；支持器材点击高亮、编辑模式、本地保存、JSON 导出导入，
以及右上角品牌点击弹出公众号二维码。

编辑器能力（v1.3.0 起）：
- **舞台滚动**：演示区内容超出时自动出现**美化滚动条**；支持**鼠标拖拽上下滚动**（在舞台空白处按住鼠标拖动即可）；溢出时底部显示提示（3秒后自动消失）。
- **环节排序**：左侧每个环节的 ▲▼ 调整前后顺序。
- **授课素材**：任意环节（实验页/图文页/素材页）都可叠加**任意多个**视频/音频/图片/文字，
  同一环节多素材共存，**不覆盖原有实验画面**；编辑模式下舞台上拖动移动、拖八个控制点缩放，
  并可用悬浮工具条（设置/上移/下移/置顶/删除）调整层级。
- **撤销/重做**：工具栏 `↶ 还原` / `↷ 恢复`（快捷键 Ctrl+Z / Ctrl+Shift+Z），可回退/前进任意步。
- **换肤**：工具栏 `🎨 换肤`，5 套主题——墨绿（默认）/ 浅蓝 / 深蓝 / 浅灰 / 深褐，文字色随主题自适应。
- **恢复示例课**：一键还原为框架自带的示例课件数据。

## 何时使用
- 用户要制作“科学实验”“演示课件”“实验动画”“互动实验网页”。
- 用户给出一节课的若干实验任务/环节，希望按统一框架生成 HTML。
- 用户在已有课件基础上增删环节、修改步骤、替换器材图。

## 交付物
- 一个单文件 `xxx.html`（墨绿立体风格，内含 SVG 交互动画）。

## 工作流程（铁律：先复制模板，再填数据，最后验证）

### 1. 复制模板
把 `templates/scaffold.html` 复制到目标路径（通常用户在桌面的“四年级上册新版科学\课件\第X课”目录），
命名如 `第X课<课题>模拟演示实验.html`。

```js
const fs = require("fs");
const src = "C:/Users/Administrator/.workbuddy/skills/fmg-kxsy-kj/templates/scaffold.html";
fs.copyFileSync(src, "目标路径.html");
```

### 2. 编辑 `defaultLesson()` —— 这是 99% 的工作量
模板自带 3 个示例环节（导入board / 任务一bottle / 结论board），按同样结构替换成你的课：

```js
function defaultLesson(){
  return {
    meta:{ unit:"第一单元 空气", lesson:"第 1 课", title:"感受身边的空气" },
    activeId:"intro",
    sections:[
      {
        id:"intro", title:"导入新课", module:"board",
        equip:"", equipOpts:["气球","塑料袋"], plans:[{id:"q1",label:"问题：…"}],
        analysis:"", principle:"", examples:"",
        board:'<h4>情境导入</h4><p>…纯 HTML/SVG 内容…</p>'
      },
      {
        id:"t1", title:"任务一：…", module:"bottle",   // module 决定演示区用哪个 SVG 模块
        equip:"透明塑料瓶、漏斗、橡皮泥、水杯、清水",
        equipOpts:["透明塑料瓶","漏斗","橡皮泥","水杯"],
        plans:[{id:"sealed",label:"橡皮泥密封"},{id:"open",label:"取下橡皮泥（对比）"}],
        analysis:"…", principle:"…", examples:"…"
      },
      // 更多环节…
    ]
  };
}
```

**字段说明**
- `module`：必填，决定演示区动画。内置可复用模块见下表（无需重画 SVG）。
- `equip`：本环节器材文字（演示区上方器材条）。
- `equipOpts`：右侧“实验器材展示”的标签；点击会**高亮**演示区对应器材（需在 `EQUIP_TARGETS` 映射）。
- `plans`：右侧“不同实验方案”标签；切换会调用模块 `setPlan()` 改变条件并重算步骤。
- `analysis / principle / examples`：右侧“实验分析”三栏文字。
- `board`：仅 `module:"board"` 使用，纯 HTML/SVG 内容（导入页、结论页、研讨页）。
- `materials`：**任意模块都可选**。数组，元素为授课素材对象（视频/音频/图片/文字），
  可与该环节原有的 SVG 画面叠加共存。字段：
  `{id, type:"video|audio|image|text", name, src, text, x,y,w,h, fontSize, color, weight, align, rich, controls, autoplay, loop}`
  —— `x/y/w/h` 均为相对舞台的百分比；文字用 `fontSize/color/weight/align` 控制样式；
  `src` 可填网址、同目录文件名，或运行时在弹窗里选本地文件内嵌为 base64。

### 3. 复用 / 新增 SVG 实验模块
内置模块（已在模板中注册，直接 `module:"xxx"` 引用即可）：
`bottle`(瓶+漏斗+橡皮泥占空间)、`plastic`(弹性塑料瓶)、`softbag`(软塑料包泵效应)、
`mass`(称皮球测空气质量)、`sponge`(海绵藏空气)、`balloon`(瓶中吹气球)、
`balance`(纸杯天平+蜡烛·热空气上升，带左右记录表)、`flybag`(模拟热气球升空，带高度标尺与飞行记录表)、
`board`(纯图文页)。

**⚠️ 注意**：凡是用 `setA(id,"transform",…)` 做动画的元件**不要加 `.obj3d` 类**——
框架的 `resetView()` 会给所有 `.obj3d` 写入 `style.transform`，内联样式会覆盖 transform 属性导致动画失效（详见 `references/framework-spec.md`）。

**需要新类型实验时**（如“电路”“溶解”“磁铁”）：克隆 `const bottleMod = {...}` 那种代码块，
重命名、改 `scene()` 里的 SVG、`steps()` 里的步骤脚本，再在 `const MODULES = {...}` 注册，
最后在 `EQUIP_TARGETS` 里加 `环节id:{"器材名":["svg元件id"]}` 以支持高亮。
模块契约见 `references/framework-spec.md`。

### 4. 改好 `STORE_KEY`
模板默认 `"fmg-kxsy-lesson-v1"`。每节课改成唯一值（如 `"fmg-kxsy-<课名>"`），
避免不同课件共用 localStorage 串数据。

### 5. 验证（必须）
- 抽出 `<script>` 用 `node --check` 做语法校验。
- 用 jsdom 加载 HTML，`renderAll()` 后切换每个环节并单步/自动演示，确认不抛错。
- 用 Edge(headless) 截图肉眼确认布局与动画。
完整真实范例见 `references/example-lesson-air.html`（粤教版四上《感受身边的空气》全套 7 环节 7 模块）。

## 改造框架本身（新增编辑器功能时）
框架 = `templates/base-scaffold.html`（纯净基底，**勿改**）+ `build/` 里的增量文件。
改完增量文件后跑 `node build/build_kj.cjs <输出路径>` 重新生成，再跑 `node build/test_kj2.cjs` 回归。
细节与依赖锚点见 `build/README.md`。

## 设计语言（保持一致性的关键）
- 主题色变量集中在 `<style>` 的 `:root`（`--bg-deep/#0a231b` 墨绿、`--accent/#3fae82` 亮绿、`--gold/#d9b45c` 金）。
- 立体凸起 = 深底 + `box-shadow` 外阴影 + 内高光（`--raise` / `--raise-sm` / `--inset-sh`）。
- 演示区白底 SVG（`viewBox="0 0 700 430"`），器材写实化（PET 瓶高光、金属渐变、橡胶径向渐变）。

## 约束
- 单文件、零外部依赖（二维码已 base64 内嵌）。不要引入 CDN/外链。
- 中文界面、可编辑文字（`contenteditable`），保留“编辑模式/还原/恢复/保存/导出/导入/恢复示例课/换肤”。
- **不要修改 `templates/base-scaffold.html`**。它是纯净基底，构建脚本 `build_kj.cjs` 只从它出发；
  改动请写在独立的 CSS/JS 增量文件里，再按同样方式注入。
- 动画用 `tween(ms, p=>{...})` + `fade(id,to,dur)` + `setA(id,attr,v)` 驱动 SVG 属性，禁止用外部动画库。
- 新增会改动 `LESSON` 数据的交互时，记得在同一处调用 `histSnap("标签")` 以便撤销/重做覆盖到。
