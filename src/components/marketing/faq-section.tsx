"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How much does Canopy cost?",
    answer:
      "Canopy is free to start — you pay nothing until you make a sale. On the Free plan, Canopy takes a 15% royalty fee on each sale, plus print and transaction costs. As you grow, a subscription plan reduces the royalty fee so you keep more of every sale. See our pricing page for details.",
  },
  {
    question: "Can I still sell on Amazon if I use Canopy?",
    answer:
      "Absolutely. Canopy lets you opt into wide distribution through Lulu's global network, which includes Amazon, bookstores, and libraries. The difference is that Canopy makes direct sales your primary, highest-margin channel — with Amazon and bookstores as complements, not the other way around.",
  },
  {
    question: "What formats can I sell on Canopy?",
    answer:
      "Hardcover, paperback, ebook, and the Canopy Reader edition — a web-based reading experience unique to Canopy. You can also bundle book formats with bonus materials like workbooks, courses, templates, and coaching packages to increase your revenue per reader.",
  },
  {
    question: "Do I need technical skills to use Canopy?",
    answer:
      "Not at all. Upload your manuscript and Canopy generates a polished book page with cover art, description, pricing, and purchase options. No web design, coding, or technical setup required.",
  },
  {
    question: "Do I own my customer data?",
    answer:
      "Yes — completely. Every purchase gives you the buyer's name, email, and purchase history. Unlike Amazon or IngramSpark, you own the customer relationship and can follow up, build loyalty, and turn one-time buyers into lifelong readers.",
  },
  {
    question: "How does print-on-demand work?",
    answer:
      "When a reader orders a physical book, it's printed and shipped on demand through Lulu's global network. There's no inventory to manage, no upfront printing costs, and no minimum orders. You set your price, and books are produced as they're sold.",
  },
  {
    question: "What is the Canopy Reader?",
    answer:
      "The Canopy Reader is a beautiful, web-based reading experience. Every chapter has its own URL, is indexed by search engines and AI answer engines, and supports highlights, notes, and social sharing. It turns your book into a discovery engine — readers can share specific passages, driving new audiences to your work.",
  },
  {
    question: "How do I get paid?",
    answer:
      "Payouts are handled through Stripe Connect, deposited directly to your bank account. You can see exactly what you've earned, from which channels, in your Canopy dashboard.",
  },
  {
    question: "What makes Canopy different from Amazon KDP or IngramSpark?",
    answer:
      "Amazon and IngramSpark are distribution platforms — they help you place a book in a catalog. Canopy is a growth platform. You get direct sales with full customer data, built-in email marketing, referral and affiliate programs, SEO-indexed content, and cross-author promotion. Authors earn ~$3 on a $16.99 Amazon sale vs. $7-8+ selling direct through Canopy.",
  },
  {
    question: "Can I use Canopy if I'm already published elsewhere?",
    answer:
      "Yes. Upload your existing manuscript and start selling direct right away. Canopy works alongside your other channels — you don't have to choose one or the other.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-ink/[0.08]">
      {faqs.map((faq, index) => (
        <div key={index}>
          <button
            onClick={() =>
              setOpenIndex(openIndex === index ? null : index)
            }
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="pr-4 font-serif text-base font-semibold text-ink">
              {faq.question}
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              openIndex === index
                ? "max-h-96 pb-5 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-sm leading-relaxed text-ink-light">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
