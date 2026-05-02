
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { routeMetadataList, siteMetadata, toAbsoluteSiteUrl } from "./src/lib/siteMetadata";

const buildTimestamp = String(Date.now());

/** Emit build-meta.json into dist/ so the app can poll for new versions. */
function buildMetaPlugin(): Plugin {
  return {
    name: "build-meta",
    writeBundle({ dir }) {
      const outDir = dir ?? resolve(__dirname, "dist");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        resolve(outDir, "build-meta.json"),
        JSON.stringify({ buildTime: buildTimestamp }) + "\n",
      );
    },
  };
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceTagContent(html: string, pattern: RegExp, replacement: string) {
  return html.replace(pattern, replacement);
}

function applyHtmlMetadata(html: string, routePath: string, googleSiteVerification?: string) {
  const metadata = routeMetadataList.find((route) => route.path === routePath) ?? routeMetadataList[0];
  const canonicalUrl = toAbsoluteSiteUrl(metadata.path);

  let nextHtml = html;
  nextHtml = replaceTagContent(nextHtml, /<html lang="[^"]*">/, `<html lang="ja">`);
  nextHtml = replaceTagContent(nextHtml, /<title>[^<]*<\/title>/, `<title>${escapeHtmlAttribute(metadata.title)}</title>`);
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtmlAttribute(metadata.description)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta name="robots" content="[^"]*"\s*\/>/,
    `<meta name="robots" content="index,follow" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${escapeHtmlAttribute(canonicalUrl)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeHtmlAttribute(metadata.title)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeHtmlAttribute(metadata.description)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${escapeHtmlAttribute(canonicalUrl)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapeHtmlAttribute(metadata.title)}" />`,
  );
  nextHtml = replaceTagContent(
    nextHtml,
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapeHtmlAttribute(metadata.description)}" />`,
  );

  const verificationMeta = googleSiteVerification?.trim()
    ? `  <meta name="google-site-verification" content="${escapeHtmlAttribute(googleSiteVerification.trim())}" />\n`
    : "";

  nextHtml = nextHtml.replace(/\s*<meta name="google-site-verification" content="[^"]*"\s*\/?>\n?/g, "\n");

  if (verificationMeta) {
    nextHtml = nextHtml.replace("</head>", `${verificationMeta}</head>`);
  }

  return nextHtml;
}

function buildSitemapXml() {
  const urls = routeMetadataList
    .map((route) => `  <url><loc>${toAbsoluteSiteUrl(route.path)}</loc></url>`)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join("\n");
}

function buildRobotsTxt() {
  return [`User-agent: *`, `Allow: /`, `Sitemap: ${siteMetadata.siteUrl}/sitemap.xml`, ``].join("\n");
}

function staticSeoArtifactsPlugin(googleSiteVerification?: string): Plugin {
  return {
    name: "static-seo-artifacts",
    writeBundle({ dir }) {
      const outDir = dir ?? resolve(__dirname, "dist");
      const indexHtmlPath = resolve(outDir, "index.html");
      const builtIndexHtml = readFileSync(indexHtmlPath, "utf8");
      const rootHtml = applyHtmlMetadata(builtIndexHtml, "/", googleSiteVerification);

      writeFileSync(indexHtmlPath, rootHtml);

      for (const route of routeMetadataList) {
        if (route.path === "/") continue;

        const routeDir = resolve(outDir, route.path.replace(/^\//, ""));
        mkdirSync(routeDir, { recursive: true });
        writeFileSync(resolve(routeDir, "index.html"), applyHtmlMetadata(rootHtml, route.path, googleSiteVerification));
      }

      writeFileSync(resolve(outDir, "sitemap.xml"), buildSitemapXml());
      writeFileSync(resolve(outDir, "robots.txt"), buildRobotsTxt());
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const googleSiteVerification =
    process.env.GOOGLE_SITE_VERIFICATION ??
    env.GOOGLE_SITE_VERIFICATION ??
    env.VITE_GOOGLE_SITE_VERIFICATION;

  return {
    plugins: [react(), buildMetaPlugin(), staticSeoArtifactsPlugin(googleSiteVerification)],
    base: "/unofficial-gbc-info-box/",
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    },
  };
});
