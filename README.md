# AI 装修互动全景生成系统

这是一个独立的新项目，用于实现：

上传户型图 / PDF / DXF -> 自动识别房间 -> 选择装修风格和模型 -> 上传参考图 -> AI 对话调整 -> 生成风格预览 -> 批量生成房间效果图 -> 互动展示 -> 人工发布。

## 本地运行

```bash
npm install
copy .env.example .env
npm run prisma:push
npm run seed
npm run dev
```

访问：

- 首页：`http://127.0.0.1:3000`
- 后台：`http://127.0.0.1:3000/admin`

后台使用 Basic Auth：

- 默认账号：`admin`
- 默认密码：`change-this-password`

正式部署前必须修改 `.env.production` 中的 `ADMIN_PASSWORD`。

## 上传格式要求

### 图片 JPG / PNG / WebP

- 建议不低于 `2000 x 1500` 像素，推荐长边 `3000px+`。
- 户型完整、正向、清晰，不裁掉房间名、尺寸、墙体、门窗。
- 优先黑白或浅色背景，避免营销海报、水印和强装饰背景。

### PDF

- 优先矢量 PDF；扫描 PDF 建议不低于 `300 DPI`。
- 第一版只识别单页户型图，多页 PDF 需选择目标页面。
- 不支持加密 PDF。

### DXF

- 仅支持二维平面户型图 DXF，不支持 DWG、三维模型、立面图、剖面图。
- 单位优先 `mm`。
- 墙、门、窗、文字标注建议分层清晰。
- 房间文字需保留普通文字对象，不要全部转曲线。

## 图像模型

默认使用 OpenAI GPT Image 系列：

```bash
OPENAI_API_KEY=你的密钥
OPENAI_IMAGE_MODEL=gpt-image-2
```

项目已预留阿里云百炼万相、火山 Seedream、腾讯混元生图的 provider 入口。第一版 OpenAI 为真实调用，其余供应商在密钥和接口参数确认后接入。

## 腾讯云轻量服务器部署建议

```bash
mkdir -p /opt/ai-panorama-renovation-app
cd /opt/ai-panorama-renovation-app
npm install
npm run prisma:push
npm run seed
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

推荐端口为 `3002`，避免和已有 `3000/3001` 服务冲突。

Nginx 可参考 `deploy/nginx-ai-panorama-renovation.conf`。

## 备份

```bash
npm run backup
```

当前脚本会生成备份清单。正式生产建议用 `tar` 或 `zip` 打包：

- `data/panorama.db`
- `public/uploads`

打包时排除 SQLite 的 `*.db-wal` 和 `*.db-shm` 临时文件。
