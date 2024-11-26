<div align="center">

# OpenWebUI Monitor

</div>

A monitoring dashboard for OpenWebUI that tracks usage and manages user balances. Simply add a [function](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/functions/openwebui_monitor.py) to OpenWebUI to view user activity and balances in a unified panel.

## Features

- Set prices for each model in OpenWebUI;
- Set balance for each user, deduct based on token consumption and model prices, with notifications at the end of each chat;
- View user data and visualizations;
- One-click test for all model availability.

## Deployment

Supports one-click deployment on Vercel [![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor) and Docker deployment. See [Deployment Guide](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/tutorials/en/deployment_guide.md) for details.

## Updates

Vercel deployments will update automatically. If there are issues, you can manually sync fork in your forked repository. For Docker, simply pull the latest image and restart the container:

```bash
sudo docker compose pull
sudo docker compose up -d
```

## Environment Variables

### Required

| Variable Name     | Description                                                           | Example                    |
| ----------------- | --------------------------------------------------------------------- | -------------------------- |
| OPENWEBUI_DOMAIN  | OpenWebUI domain                                                      | `https://chat.example.com` |
| OPENWEBUI_API_KEY | OpenWebUI API Key, found in `Personal Settings -> Account -> API Key` | `sk-xxxxxxxxxxxxxxxx`      |
| API_KEY           | For API request verification                                          | `your-api-key-here`        |
| ACCESS_TOKEN      | For page access verification                                          | `your-access-token-here`   |

### Optional

| Variable Name              | Description                                           | Default Value |
| -------------------------- | ----------------------------------------------------- | ------------- |
| DEFAULT_MODEL_INPUT_PRICE  | Default model input price, in USD per million tokens  | `60`          |
| DEFAULT_MODEL_OUTPUT_PRICE | Default model output price, in USD per million tokens | `60`          |
| INIT_BALANCE               | Initial user balance                                  | `0`           |

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
