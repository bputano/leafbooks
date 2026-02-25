import satori from "satori";
import type { ReactNode } from "react";
import { createElement } from "react";
import { readFile } from "fs/promises";
import { join } from "path";

let fontData: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  // Try to load a system font, fall back to fetching Inter from Google Fonts
  try {
    const systemFontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
    const buf = await readFile(systemFontPath);
    fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    return fontData;
  } catch {
    // Fall back to fetching Inter from Google Fonts CDN
    const res = await fetch(
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff"
    );
    fontData = await res.arrayBuffer();
    return fontData;
  }
}

interface DefaultCoverOptions {
  title: string;
  authorName: string;
  width?: number;
  height?: number;
}

const COVER_COLORS = [
  { bg: "#1a365d", text: "#ffffff", accent: "#63b3ed" },
  { bg: "#22543d", text: "#ffffff", accent: "#68d391" },
  { bg: "#742a2a", text: "#ffffff", accent: "#fc8181" },
  { bg: "#44337a", text: "#ffffff", accent: "#b794f4" },
  { bg: "#234e52", text: "#ffffff", accent: "#4fd1c5" },
  { bg: "#7b341e", text: "#ffffff", accent: "#f6ad55" },
];

function getColorScheme(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
}

export async function generateDefaultCoverSvg({
  title,
  authorName,
  width = 600,
  height = 900,
}: DefaultCoverOptions): Promise<string> {
  const colors = getColorScheme(title);

  const element = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        padding: "60px 48px",
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "sans-serif",
      },
    },
    createElement("div", {
      style: {
        width: "60px",
        height: "4px",
        backgroundColor: colors.accent,
      },
    }),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          gap: "16px",
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: title.length > 30 ? "36px" : "48px",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          },
        },
        title
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          gap: "12px",
        },
      },
      createElement("div", {
        style: {
          width: "40px",
          height: "2px",
          backgroundColor: colors.accent,
        },
      }),
      createElement(
        "div",
        {
          style: {
            fontSize: "20px",
            fontWeight: 400,
            opacity: 0.9,
          },
        },
        authorName
      )
    )
  );

  const font = await getFont();
  const svg = await satori(element as ReactNode, {
    width,
    height,
    fonts: [
      {
        name: "sans-serif",
        data: font,
        weight: 400,
        style: "normal" as const,
      },
      {
        name: "sans-serif",
        data: font,
        weight: 700,
        style: "normal" as const,
      },
    ],
  });

  return svg;
}
