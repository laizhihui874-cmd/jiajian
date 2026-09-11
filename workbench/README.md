# 甲间 · 本地美甲设计工作台

早期设计工作台快照：搭配甲形、颜色、图案与饰品，保存草稿和作品，导出设计图。

需要 Node.js 22.12+、npm 和已经启动的 Docker。

```sh
npm ci
npm run setup
npm run db:up
npm run dev
```

访问 http://127.0.0.1:4320/ 。自动保存的是当前草稿；“保存作品”将设计加入作品集，打开后可继续编辑。

`npm run db:stop` 停止数据库但保留作品。不要使用删除数据库卷的命令，除非确定放弃已保存作品。

本地设置由 `npm run setup` 创建，不要提交 `.env`。默认数据库地址是本机 5438 端口，不连接其他业务数据库。

检查：`npm test`、`npm run build`、`npm run lint`。构建后 `npm start` 运行。

完整范围与限制见[项目首页](../README.md)。
