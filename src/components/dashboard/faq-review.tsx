"use client";

import { useState } from "react";
import { Check, X, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FAQ {
  id: string;
  sectionId: string;
  question: string;
  answer: string;
  isApproved: boolean;
  isCustom: boolean;
  order: number;
}

interface SectionWithFaqs {
  id: string;
  heading: string;
  slug: string;
  order: number;
  faqs: FAQ[];
}

interface FAQReviewProps {
  bookId: string;
  initialSections: SectionWithFaqs[];
}

export function FAQReview({ bookId, initialSections }: FAQReviewProps) {
  const [sections, setSections] = useState(initialSections);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const totalFaqs = sections.reduce((sum, s) => sum + s.faqs.length, 0);
  const approvedCount = sections.reduce(
    (sum, s) => sum + s.faqs.filter((f) => f.isApproved).length,
    0
  );

  async function generateAll() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/books/${bookId}/generate-faqs`, {
        method: "POST",
      });
      if (res.ok) {
        await refreshFaqs();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function refreshFaqs() {
    const res = await fetch(`/api/books/${bookId}/faqs`);
    if (res.ok) {
      const data = await res.json();
      setSections(data.sections);
    }
  }

  async function toggleApproval(faqId: string, currentApproved: boolean) {
    const res = await fetch(`/api/books/${bookId}/faqs/${faqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !currentApproved }),
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          faqs: s.faqs.map((f) =>
            f.id === faqId ? { ...f, isApproved: !currentApproved } : f
          ),
        }))
      );
    }
  }

  async function approveAll() {
    const unapproved = sections.flatMap((s) =>
      s.faqs.filter((f) => !f.isApproved)
    );
    for (const faq of unapproved) {
      await fetch(`/api/books/${bookId}/faqs/${faq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });
    }
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        faqs: s.faqs.map((f) => ({ ...f, isApproved: true })),
      }))
    );
  }

  async function deleteFaq(faqId: string) {
    const res = await fetch(`/api/books/${bookId}/faqs/${faqId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          faqs: s.faqs.filter((f) => f.id !== faqId),
        }))
      );
    }
  }

  async function updateFaq(
    faqId: string,
    field: "question" | "answer",
    value: string
  ) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        faqs: s.faqs.map((f) =>
          f.id === faqId ? { ...f, [field]: value } : f
        ),
      }))
    );
  }

  async function saveFaq(faqId: string) {
    const faq = sections.flatMap((s) => s.faqs).find((f) => f.id === faqId);
    if (!faq) return;
    await fetch(`/api/books/${bookId}/faqs/${faqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: faq.question, answer: faq.answer }),
    });
  }

  async function addCustomFaq(sectionId: string) {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const res = await fetch(`/api/books/${bookId}/faqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        question: newQuestion,
        answer: newAnswer,
      }),
    });
    if (res.ok) {
      const { faq } = await res.json();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, faqs: [...s.faqs, faq] } : s
        )
      );
      setNewQuestion("");
      setNewAnswer("");
      setAddingToSection(null);
    }
  }

  async function regenerateForSection(sectionId: string) {
    setRegeneratingSection(sectionId);
    try {
      // Delete AI-generated FAQs for this section, then regenerate
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return;
      const aiGenerated = section.faqs.filter((f) => !f.isCustom);
      for (const faq of aiGenerated) {
        await fetch(`/api/books/${bookId}/faqs/${faq.id}`, {
          method: "DELETE",
        });
      }
      await fetch(`/api/books/${bookId}/generate-faqs`, { method: "POST" });
      await refreshFaqs();
    } finally {
      setRegeneratingSection(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {totalFaqs} FAQs total, {approvedCount} approved
          </p>
        </div>
        <div className="flex gap-2">
          {totalFaqs > 0 && (
            <Button variant="outline" size="sm" onClick={approveAll}>
              <Check className="mr-1 h-4 w-4" />
              Approve All
            </Button>
          )}
          <Button
            size="sm"
            onClick={generateAll}
            loading={generating}
          >
            {totalFaqs === 0 ? "Generate FAQs" : "Generate Missing FAQs"}
          </Button>
        </div>
      </div>

      {totalFaqs === 0 && !generating && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">
            FAQs help readers and search engines find your book. Click
            &quot;Generate FAQs&quot; to auto-generate questions and answers
            from your content — you can review and edit them before they go live.
          </p>
        </div>
      )}

      {/* FAQ list by section */}
      {sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">{section.heading}</h3>
            <div className="flex gap-1">
              <button
                onClick={() => regenerateForSection(section.id)}
                disabled={regeneratingSection === section.id}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Regenerate FAQs for this section"
              >
                <RefreshCw
                  className={`h-4 w-4 ${regeneratingSection === section.id ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() =>
                  setAddingToSection(
                    addingToSection === section.id ? null : section.id
                  )
                }
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Add custom FAQ"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {section.faqs.length === 0 && (
            <p className="text-sm text-gray-400 italic">No FAQs yet</p>
          )}

          {section.faqs.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-lg border p-4 ${
                faq.isApproved
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="space-y-2">
                <input
                  className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                  value={faq.question}
                  onChange={(e) =>
                    updateFaq(faq.id, "question", e.target.value)
                  }
                  onBlur={() => saveFaq(faq.id)}
                />
                <textarea
                  className="w-full resize-none bg-transparent text-sm text-gray-700 focus:outline-none"
                  value={faq.answer}
                  onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                  onBlur={() => saveFaq(faq.id)}
                  rows={2}
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => toggleApproval(faq.id, faq.isApproved)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    faq.isApproved
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {faq.isApproved ? (
                    <>
                      <Check className="h-3 w-3" /> Approved
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" /> Unapproved
                    </>
                  )}
                </button>
                {faq.isCustom && (
                  <span className="text-xs text-gray-400">Custom</span>
                )}
                <button
                  onClick={() => deleteFaq(faq.id)}
                  className="ml-auto text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add custom FAQ form */}
          {addingToSection === section.id && (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3">
              <Input
                label="Question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What is...?"
              />
              <Textarea
                label="Answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="The answer is..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addCustomFaq(section.id)}
                  disabled={!newQuestion.trim() || !newAnswer.trim()}
                >
                  Add FAQ
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddingToSection(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
