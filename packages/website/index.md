---
layout: home

hero:
  name: "LinkGate"
  text: "Lightweight Device Pairing Service"
  tagline: Secure, ephemeral, zero-configuration connection solution for local and mobile devices
  image:
    src: /logo.svg
    alt: LinkGate
  actions:
    - theme: brand
      text: Quick Start
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/7788ken/linkgate

features:
  - icon: 🔒
    title: Privacy First
    details: No persistent sensitive data, burn after pairing. All temporary information is automatically deleted after pairing is complete
  - icon: ⚡
    title: Fast Pairing
    details: 6-digit pairing code, one-time use, quickly complete device connection
  - icon: 🔄
    title: Auto Reconnect
    details: Agent automatically re-registers after disconnection, maintaining stable connections
  - icon: 🎯
    title: Zero Configuration
    details: Start with a single command, no complex configuration needed
  - icon: 🌐
    title: Public Service
    details: Free and open source, low resource consumption, self-hostable
  - icon: 🚀
    title: Modern Architecture
    details: Built on Fastify + Redis, supports WebSocket real-time communication
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
