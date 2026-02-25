import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculatePrintCost } from "@/lib/lulu/cost-calculator";
import { z } from "zod";

const costEstimateSchema = z.object({
  trimSize: z.string(),
  bindingType: z.string(),
  paperType: z.string(),
  interiorColor: z.string(),
  pageCount: z.number().int().min(1),
  coverFinish: z.string().optional(),
  printQuality: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = costEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const estimate = await calculatePrintCost(parsed.data);
    return NextResponse.json(estimate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cost calculation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
