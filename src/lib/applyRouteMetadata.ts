import { getRouteMetadata, siteMetadata, toAbsoluteSiteUrl } from "./siteMetadata";

function upsertMetaTag(attributeName: "name" | "property", attributeValue: string, content: string) {
    let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attributeName}="${attributeValue}"]`);
    if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
}

function upsertCanonicalLink(href: string) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }
    link.setAttribute("href", href);
}

export function applyRouteMetadata(path: string) {
    const metadata = getRouteMetadata(path);
    const canonicalUrl = toAbsoluteSiteUrl(metadata.path);

    document.title = metadata.title;
    document.documentElement.lang = "ja";

    upsertMetaTag("name", "description", metadata.description);
    upsertMetaTag("name", "robots", "index,follow");
    upsertMetaTag("property", "og:type", "website");
    upsertMetaTag("property", "og:site_name", siteMetadata.siteName);
    upsertMetaTag("property", "og:locale", siteMetadata.locale);
    upsertMetaTag("property", "og:title", metadata.title);
    upsertMetaTag("property", "og:description", metadata.description);
    upsertMetaTag("property", "og:url", canonicalUrl);
    upsertMetaTag("name", "twitter:card", siteMetadata.twitterCard);
    upsertMetaTag("name", "twitter:title", metadata.title);
    upsertMetaTag("name", "twitter:description", metadata.description);
    upsertCanonicalLink(canonicalUrl);
}