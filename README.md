# 战斗掉落扇环落点 Demo

一个纯静态 HTML5 Canvas Demo，用于演示怪物死亡后，烧鸡 / 鸡腿在怪物背向角色方向的可配置扇环区域内随机落点。

## 直接运行

双击打开 `index.html` 即可运行，不需要后端、数据库或构建步骤。

也可以在本目录启动一个静态服务器：

```powershell
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

## 功能

- 拖拽画布中的角色或怪物，实时刷新扇环方向。
- 调整 `playerX`、`playerY`、`monsterX`、`monsterY`、`monsterRadius`、`dropAngle`、`dropInnerRadius`、`dropOuterRadius`、`sampleCount`。
- 生成 1 个落点、生成 `sampleCount` 个落点、清空落点、重置默认值。
- 绘制角色、怪物、怪物半径、玩家到怪物方向箭头、掉落扇环、内外半径弧线、角度边界线和随机落点。
- 显示 `baseAngle`、`dropAngle`、`dropInnerRadius`、`dropOuterRadius` 和最近一次落点坐标。

## 核心规则

核心算法位于 `src/dropMath.js`，页面和测试共用同一份数学函数。

```js
baseAngle = atan2(M.y - P.y, M.x - P.x);
theta = baseAngle + random(-dropAngle / 2, dropAngle / 2);
r = sqrt(random(dropInnerRadius ** 2, dropOuterRadius ** 2));
dropPos = M + Vector2(cos(theta), sin(theta)) * r;
```

当 `dropAngle = 360°` 时，`theta` 在完整圆周内随机。半径用平方半径区间采样，保证面积分布更均匀。

## 边界处理

- `dropAngle` 会夹取到 `1° - 360°`。
- `dropInnerRadius < 0` 时按 `0` 处理。
- `dropOuterRadius < dropInnerRadius` 时自动交换两者，并在 UI 中显示警告。
- 角色和怪物完全重合时，`baseAngle = 0°`。
- `dropInnerRadius < monsterRadius` 时显示建议提示。

## 测试

项目没有运行时依赖。安装 Node.js 后可直接运行：

```powershell
npm test
```

测试覆盖角度夹取、半径交换、重合点、面积均匀半径采样、360° 全圆环和扇区边界判断。

## GitHub Pages 在线预览

发布方式：

```powershell
git init
git add .
git commit -m "feat: add monster drop demo"
gh repo create monster-drop-demo --public --source=. --remote=origin --push
```

推送后到 GitHub 仓库的 `Actions` 页面查看 `Deploy static demo to GitHub Pages`，部署完成后会生成在线预览地址。

如果仓库已经存在：

```powershell
git remote add origin https://github.com/<owner>/<repo>.git
git branch -M main
git push -u origin main
```

GitHub Pages 的发布源请选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/ (root)`。
