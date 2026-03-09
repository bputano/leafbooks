import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Track a referral click — called when someone visits a book page with ?ref=
export async function POST(request: NextRequest) {
  const { referralCode } = await request.json();
  if (!referralCode) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const referral = await db.referral.findUnique({
    where: { referralCode },
  });
  if (!referral) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  await db.referral.update({
    where: { id: referral.id },
    data: {
      clickCount: { increment: 1 },
      status: referral.status === "PENDING" ? "CLICKED" : referral.status,
    },
  });

  return NextResponse.json({ success: true });
}
