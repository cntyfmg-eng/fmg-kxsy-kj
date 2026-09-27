# 框架增量构建工具链

这套文件用于**可复现地重新生成** `templates/scaffold.html`（墨绿立体风格 + 素材系统 + 撤销重做 + 换肤），
而不是手工改那个 170KB 的大文件。

## 组成

| 文件 | 作用 |
|---|---|
| `templates/base-scaffold.html` | **纯净基底**（v1.1.0：9 个 SVG 实验模块，无素材系统/换肤）。**永远不要直接改它** |
| `build/kj_css.css` | 增量 CSS：5 套主题变量 + 素材层/控制点/浮动工具条 + 撤销按钮样式 |
| `build/kj_html.html` | 增量 HTML：换肤菜单、添加环节弹窗、授课素材弹窗 |
| `build/kj_js.js` | 增量 JS：换肤、撤销重做、素材系统、环节排序、弹窗逻辑 |
| `build/build_kj.cjs` | 构建脚本：把上面三者按锚点注入基底，输出成品 |
| `build/test_kj2.cjs` | jsdom 回归测试（46 项断言） |

## 构建

```bash
NODE="C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node.exe"
"$NODE" build/build_kj.cjs "H:/WorkBuddy/科学课件平台/科学实验演示课件框架.html"
```
不带参数则只更新 `templates/scaffold.html`。

## 回归测试

```bash
NODE_PATH="C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules" \
"$NODE" build/test_kj2.cjs
```
测试会自行注入 `window.__T` 暴露内部句柄，覆盖：工具栏结构、环节排序、撤销/重做、
多素材共存、八点缩放、拖动移动、实验环节叠加素材不覆盖 SVG、5 套换肤。

## 增量注入的锚点（若基底升级需同步）

`build_kj.cjs` 依赖基底里这些**唯一字符串**，基底换了要一起改：

- `<title>` / `:root` 的 `*{box-sizing:border-box;`
- `<button class="tb-btn" id="editToggle" …>` 行（在其后插 `undoBtn/redoBtn`）
- `<button class="tb-btn gold" id="resetBtn" …>♻️ 恢复默认</button>` 行（改名「恢复示例课」并插 `skinBtn`）
- `<div class="opt-group-title" data-page-node-id="ZfDTuYZmFtkbaH3Canb0nW">💡 学习提示</div>`（在其前插「授课素材」分组）
- `<script>\n"use strict";`（在其前插弹窗 HTML）
- `  card.innerHTML = M.scene(s);\n  resetView(false);`（改成 stage-box + mat-layer 包裹）
- `const MODULES = {bottle:bottleMod, … board:boardMod};`
- `/* ==================== 启动 ==================== */`（在其前插增量 JS + `histInit()`）
- `$("addSectionBtn").addEventListener("click",()=>{\n  const t=prompt("新环节名称：","任务六");`
- 默认课的数组结尾 `      }\n    ]\n  };\n}`
