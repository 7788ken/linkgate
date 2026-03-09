# 简介

欢迎使用 LinkGate!

## 什么是 LinkGate?

LinkGate 是一个**公益性质**的设备配对网关系统,用于本地电脑/服务器 Agent 与移动终端 APP 的安全配对连接。

### 核心特性

- ✅ **临时性**: 配对完成后网关自动删除临时信息
- ✅ **公益性质**: 免费开放,低资源消耗
- ✅ **自动重连**: Agent 断线后自动重新注册
- ✅ **简单易用**: 零配置,一条命令即可启动
- ✅ **隐私优先**: 不持久化敏感数据,配对即焚

## 使用场景

### 1. 本地开发环境远程访问

将本地开发服务器暴露给移动设备进行测试:

```bash
# 1. 启动 Agent
cd packages/agent && pnpm run dev register -g https://gateway.example.com -p 3000

# 2. 获取配对码
# 配对码: 847291

# 3. 在移动设备上配对
# 使用配对码完成连接
```

### 2. IoT 设备配对

为智能家居、工业设备等提供安全的配对机制:

```typescript
// 设备端
const agent = new Agent({
  gateway: 'https://gateway.example.com',
  port: 8080
})

const code = await agent.register()
console.log('配对码:', code)
```

### 3. 临时协作会话

创建临时的点对点连接,无需暴露内网:

- 远程桌面协助
- 文件传输
- 实时协作工具

## 架构概览

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   Agent     │◄────────►│   Gateway    │◄────────►│  Mobile App │
│  (本地服务)  │   注册    │  (信令服务器) │   配对    │  (移动设备)  │
└─────────────┘          └──────────────┘          └─────────────┘
      ▲                         │                         ▲
      │                         ▼                         │
      │                   ┌──────────┐                    │
      └───────────────────┤  Redis   ├───────────────────┘
           心跳/状态       └──────────┘      临时存储
```

## 快速导航

- [快速开始](/guide/getting-started) - 5分钟上手
- [安装指南](/guide/installation) - 详细安装步骤
- [API 文档](/guide/api) - 完整 API 参考
- [架构设计](/technical/architecture) - 技术架构说明

## 社区与支持

- 💬 [GitHub Discussions](https://github.com/7788ken/linkgate/discussions) - 问题讨论
- 🐛 [Issue Tracker](https://github.com/7788ken/linkgate/issues) - 问题反馈
- 📖 [文档仓库](https://github.com/7788ken/linkgate) - 文档贡献

## 许可证

LinkGate 基于 MIT 许可证开源。
