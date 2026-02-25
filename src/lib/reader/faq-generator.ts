import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeneratedFAQ {
  question: string;
  answer: string;
}

/**
 * Generate FAQs for all sections of a book that don't already have FAQs.
 */
export async function generateFaqsForBook(bookId: string): Promise<number> {
  const sections = await db.bookSection.findMany({
    where: { bookId },
    include: { faqs: true },
    orderBy: { order: "asc" },
  });

  let totalGenerated = 0;

  for (const section of sections) {
    // Skip sections that already have AI-generated FAQs
    if (section.faqs.some((f) => !f.isCustom)) continue;
    // Skip very short sections
    if (section.wordCount < 100) continue;

    const faqs = await generateFaqsForSection(
      section.heading,
      section.textContent
    );

    for (let i = 0; i < faqs.length; i++) {
      await db.sectionFAQ.create({
        data: {
          sectionId: section.id,
          question: faqs[i].question,
          answer: faqs[i].answer,
          isApproved: false,
          isCustom: false,
          order: i,
        },
      });
    }

    totalGenerated += faqs.length;
  }

  return totalGenerated;
}

/**
 * Generate FAQs for a single section.
 */
export async function generateFaqsForSection(
  heading: string,
  textContent: string
): Promise<GeneratedFAQ[]> {
  const truncated = textContent.slice(0, 10000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `Based on this book section titled "${heading}", generate 3-5 FAQs that would help readers and search engines understand the content.

Section content:
${truncated}

Requirements:
- Questions should be natural things a reader might search for
- Answers should be 1-3 sentences, drawn from the section content
- Focus on key concepts, takeaways, and actionable insights
- Avoid trivial or overly specific questions

Return a JSON array:
[{"question": "...", "answer": "..."}]

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    return JSON.parse(jsonMatch[0]) as GeneratedFAQ[];
  } catch {
    return [];
  }
}

/**
 * Regenerate FAQs for a specific section (deletes existing AI-generated ones).
 */
export async function regenerateFaqsForSection(
  sectionId: string
): Promise<number> {
  const section = await db.bookSection.findUnique({
    where: { id: sectionId },
  });
  if (!section) throw new Error("Section not found");

  // Delete existing AI-generated FAQs for this section
  await db.sectionFAQ.deleteMany({
    where: { sectionId, isCustom: false },
  });

  const faqs = await generateFaqsForSection(
    section.heading,
    section.textContent
  );

  for (let i = 0; i < faqs.length; i++) {
    await db.sectionFAQ.create({
      data: {
        sectionId,
        question: faqs[i].question,
        answer: faqs[i].answer,
        isApproved: false,
        isCustom: false,
        order: i,
      },
    });
  }

  return faqs.length;
}
