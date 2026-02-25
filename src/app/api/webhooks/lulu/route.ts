import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Lulu sends webhook notifications for print job status updates
export async function POST(req: NextRequest) {
  // Verify webhook authorization
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.LULU_WEBHOOK_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { id, status } = body;

    if (!id || !status?.name) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const luluOrderId = String(id);

    // Find orders with this Lulu order ID
    const orders = await db.order.findMany({
      where: { luluOrderId },
    });

    if (orders.length === 0) {
      // Not an order we're tracking — ignore
      return NextResponse.json({ received: true });
    }

    // Map Lulu status to our OrderStatus
    let orderStatus: "PENDING" | "PAID" | "FULFILLED" | "REFUNDED" | "FAILED" = "PAID";
    switch (status.name) {
      case "CREATED":
      case "UNPAID":
        orderStatus = "PENDING";
        break;
      case "PRODUCTION_READY":
      case "IN_PRODUCTION":
        orderStatus = "PAID"; // still processing
        break;
      case "SHIPPED":
        orderStatus = "FULFILLED";
        break;
      case "REJECTED":
      case "CANCELED":
        orderStatus = "FAILED";
        break;
      default:
        orderStatus = "PAID";
    }

    // Update all matching orders
    await db.order.updateMany({
      where: { luluOrderId },
      data: { status: orderStatus },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lulu webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
