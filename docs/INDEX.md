# LinkGate 项目概览

## 📁 项目结构

```
linkgate/
├── .gitignore              # Git 忽略配置
├── README.md               # 项目说明 (快速开始)
├── TODO.md                 # 待办事项与开发计划
└── docs/                   # 文档目录
    ├── en/                 # 英文文档
    │   ├── README.md      # 完整英文文档
    │   └── PROJECT_STRUCTURE.md  # 项目结构规划
    └── zh/                 # 中文文档
        ├── README.md      # 完整中文文档
        └── PROJECT_STRUCTURE.md  # 项目结构规划
```

## 📚 文档导航

### 快速开始
- **[README.md](../README.md)** - 项目简介、快速开始、核心特性

### 详细文档
- **[中文文档](./zh/README.md)** - 完整的中文策划文档
  - 项目简介与定位
  - 工作流程图解
  - 类似项目对比
  - 核心模块设计
  - 技术选型建议
  - 实施计划 (4 个阶段)
  - 安全考虑
  - 参考资源

- **[English Docs](./en/README.md)** - Complete English documentation
  - Project overview & positioning
  - Workflow diagrams
  - Similar projects comparison
  - Core module design
  - Technology stack options
  - Implementation plan (4 phases)
  - Security considerations
  - References

### 架构设计
- **[项目结构规划 (中文)](./zh/PROJECT_STRUCTURE.md)**
  - 完整目录结构
  - 分阶段目录演进
  - 核心模块说明
  - 技术选型建议

- **[Project Structure (English)](./en/PROJECT_STRUCTURE.md)**
  - Complete directory structure
  - Phased directory evolution
  - Core module descriptions
  - Technology recommendations

### 开发计划
- **[TODO.md](../TODO.md)** - 详细的待办事项列表
  - 近期待办 (本周)
  - 阶段 1: MVP (2-3 周)
  - 阶段 2: 增强功能 (2-4 周)
  - 阶段 3: P2P 优化 (1-2 个月)
  - 阶段 4: 生产运营

## 🎯 项目定位

**LinkGate** 是一个**轻量级、一次性的设备配对信令服务**

### 核心特性
- ✅ **临时性** - 配对后自动删除数据
- ✅ **公益性** - 免费开放,低资源消耗
- ✅ **零配置** - 一条命令即可启动
- ✅ **隐私优先** - 不持久化敏感信息

### 使用场景
- 本地电脑/服务器 Agent 与移动终端 APP 配对
- IoT 设备与控制端的安全连接
- 临时 P2P 连接建立

## 🚀 下一步行动

### 立即开始
1. **阅读文档**: 先看 [中文文档](./zh/README.md) 或 [English Docs](./en/README.md)
2. **确定技术栈**: 参考 [技术选型建议](./zh/README.md#技术选型)
3. **开始开发**: 按照 [TODO.md](../TODO.md) 的计划执行

### 技术选型建议
- **推荐方案**: Node.js + Express/Fastify + Redis (轻量级,快速开发)
- **企业级**: Go/Rust + PostgreSQL + Redis (高性能,生产环境)
- **P2P 优先**: WebRTC + STUN/TURN (实时通信,低延迟)

### MVP 目标 (2-3 周)
- [ ] Gateway 服务器基础 API
- [ ] Agent 客户端 CLI 工具
- [ ] Redis 临时存储
- [ ] 基础配对流程
- [ ] 单元测试

## 📊 项目状态

🚧 **规划阶段** (2026-03-08)

- ✅ 需求分析完成
- ✅ 架构设计完成
- ✅ 文档编写完成
- ⏳ 开发环境准备
- ⏳ MVP 开发中

## 🔗 相关资源

### 类似项目
- [Tailscale](https://tailscale.com) - P2P VPN
- [FRP](https://github.com/fatedier/frp) - 反向代理
- [OpenClaw](https://docs.openclaw.ai) - 设备配对
- [Octelium](https://octelium.com) - 远程访问

### 技术文档
- [WebRTC Signaling](https://antmedia.io/webrtc-signaling-servers-everything-you-need-to-know/)
- [NAT Traversal](https://community.cisco.com/t5/collaboration-knowledge-base/demystifying-nat-traversal-with-stun-turn-and-ice/ta-p/4766853)
- [Awesome Tunneling](https://github.com/anderspitman/awesome-tunneling)

## 💬 联系方式

- 项目主页: https://github.com/linkgate/linkgate (待创建)
- 问题反馈: https://github.com/linkgate/linkgate/issues (待创建)

---

**最后更新**: 2026-03-08
