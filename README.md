This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 项目部署指南

## 环境变量设置

在 Vercel 部署时，需要设置以下环境变量：

- `POSTGRES_URL`: PostgreSQL 数据库连接 URL
- `OPENWEBUI_DOMAIN`: OpenWebUI 域名
- `JWT_TOKEN`: JWT 认证令牌

## 自动数据库迁移

数据库结构会在部署时自动创建和更新。项目使用 Prisma 进行数据库管理，在每次部署时会自动运行必要的数据库迁移。

## 部署步骤

1. Fork 本项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 设置必要的环境变量
4. 部署项目

数据库结构会在首次部署时自动创建。
