import { defineConfig } from 'vitepress'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  title: 'LinkGate',
  description: '轻量级、一次性的设备配对信令服务',

  // GitHub Pages 部署需要设置 base
  base: process.env.NODE_ENV === 'production' ? '/linkgate/' : '/',

  // 主题配置
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'LinkGate',

    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '使用文档', link: '/guide/getting-started' },
      { text: '技术文档', link: '/technical/architecture' },
      { text: 'FAQ', link: '/faq' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/linkgate/linkgate' },
          { text: '问题反馈', link: 'https://github.com/linkgate/linkgate/issues' }
        ]
      }
    ],

    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '简介', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装指南', link: '/guide/installation' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: 'Agent 配置', link: '/guide/agent' },
            { text: 'Gateway API', link: '/guide/api' },
            { text: '配对流程', link: '/guide/pairing' }
          ]
        },
        {
          text: '进阶',
          items: [
            { text: '部署指南', link: '/guide/deployment' },
            { text: '最佳实践', link: '/guide/best-practices' }
          ]
        }
      ],
      '/technical/': [
        {
          text: '技术文档',
          items: [
            { text: '架构设计', link: '/technical/architecture' },
            { text: '技术选型', link: '/technical/stack' },
            { text: '安全设计', link: '/technical/security' }
          ]
        }
      ]
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/linkgate/linkgate' }
    ],

    // 页脚
    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present LinkGate Team'
    },

    // 搜索
    search: {
      provider: 'local'
    },

    // 编辑链接
    editLink: {
      pattern: 'https://github.com/linkgate/linkgate/edit/master/packages/website/:path',
      text: '在 GitHub 上编辑此页'
    }
  },

  // Vite 配置
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()]
      }
    }
  },

  // 语言配置
  lang: 'zh-CN',
  lastUpdated: true,

  // Head 配置
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ]
})
