# GitHub Pages 部署指南

## 自动部署到 GitHub Pages

本项目已配置 GitHub Actions 自动部署,推送到 master 分支后自动构建和部署官网。

### 部署步骤

1. **推送代码到 GitHub**

```bash
git push origin master
```

2. **启用 GitHub Pages**

   - 进入 GitHub 仓库
   - Settings → Pages
   - Source 选择 "GitHub Actions"
   - 等待自动部署完成

3. **访问网站**

   部署完成后访问:
   ```
   https://<username>.github.io/linkgate/
   ```

### 手动触发部署

在 GitHub 仓库页面:
1. Actions 标签页
2. 选择 "Deploy Website to GitHub Pages"
3. 点击 "Run workflow"

## 自定义域名(可选)

### 1. 添加 CNAME 文件

在 `packages/website/public/` 目录创建 `CNAME` 文件:

```
linkgate.yourdomain.com
```

### 2. 配置 DNS

在域名服务商处添加 CNAME 记录:

```
linkgate.yourdomain.com → <username>.github.io
```

### 3. 更新配置

修改 `.vitepress/config.ts`:

```typescript
export default defineConfig({
  base: '/', // 使用自定义域名时改为根路径
  // ...
})
```

## 其他部署平台

### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
cd packages/website
vercel --prod
```

### Netlify

1. 连接 GitHub 仓库
2. Build command: `cd packages/website && pnpm run build`
3. Publish directory: `packages/website/.vitepress/dist`

### Cloudflare Pages

1. 连接 GitHub 仓库
2. Build command: `cd packages/website && pnpm run build`
3. Build output directory: `packages/website/.vitepress/dist`

## 注意事项

1. **Base 路径**: GitHub Pages 需要设置正确的 base 路径
2. **资源路径**: 使用相对路径避免资源加载失败
3. **缓存**: 更新后可能需要清除浏览器缓存
4. **HTTPS**: GitHub Pages 自动提供 HTTPS

## 故障排除

### 样式加载失败

检查 `.vitepress/config.ts` 中的 `base` 配置是否正确。

### 404 错误

确保 GitHub Pages 已启用并选择 GitHub Actions 作为源。

### 构建失败

查看 Actions 日志,常见问题:
- 依赖安装失败
- 构建命令错误
- 路径配置错误

## 相关链接

- [GitHub Pages 文档](https://docs.github.com/zh/pages)
- [VitePress 部署指南](https://vitepress.dev/guide/deploy)
