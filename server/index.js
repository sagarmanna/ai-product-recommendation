import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { PRODUCTS } from "./products.js";
import { extractJson, safeParseJson } from "./utils.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 5000;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY;

// Create client only if key exists (safer)
const client = API_KEY ? new OpenAI({ apiKey: API_KEY }) : null;

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/products", (req, res) => {
  res.json(PRODUCTS);
});

app.post("/api/recommend", async (req, res) => {
  try {
    const preference = String(req.body?.preference || "").trim();
    if (!preference) return res.status(400).json({ error: "preference is required" });

    // Key validation (NO hardcoding)
    if (!API_KEY || API_KEY.includes("PASTE_YOUR_KEY_HERE") || API_KEY.length < 20) {
      return res.status(401).json({
        error: "Missing/invalid OPENAI_API_KEY. Put a real key in server/.env and restart the server."
      });
    }

    const productSummary = PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      tags: p.tags
    }));

    const prompt = `
You are a product recommendation engine.

User preference: "${preference}"

Available products (choose ONLY from these; do NOT invent new items):
${JSON.stringify(productSummary, null, 2)}

Return STRICT JSON ONLY with this exact shape:
{
  "recommendedIds": string[],   // 1 to 5 IDs ONLY from the list above
  "reasoning": string           // 1-3 sentences
}

Rules:
- recommendedIds must contain ONLY valid IDs from the list.
- If nothing matches, recommendedIds must be [].
- Output JSON only. No markdown. No code fences.
`;

    const ai = await client.responses.create({
      model: MODEL,
      input: prompt
    });

    const raw = ai.output_text || "";
    const jsonText = extractJson(raw);
    const parsed = safeParseJson(jsonText);

    if (!parsed.ok) {
      return res.status(502).json({
        error: "AI returned invalid JSON",
        raw
      });
    }

    const ids = Array.isArray(parsed.value?.recommendedIds)
      ? parsed.value.recommendedIds.map(String)
      : [];

    const reasoning = typeof parsed.value?.reasoning === "string" ? parsed.value.reasoning : "";

    // Validate IDs (prevent hallucinations)
    const allowed = new Set(PRODUCTS.map((p) => p.id));
    const cleaned = ids.filter((id) => allowed.has(id)).slice(0, 5);

    const recommended = PRODUCTS.filter((p) => cleaned.includes(p.id));

    return res.json({ recommended, reasoning });
  } catch (e) {
    console.error("RECOMMEND ERROR:", e);

    const status = e?.status || 500;
    return res.status(status).json({
      error: e?.message || "Server error",
      details: e?.response?.data || null
    });
  }
});

app.listen(PORT, () => console.log(`✅ Server running http://localhost:${PORT}`));
