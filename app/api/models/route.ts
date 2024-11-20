import { NextResponse } from "next/server";

interface ModelInfo {
  id: string;
  name: string;
  meta: {
    profile_image_url: string;
  };
}

interface ModelResponse {
  data: {
    info: ModelInfo;
  }[];
}

function normalizeUrl(domain: string): string {
  // 移除首尾空格
  let url = domain.trim();

  // 如果没有协议前缀，添加 https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // 移除末尾的斜杠
  url = url.replace(/\/+$/, "");

  // 确保域名格式正确
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch (e) {
    console.error("Invalid URL format:", e);
    throw new Error("无效的域名格式");
  }
}

export async function GET() {
  try {
    const domain = process.env.OPENWEBUI_DOMAIN;
    if (!domain) {
      throw new Error("OPENWEBUI_DOMAIN 环境变量未设置");
    }

    const normalizedDomain = normalizeUrl(domain);
    const apiUrl = `${normalizedDomain}/api/models`;

    console.log("Requesting models from:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`
      );
    }

    const data: ModelResponse = await response.json();

    const models = data.data.map((item) => ({
      id: item.info.id,
      name: item.info.name,
      imageUrl: item.info.meta.profile_image_url,
    }));

    return NextResponse.json(models);
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch models",
      },
      { status: 500 }
    );
  }
}
