<div align="center">

# OpenWebUI Monitor

</div>

---

专为 OpenWebUI 设计的用量监控和用户余额管理平台。只需要向 OpenWebUI 添加一个简单的[函数插件](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/functions/openwebui_monitor.py)，就能在一个面板统一查看用户使用情况和余额。

## 特性

- 管理 OpenWebUI 提供的模型价格
- 管理用户信息和余额
- 查看使用统计数据和可视化

## 部署

### Vercel 部署

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor)

### Docker 部署

```bash
sudo docker run -d --name openwebui-monitor -p 3000:3000 ghcr.io/variantconst/openwebui-monitor:latest
```

## 环境变量

- `OPENAI_API_KEY`：OpenAI API Key
- `CODE`：OpenWebUI 的 Code

## 画廊
