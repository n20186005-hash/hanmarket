# Chợ Hàn · Han Market Guide

这是一个**独立、非营利**的岘港韩市场游客信息网站。网站默认使用越南语，并提供完整英语版本；两个语言路径分别是 `/` 与 `/en/`，不会在同一正文中混合语言。

## 技术栈

| 项目 | 实现 |
| --- | --- |
| 网站框架 | Astro 7.2.7 + TypeScript 5.9.3 |
| 样式 | Tailwind CSS 4.3.3 与项目级编辑风格 CSS |
| 部署目标 | Cloudflare Workers + 静态 Astro 构建产物 |
| 包管理 | pnpm 10.4.1（由 `packageManager` 固定） |
| 运行时 | Node.js 22.13.0（由 `.node-version` 和 `engines` 固定） |
| 数据与账号 | 无数据库、无登录、无 CMS |

## 域名配置

网站的唯一生产 URL 配置位于 `astro.config.ts` 中的 `site` 常量。默认值为 `undefined`，因此本地检查和构建不会因域名缺失而失败，也不会生成占位域名。

> 当域名确定后，只需将 `const site = undefined` 改为真实的 HTTPS 域名，例如 `const site = "https://your-domain.vn"`，再重新构建。canonical、Open Graph URL、`hreflang` 以及 `@astrojs/sitemap` 均从该处派生。

## 本地开发与验证

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm dev
```

部署前请在 Cloudflare 中创建或绑定对应 Worker，再执行：

```bash
pnpm deploy
```

`wrangler.jsonc` 会将 `dist/` 静态构建目录作为 `ASSETS` 绑定，并由 `src/worker.ts` 转发请求。项目不包含手写 sitemap；仅在填入 `site` 后启用 `@astrojs/sitemap` 自动生成。

## 内容与隐私原则

首页包含 `TouristAttraction` / `LocalBusiness` 和 `FAQPage` JSON-LD。开放时段、交通、停车、洗手间和其他设施均按“参考信息、到访前核实”的原则撰写，不编造具体摊位、公共交通班次、容量或价格。

Google Analytics 4（`G-HXM22WWPKP`）只会在访问者于 Cookie 设置页明确开启分析 cookie 后加载。隐私政策、服务条款和 Cookie 设置均为可直接访问的独立二级页面，而非弹窗。

真实照片用于信息性说明，权利仍归原摄影者或权利人。资料来源和编辑核验记录见 `research_notes.md`。
