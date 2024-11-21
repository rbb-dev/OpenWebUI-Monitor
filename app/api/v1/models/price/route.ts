import { NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received price update request:", body);

    // 检查参数
    if (
      !body.id ||
      typeof body.input_price !== "number" ||
      typeof body.output_price !== "number"
    ) {
      console.error("Invalid input:", {
        id: body.id,
        input_price: body.input_price,
        output_price: body.output_price,
      });
      return NextResponse.json(
        {
          error: "Invalid input",
          details: {
            id: !body.id ? "Missing model ID" : undefined,
            input_price:
              typeof body.input_price !== "number"
                ? "Input price must be a number"
                : undefined,
            output_price:
              typeof body.output_price !== "number"
                ? "Output price must be a number"
                : undefined,
          },
        },
        { status: 400 }
      );
    }

    const updatedPrice = await updateModelPrice(
      body.id,
      body.input_price,
      body.output_price
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
