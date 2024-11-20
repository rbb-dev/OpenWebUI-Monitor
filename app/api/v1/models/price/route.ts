import { NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received price update request:", body);

    // 检查参数
    if (
      !body.id ||
      typeof body.inputPrice !== "number" ||
      typeof body.outputPrice !== "number"
    ) {
      console.error("Invalid input:", {
        id: body.id,
        inputPrice: body.inputPrice,
        outputPrice: body.outputPrice,
      });
      return NextResponse.json(
        {
          error: "Invalid input",
          details: {
            id: !body.id ? "Missing model ID" : undefined,
            inputPrice:
              typeof body.inputPrice !== "number"
                ? "Input price must be a number"
                : undefined,
            outputPrice:
              typeof body.outputPrice !== "number"
                ? "Output price must be a number"
                : undefined,
          },
        },
        { status: 400 }
      );
    }

    const updatedPrice = await updateModelPrice(
      body.id,
      body.inputPrice,
      body.outputPrice
    );

    if (!updatedPrice) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("Error updating model price:", error);
    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    );
  }
}
