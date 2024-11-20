import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  if (!domain) return "";

  // 移除首尾空格
  let url = domain.trim();

  // 如果没有协议前缀，添加 https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // 移除末尾的斜杠
  url = url.replace(/\/+$/, "");

  return url;
}

export async function GET() {
  try {
    const domain = process.env.OPENWEBUI_DOMAIN;
    if (!domain) {
      throw new Error("OPENWEBUI_DOMAIN 环境变量未设置");
    }

    const normalizedDomain = normalizeUrl(domain);
    if (!normalizedDomain) {
      throw new Error("无效的域名格式");
    }

    const apiUrl = `${normalizedDomain}/api/models`;
    console.log("Requesting URL:", apiUrl); // 调试日志

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.JWT_TOKEN || ""}`,
      },
      // 添加超时设置
      signal: AbortSignal.timeout(10000), // 10 秒超时
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ModelResponse;
    if (!data || !Array.isArray(data.data)) {
      throw new Error("返回数据格式错误");
    }

    // 获取所有模型的价格信息
    const modelPrices = await prisma.modelPrice.findMany();
    const priceMap = new Map(modelPrices.map((mp) => [mp.id, mp]));

    // 合并API返回的模型信息和价格信息
    const models = await Promise.all(
      data.data.map(async (item) => {
        if (!item.info || !item.info.id) {
          console.warn("Invalid model data:", item);
          return null;
        }

        let priceInfo = priceMap.get(item.info.id);

        // 如果是新模型，创建默认价格记录
        if (!priceInfo) {
          try {
            priceInfo = await prisma.modelPrice.create({
              data: {
                id: item.info.id,
                name: item.info.name || "Unknown Model",
                inputPrice: 60,
                outputPrice: 60,
              },
            });
          } catch (err) {
            console.error("Error creating price record:", err);
            return null;
          }
        }

        return {
          id: item.info.id,
          name: item.info.name || "Unknown Model",
          imageUrl: item.info.meta?.profile_image_url || "",
          inputPrice: priceInfo.inputPrice,
          outputPrice: priceInfo.outputPrice,
        };
      })
    );

    // 过滤掉无效的模型数据
    const validModels = models.filter(
      (model): model is NonNullable<typeof model> => model !== null
    );

    return NextResponse.json(validModels);
  } catch (error) {
    console.error(
      "Error fetching models:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取模型失败" },
      { status: 500 }
    );
  }
}

// 添加更新价格的端点
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, inputPrice, outputPrice } = body;

    const updatedPrice = await prisma.modelPrice.update({
      where: { id },
      data: {
        inputPrice: parseFloat(inputPrice),
        outputPrice: parseFloat(outputPrice),
      },
    });

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("Error updating model price:", error);
    return NextResponse.json(
      { error: "Failed to update model price" },
      { status: 500 }
    );
  }
}
