import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildBookContext } from "@/lib/reader/book-context";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const chatSchema = z.object({
  bookId: z.string(),
  message: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.errors[0].message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { bookId, message, history } = parsed.data;

  // Build context from book sections
  const { sections, bookTitle } = await buildBookContext(bookId, message);

  if (!bookTitle) {
    return new Response(JSON.stringify({ error: "Book not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contextText = sections
    .map((s) => `## ${s.heading}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant that answers questions about the book "${bookTitle}".
Use ONLY the book's content provided below to answer questions. If the answer isn't in the provided content, say so.
When referencing specific content, mention which section/chapter it comes from.
Keep answers concise and helpful.

Book content:
${contextText}`;

  // Build messages from history + new message
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-10), // Keep last 10 messages for context
    { role: "user", content: message },
  ];

  // Stream the response
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  // Return as a streaming response
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
