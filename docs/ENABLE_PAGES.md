# GitHub Pages 快速启用指南

## ⚠️ 重要: 手动启用 Pages

由于 GitHub 权限限制,需要先手动启用 Pages,然后自动部署才能正常工作。

## 📝 启用步骤(仅需一次)

### 1. 访问仓库设置

```
https://github.com/7788ken/linkgate/settings/pages
```

### 2. 启用 Pages

1. 在 **Source** 下拉菜单中
2. 选择 **GitHub Actions** (不是 Deploy from a branch)
3. 点击 **Save**

### 3. 等待自动部署

启用后,GitHub Actions 会自动触发部署:

1. 访问 Actions 页面:
   ```
   https://github.com/7788ken/linkgate/actions
   ```

2. 找到 "Deploy Website to GitHub Pages" 工作流

3. 查看运行状态(约 2-3 分钟)

### 4. 访问网站

部署完成后访问:
```
https://7788ken.github.io/linkgate/
```

## 🔄 后续更新

启用后,每次推送代码都会自动重新部署:

```bash
git add .
git commit -m "docs: update"
git push
```

## 📊 检查部署状态

### Actions 页面
```
https://github.com/7788ken/linkgate/actions
```

### Pages 设置
```
https://github.com/7788ken/linkgate/settings/pages
```

## ⚠️ 常见问题

### Q: Actions 失败怎么办?

A: 确保已在 Settings → Pages 中选择了 **GitHub Actions** 作为 Source。

### Q: 页面显示 404?

A:
1. 检查 Pages 是否已启用
2. 等待几分钟让部署完成
3. 清除浏览器缓存

### Q: 样式加载失败?

A: 这是 base 路径问题,已在配置中设置:
```typescript
base: '/linkgate/'
```

## 🎯 快速链接

- [Actions](https://github.com/7788ken/linkgate/actions)
- [Pages 设置](https://github.com/7788ken/linkgate/settings/pages)
- [官网地址](https://7788ken.github.io/linkgate/)
