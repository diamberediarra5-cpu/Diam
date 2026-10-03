import { NextResponse } from "next/server";
import { AppError, logError } from "@/lib/errors";
import { handleStripeEvent, verifyWebhook } from "@/services/billing/stripe";

export async function POST(request: Request) {
  // Cuerpo crudo: imprescindible para verificar la firma.
  const body = await request.text();
  let event;
  try {
    event = verifyWebhook(body, request.headers.get("stripe-signature"));
  } catch (error) {
    const status = error instanceof AppError && error.code === "UNAVAILABLE" ? 503 : 400;
    return NextResponse.json({ error: "invalid" }, { status });
  }
  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json({ received: true, result });
  } catch (error) {
    logError("stripe-webhook", error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
