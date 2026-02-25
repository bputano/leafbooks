import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateFile } from "@/lib/lulu/file-validator";
import { z } from "zod";

const validateSchema = z.object({
  fileUrl: z.string().url(),
  fileType: z.enum(["cover", "interior"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const result = await validateFile(parsed.data.fileUrl, parsed.data.fileType);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
