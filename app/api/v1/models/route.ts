import { NextResponse } from "next/server";
import { ensureTablesExist, getOrCreateModelPrice } from "@/lib/db";

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

// 规范化域名格式
function normalizeApiUrl(domain: string): string {
  try {
    // 移除首尾空格
    const normalizedDomain = domain.trim();

    // 提取域名的核心部分（移除协议、路径等）
    const domainMatch = normalizedDomain.match(/(?:https?:\/\/)?([^\/\s]+)/i);
    if (!domainMatch) {
      throw new Error("Invalid domain format");
    }

    const coreDomain = domainMatch[1];

    // 构建完整的 API URL
    return `https://${coreDomain}/api/models`;
  } catch (error) {
    console.error("Domain normalization error:", error);
    throw new Error("Invalid domain format");
  }
}

export async function GET() {
  try {
    // 确保数据库已初始化
    await ensureTablesExist();
    // console.log("Database initialized, fetching models...");

    const domain = process.env.OPENWEBUI_DOMAIN;
    if (!domain) {
      throw new Error("OPENWEBUI_DOMAIN 环境变量未设置");
    }

    // 规范化 API URL
    const apiUrl = normalizeApiUrl(domain);
    // console.log("Normalized API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("API response status:", response.status);
      console.error("API response text:", await response.text());
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    // 先获取响应文本以便调试
    const responseText = await response.text();
    // console.log("API response:", responseText);

    let data: ModelResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      throw new Error("Invalid JSON response from API");
    }

    if (!data || !Array.isArray(data.data)) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Unexpected API response structure");
    }

    // 获取所有模型的价格信息
    const modelsWithPrices = await Promise.all(
      data.data.map(async (item) => {
        if (!item.info) {
          console.warn("Model item missing info:", item);
          return null;
        }
        const priceInfo = await getOrCreateModelPrice(
          item.info.id,
          item.info.name
        );
        return {
          id: item.info.id,
          name: item.info.name,
          imageUrl: item.info.meta?.profile_image_url || "",
          input_price: priceInfo.input_price,
          output_price: priceInfo.output_price,
        };
      })
    );

    // 过滤掉无效的模型
    const validModels = modelsWithPrices.filter(
      (model): model is NonNullable<typeof model> => model !== null
    );

    return NextResponse.json(validModels);
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

// 添加 inlet 端点
export async function POST(req: Request) {
  const data = await req.json();

  return new Response("Inlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}

// 添加 outlet 端点
export async function PUT(req: Request) {
  const data = await req.json();
  // console.log("Outlet received:", JSON.stringify(data, null, 2));

  return new Response("Outlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}
