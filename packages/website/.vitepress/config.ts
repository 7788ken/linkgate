import { defineConfig } from 'vitepress'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  title: 'LinkGate',
  description: 'Lightweight, Ephemeral Device Pairing Signaling Service',

  // 多语言配置
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Technical', link: '/technical/architecture' },
          { text: 'FAQ', link: '/faq' },
          {
            text: 'Links',
            items: [
              { text: 'GitHub', link: 'https://github.com/7788ken/linkgate' },
              { text: 'Issues', link: 'https://github.com/7788ken/linkgate/issues' }
            ]
          }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/guide/' },
                { text: 'Quick Start', link: '/guide/getting-started' },
                { text: 'Installation', link: '/guide/installation' }
              ]
            },
            {
              text: 'Core Features',
              items: [
                { text: 'Agent Configuration', link: '/guide/agent' },
                { text: 'Gateway API', link: '/guide/api' },
                { text: 'Pairing Flow', link: '/guide/pairing' }
              ]
            },
            {
              text: 'Advanced',
              items: [
                { text: 'Deployment Guide', link: '/guide/deployment' },
                { text: 'Best Practices', link: '/guide/best-practices' }
              ]
            }
          ],
          '/technical/': [
            {
              text: 'Technical Docs',
              items: [
                { text: 'Architecture', link: '/technical/architecture' },
                { text: 'Tech Stack', link: '/technical/stack' },
                { text: 'Security', link: '/technical/security' }
              ]
            }
          ]
        },
        editLink: {
          pattern: 'https://github.com/7788ken/linkgate/edit/master/packages/website/:path',
          text: 'Edit this page on GitHub'
        },
        footer: {
          message: 'Released under the MIT License',
          copyright: 'Copyright © 2026-present LinkGate Team'
        },
        docFooter: {
          prev: 'Previous',
          next: 'Next'
        },
        outline: {
          label: 'On this page'
        },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'short'
          }
        },
        langMenuLabel: 'Change language',
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode'
      }
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '使用文档', link: '/zh/guide/getting-started' },
          { text: '技术文档', link: '/zh/technical/architecture' },
          { text: 'FAQ', link: '/zh/faq' },
          {
            text: '相关链接',
            items: [
              { text: 'GitHub', link: 'https://github.com/7788ken/linkgate' },
              { text: '问题反馈', link: 'https://github.com/7788ken/linkgate/issues' }
            ]
          }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '开始使用',
              items: [
                { text: '简介', link: '/zh/guide/' },
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '安装指南', link: '/zh/guide/installation' }
              ]
            },
            {
              text: '核心功能',
              items: [
                { text: 'Agent 配置', link: '/zh/guide/agent' },
                { text: 'Gateway API', link: '/zh/guide/api' },
                { text: '配对流程', link: '/zh/guide/pairing' }
              ]
            },
            {
              text: '进阶',
              items: [
                { text: '部署指南', link: '/zh/guide/deployment' },
                { text: '最佳实践', link: '/zh/guide/best-practices' }
              ]
            }
          ],
          '/zh/technical/': [
            {
              text: '技术文档',
              items: [
                { text: '架构设计', link: '/zh/technical/architecture' },
                { text: '技术选型', link: '/zh/technical/stack' },
                { text: '安全设计', link: '/zh/technical/security' }
              ]
            }
          ]
        },
        editLink: {
          pattern: 'https://github.com/7788ken/linkgate/edit/master/packages/website/:path',
          text: '在 GitHub 上编辑此页'
        },
        footer: {
          message: '基于 MIT 许可发布',
          copyright: 'Copyright © 2026-present LinkGate Team'
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        outline: {
          label: '页面导航'
        },
        lastUpdated: {
          text: '最后更新于',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'short'
          }
        },
        langMenuLabel: '多语言',
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '主题',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式'
      }
    }
  },

  // 主题配置
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'LinkGate',

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/7788ken/linkgate' }
    ],

    // 搜索
    search: {
      provider: 'local'
    }
  },

  // GitHub Pages 部署需要设置 base
  base: process.env.NODE_ENV === 'production' ? '/linkgate/' : '/',

  // Vite 配置
  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()]
      }
    }
  },

  // 语言配置
  lastUpdated: true,

  // Head 配置
  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ]
})
