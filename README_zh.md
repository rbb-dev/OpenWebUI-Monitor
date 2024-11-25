<div align="center">

# OpenWebUI Monitor

</div>

专为 OpenWebUI 设计的用量监控和用户余额管理面板。只需要向 OpenWebUI 添加一个简单的[函数](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/functions/openwebui_monitor.py)，就能在一个面板统一查看用户使用情况和余额。

## 特性

- 为 OpenWebUI 中的每个模型设置价格；
- 为每个用户设置余额，根据对话消耗 tokens 和模型价格扣除，并在每条聊天末尾提示；
- 查看用户使用数据和可视化。
- 一键测试所有模型的可用性。

## 部署

### 部署服务端

**Vercel 部署**

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor)

部署后，需要进入项目 `Storage -> Create Database` 选择 Neon Postgres 并链接。还需要前往 `Settings -> Environment Variables` 按照后文的说明逐个添加环境变量。最后重新 deploy 项目即可。项目部署成功后会得到一个域名，你需要把这个域名填写到 OpenWebUI 的函数插件中去。

**Docker 部署**

复制并根据后文的要求填写环境变量。

```bash
cp .env.example .env
vi .env
```

之后在项目根目录下运行

```bash
sudo docker compose up -d --build
```

如果需要修改项目运行端口，请修改 `docker-compose.yml`。

### 安装 OpenWebUI 函数插件

将这段 [OpenWebUI-Monitor 函数](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/functions/openwebui_monitor.py) 添加到 OpenWebUI 的函数中。添加后，点击函数设置，配置好 api 端点和 api key。

## 环境变量

| 变量名            | 说明                                                          | 示例                       |
| ----------------- | ------------------------------------------------------------- | -------------------------- |
| INIT_BALANCE      | 用户初始余额                                                  | `1.14`                     |
| OPENWEBUI_DOMAIN  | OpenWebUI 的域名                                              | `https://chat.example.com` |
| OPENWEBUI_API_KEY | OpenWebUI 的 API Key，在 `个人设置 -> 账号 -> API密钥` 中获取 | `owui-xxxxxxxxxxxxxxxx`    |
| API_KEY           | 用于 API 请求验证                                             | `your-api-key-here`        |
| ACCESS_TOKEN      | 用于页面访问验证                                              | `your-access-token-here`   |

---

确保生成强的 `API_KEY` 和 `ACCESS_TOKEN`，可以利用 [1Password](https://1password.com/password-generator) 在线生成。

<details>
  <summary><h2>画廊</h2></summary>
  <div style="display: flex; flex-wrap: wrap; justify-content: center;">
    <div style="flex: 1 1 50%; padding: 5px; box-sizing: border-box;">
      <img src="https://github.com/user-attachments/assets/653e2e01-9861-472b-a6c9-4ddcf1e9133a" alt="Gallery Image 1" style="width: 100%; display: block;">
    </div>
    <div style="flex: 1 1 50%; padding: 5px; box-sizing: border-box;">
      <img src="https://github.com/user-attachments/assets/ebacc463-d31a-4cfa-bae2-2e5d05c18483" alt="Gallery Image 2" style="width: 100%; display: block;">
    </div>
    <div style="flex: 1 1 50%; padding: 5px; box-sizing: border-box;">
      <img src="https://github.com/user-attachments/assets/20c7078b-4d12-49ac-b347-35d770abe85e" alt="Gallery Image 3" style="width: 100%; display: block;">
    </div>
    <div style="flex: 1 1 50%; padding: 5px; box-sizing: border-box;">
      <img src="https://github.com/user-attachments/assets/d88d9b44-3254-4189-82ae-ce4fbb6279b8" alt="Gallery Image 4" style="width: 100%; display: block;">
    </div>
    <div style="flex: 1 1 50%; padding: 5px; box-sizing: border-box;">
      <img src="https://github.com/user-attachments/assets/3eec480e-cb73-41f3-9cea-0759d77e30c4" alt="Gallery Image 5" style="width: 100%; display: block;">
    </div>
  </div>
</details>
