import { NextResponse } from "next/server";
import { updateModelPrice } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { id, inputPrice, outputPrice } = await request.json();

    if (
      !id ||
      typeof inputPrice !== "number" ||
      typeof outputPrice !== "number"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updatedPrice = await updateModelPrice(id, inputPrice, outputPrice);
    return NextResponse.json(updatedPrice);
  } catch (error) {
    console.error("Error updating model price:", error);
    return NextResponse.json(
      { error: "Failed to update price" },
      { status: 500 }
    );
  }
}
