// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic content (products, categories) from Lovable Cloud at build time.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://arisstationaries.co.ke";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://ryiwclzfoctbgmkhgept.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5aXdjbHpmb2N0Ymdta2hnZXB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTAwNzgsImV4cCI6MjA3ODc4NjA3OH0.FBUxjetqC3Kp47XTCd4hkJI326kGdEDRiPME-Wh_7T0";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

const staticEntries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "daily", priority: "1.0" },
  { path: "/deals", lastmod: today, changefreq: "daily", priority: "0.9" },
  { path: "/testimonials", lastmod: today, changefreq: "weekly", priority: "0.8" },
  { path: "/students", lastmod: today, changefreq: "weekly", priority: "0.8" },
];

function buildXml(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const entries: SitemapEntry[] = [...staticEntries];

  // Categories
  try {
    const { data: categories } = await supabase
      .from("product_categories")
      .select("slug, is_active")
      .eq("is_active", true);
    (categories || []).forEach((c: any) => {
      if (c.slug) {
        entries.push({
          path: `/category/${c.slug}`,
          lastmod: today,
          changefreq: "weekly",
          priority: "0.85",
        });
      }
    });
  } catch (err) {
    console.warn("[sitemap] categories fetch failed:", err);
  }

  // Products (paginate to bypass 1000-row default)
  try {
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: products, error } = await supabase
        .from("products")
        .select("slug, id, updated_at")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const batch = products || [];
      batch.forEach((p: any) => {
        const slug = p.slug || p.id;
        entries.push({
          path: `/product/${slug}`,
          lastmod: p.updated_at ? p.updated_at.split("T")[0] : today,
          changefreq: "weekly",
          priority: "0.7",
        });
      });
      if (batch.length < pageSize) break;
      from += pageSize;
    }
  } catch (err) {
    console.warn("[sitemap] products fetch failed:", err);
  }

  writeFileSync(resolve("public/sitemap.xml"), buildXml(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main().catch((err) => {
  console.error("[sitemap] generation failed:", err);
  process.exit(0);
});
