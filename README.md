<div align="center">
  
![](https://github.com/user-attachments/assets/fb90a4cc-2e54-495c-87ca-34c1a54bf2c8)

# OpenWebUI Monitor

**English** / [简体中文](./resources/tutorials/zh-cn/README_zh.md)

</div>

A monitoring dashboard for OpenWebUI that tracks usage and manages user balances. Simply add a [function](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/functions/openwebui_monitor.py) to OpenWebUI to view user activity and balances in a unified panel.

## Features

- Set prices for each model in OpenWebUI;
- Set balance for each user, deduct based on token consumption and model prices, with notifications at the end of each chat;
- View user data and visualizations;
- One-click test for all model availability.

## Deployment

Supports one-click deployment on Vercel [![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=openwebui-monitor&env=OPENWEBUI_DOMAIN,OPENWEBUI_API_KEY,ACCESS_TOKEN,API_KEY) and Docker deployment. See [Deployment Guide](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/tutorials/en/deployment_guide.md) for details.

## Updates

For Vercel, sync fork and redeploy your project. For Docker, simply pull the latest image and restart the container:

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
| API_KEY           | For API request verification (must be less than 56 characters)        | `your-api-key-here`        |
| ACCESS_TOKEN      | For page access verification                                          | `your-access-token-here`   |

### Optional

| Variable Name               | Description                                                                                                                                 | Default Value |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| DEFAULT_MODEL_INPUT_PRICE   | Default model input price, in USD per million tokens                                                                                        | `60`          |
| DEFAULT_MODEL_OUTPUT_PRICE  | Default model output price, in USD per million tokens                                                                                       | `60`          |
| DEFAULT_MODEL_PER_MSG_PRICE | Default model price for each message, in USD                                                                                                | `-1`          |
| INIT_BALANCE                | Initial user balance                                                                                                                        | `0`           |
| COST_ON_INLET               | Pre-deduction amount on inlet. Can be a fixed number for all models (e.g. `0.1`), or model-specific format (e.g. `gpt-4:0.32,gpt-3.5:0.01`) | `0`           |

<h2>Gallery</h2>

![](https://github.com/user-attachments/assets/63f23bfd-f271-41e8-a71c-2016be1d501a)
