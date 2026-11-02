import { Request, Response } from "express";

interface CachedImageInfo {
  imageUrl: string | null;
  description: string | null;
  cachedAt: number;
}

// In-memory cache for Wikipedia lookups
const imageMetadataCache: Map<string, CachedImageInfo> = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const USER_AGENT = "CognitorBot/1.0 (https://cognitor-uwnx.onrender.com; contact@cognitor.app)";

/**
 * Searches Wikipedia REST API for an entity's thumbnail image and summary description.
 */
export async function resolveWikipediaImage(entityName: string): Promise<{ imageUrl: string | null; description: string | null }> {
  const cleanName = entityName.replace(/\s*\([^)]*\)/g, "").trim(); // Remove parentheses like (Bruce Wayne)
  const cacheKey = cleanName.toLowerCase();

  const cached = imageMetadataCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { imageUrl: cached.imageUrl, description: cached.description };
  }

  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(summaryUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const imageUrl = data.thumbnail?.source || data.originalimage?.source || null;
      const description = data.description || null;

      imageMetadataCache.set(cacheKey, {
        imageUrl,
        description,
        cachedAt: Date.now()
      });

      return { imageUrl, description };
    }
  } catch (err) {
    // Graceful fallback on network/timeout
  }

  // Fallback: cache null so we don't spam Wikipedia on repeatedly missing entities
  imageMetadataCache.set(cacheKey, {
    imageUrl: null,
    description: null,
    cachedAt: Date.now()
  });

  return { imageUrl: null, description: null };
}

/**
 * Server-side proxy for external images (e.g. Wikimedia, Unsplash).
 * Bypasses anti-hotlinking, CORS blocks, and 403 Forbidden errors.
 */
export async function handleImageProxy(req: Request, res: Response): Promise<void> {
  const targetUrl = req.query.url as string;
  if (!targetUrl || !targetUrl.startsWith("http")) {
    res.status(400).send("Invalid image URL");
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream image fetch failed");
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // Cache for 7 days

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(502).send("Image proxy network error");
  }
}
