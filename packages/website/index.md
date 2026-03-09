---
layout: home

hero:
  name: "LinkGate"
  text: "轻量级设备配对信令服务"
  tagline: 安全、临时、零配置的本地与移动设备连接方案
  image:
    src: /logo.svg
    alt: LinkGate
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/linkgate/linkgate

features:
  - icon: 🔒
    title: 隐私优先
    details: 不持久化敏感数据,配对即焚。所有临时信息在配对完成后自动删除
  - icon: ⚡
    title: 极速配对
    details: 6位数字配对码,一次性使用,快速完成设备连接
  - icon: 🔄
    title: 自动重连
    details: Agent断线后自动重新注册,保持连接稳定
  - icon: 🎯
    title: 零配置
    details: 一条命令即可启动,无需复杂配置
  - icon: 🌐
    title: 公益性质
    details: 免费开放,低资源消耗,可自托管
  - icon: 🚀
    title: 现代架构
    details: 基于 Fastify + Redis,支持 WebSocket 实时通信
---

<style>
.VPHero .name {
  background: linear-gradient(120deg, #22c55e 0%, #16a34a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.VPFeature {
  transition: transform 0.3s ease;
}

.VPFeature:hover {
  transform: translateY(-8px);
}
</style>
