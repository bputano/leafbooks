import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Serif — Direct Sales for Authors",
  description:
    "Sell your books directly to readers. Own your audience. Keep more of what you earn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
