import { NextResponse } from "next/server";
import { ensureTablesExist, getOrCreateModelPrice } from "@/lib/db";

interface ModelInfo {
  id: string;
  base_model_id: string;
  name: string;
  params: {
    system: string;
  };
  meta: {
    profile_image_url: string;
  };
}

interface ModelWithPrice {
  id: string;
  base_model_id: string;
  name: string;
  imageUrl: string;
  system_prompt: string;
  input_price: number;
  output_price: number;
  per_msg_price: number;
  updated_at: Date;
}

interface ModelResponse {
  data: {
    id: string;
    name: string;
    info: ModelInfo;
  }[];
}

export async function GET() {
  try {
    // Ensure database is initialized
    await ensureTablesExist();

    const domain = process.env.OPENWEBUI_DOMAIN;
    if (!domain) {
      throw new Error("OPENWEBUI_DOMAIN environment variable is not set.");
    }

    // Normalize API URL
    const apiUrl = domain.replace(/\/+$/, "") + "/api/models";

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENWEBUI_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("API response status:", response.status);
      console.error("API response text:", await response.text());
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    // Get response text for debugging
    const responseText = await response.text();
    // console.log("API response:", responseText);

    let data: ModelResponse;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      throw new Error("Invalid JSON response from API");
    }

    console.log("data:", data);

    if (!data || !Array.isArray(data.data)) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Unexpected API response structure");
    }

    // Get price information for all models
    const modelsWithPrices = await Promise.all(
      data.data.map(async (item) => {
        const priceInfo = await getOrCreateModelPrice(
          String(item.id),
          String(item.name),
          item.info.base_model_id
        );
        const model: ModelWithPrice = {
          id: priceInfo.id,
          base_model_id: item.info.base_model_id,
          name: priceInfo.name,
          imageUrl: item.info?.meta?.profile_image_url || "/static/favicon.png",
          system_prompt: item.info?.params?.system || "",
          input_price: priceInfo.input_price,
          output_price: priceInfo.output_price,
          per_msg_price: priceInfo.per_msg_price,
          updated_at: priceInfo.updated_at,
        };
        return model;
      })
    );

    // Filter out invalid models
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

// Add inlet endpoint
export async function POST(req: Request) {
  const data = await req.json();

  return new Response("Inlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}

// Add outlet endpoint
export async function PUT(req: Request) {
  const data = await req.json();
  // console.log("Outlet received:", JSON.stringify(data, null, 2));

  return new Response("Outlet placeholder response", {
    headers: { "Content-Type": "application/json" },
  });
}
