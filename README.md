<div align="center">

# OpenWebUI Monitor

</div>

A monitoring dashboard for OpenWebUI that tracks usage and manages user balances. Simply add a [function](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/functions/openwebui_monitor.py) to OpenWebUI to view user activity and balances in a unified panel.

## Features

- Set prices for each model in OpenWebUI;
- Set balance for each user, deduct based on token consumption and model prices, with notifications at the end of each chat;
- View user data and visualizations;
- One-click test for all model availability.

## Deployment

### Deploy Server

**Vercel Deployment**

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor)

After deployment, go to `Storage -> Create Database` to select and connect Neon Postgres. You'll also need to go to `Settings -> Environment Variables` to add environment variables as described below. Finally, redeploy the project. Once successfully deployed, you'll get a domain name that needs to be added to the OpenWebUI function plugin.

**Docker Deployment**

Copy and fill in the environment variables according to the requirements below.

```bash
cp .env.example .env
vi .env
```

Then run in the project root directory

```bash
sudo docker compose up -d --build
```

If you need to modify the project running port, please edit `docker-compose.yml`.

### Install OpenWebUI Function Plugin

Add this [OpenWebUI-Monitor function](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/functions/openwebui_monitor.py) to OpenWebUI functions. After adding, click on function settings to configure the API endpoint and API key.

## Environment Variables

| Variable Name     | Description                                                           | Example                    |
| ----------------- | --------------------------------------------------------------------- | -------------------------- |
| INIT_BALANCE      | Initial user balance                                                  | `1.14`                     |
| OPENWEBUI_DOMAIN  | OpenWebUI domain                                                      | `https://chat.example.com` |
| OPENWEBUI_API_KEY | OpenWebUI API Key, found in `Personal Settings -> Account -> API Key` | `owui-xxxxxxxxxxxxxxxx`    |
| API_KEY           | For API request verification                                          | `your-api-key-here`        |
| ACCESS_TOKEN      | For page access verification                                          | `your-access-token-here`   |

---

Ensure to generate strong `API_KEY` and `ACCESS_TOKEN`, you can use [1Password](https://1password.com/password-generator) to generate them online.

<details>
  <summary><h2>Gallery</h2></summary>
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
