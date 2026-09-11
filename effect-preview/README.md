# 甲间 · 光感探索与手机外框预览

探索光感、材质与图案搭配，也可以在手机尺寸下操作工作台。

```sh
npm ci
npm run dev:workspace
```

打开 http://127.0.0.1:4321/mobile-preview.html 。电脑页面：http://127.0.0.1:4321/ 。

需要 Node.js 22.12+，此入口不需要 Docker、数据库、账号或图片生成服务。设计保存在当前浏览器中；清除浏览器数据会丢失保存内容。

不依赖数据库的构建：`npm run build:workspace`。预览构建结果：`npm run preview -- --host 127.0.0.1`，再进入输出地址的 `/mobile-preview.html`。

本目录保留了旧服务文件，但快速体验请使用 `dev:workspace`，不要用需要数据库的 `dev`。

手部模型与图片属于展示素材，不代表真实个人试戴。参见[项目说明](../README.md)和[第三方说明](../THIRD_PARTY_NOTICES.md)。
