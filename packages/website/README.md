# LinkGate Website

这是 LinkGate 官方网站和文档的源码,使用 VitePress 构建。

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 访问 http://localhost:5173
```

## 构建

```bash
# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview
```

## 结构

```
packages/website/
├── .vitepress/          # VitePress 配置
│   ├── config.ts        # 主配置文件
│   └── theme/           # 主题定制
├── guide/               # 使用文档
├── technical/           # 技术文档
├── public/              # 静态资源
├── index.md             # 首页
└── faq.md               # FAQ
```

## 内容

- **Landing Page**: 项目介绍和快速开始
- **使用文档**: 安装、配置、API 文档
- **技术文档**: 架构、技术选型、安全设计
- **FAQ**: 常见问题解答

## 部署

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod
```

### 自托管

```bash
pnpm run build
# 部署 .vitepress/dist 目录
```

## 贡献

欢迎贡献文档和改进!

1. Fork 项目
2. 创建分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT
