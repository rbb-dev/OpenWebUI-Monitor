<div align="center">

# OpenWebUI Monitor

</div>

专为 OpenWebUI 设计的用量监控和用户余额管理面板。只需要向 OpenWebUI 添加一个简单的[函数插件](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/functions/openwebui_monitor.py)，就能在一个面板统一查看用户使用情况和余额。

---

## 特性

- 为 OpenWebUI 中的每个模型设置价格；
- 为每个用户设置余额，根据对话消耗 tokens 和模型价格扣除余额；
- 查看用户使用数据和可视化。

---

## 部署

### 服务端

**Vercel 部署**

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor)

部署后，需要进入项目 Storage -> Create Database 选择 Neon Postgres 并链接。还需要前往 Settings -> Environment Variables 按照后文的说明逐个添加环境变量。最后重新 deploy 项目即可。项目部署成功后会得到一个域名，你需要把这个域名填写到 OpenWebUI 的函数插件中去。

**Docker 部署**

```bash
sudo docker run -d --name openwebui-monitor -p 3000:3000 ghcr.io/variantconst/openwebui-monitor:latest
```

### OpenWebUI 函数插件

---

## 环境变量

| 变量名            | 说明                 | 示例                       |
| ----------------- | -------------------- | -------------------------- |
| INIT_BALANCE      | 用户初始余额         | `1.14`                     |
| OPENWEBUI_DOMAIN  | OpenWebUI 的域名     | `https://chat.example.com` |
| OPENWEBUI_API_KEY | OpenWebUI 的 API Key | `owui-xxxxxxxxxxxxxxxx`    |
| ACCESS_TOKEN      | 用于页面访问验证     | `your-access-token-here`   |
| API_KEY           | 用于 API 请求验证    | `your-api-key-here`        |

---

## 画廊
