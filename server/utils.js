export function extractJson(text) {
  if (!text) return "";
  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  const fenced = text.match(/```\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) return fenced[1].trim();

  return text.trim();
}

export function safeParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

