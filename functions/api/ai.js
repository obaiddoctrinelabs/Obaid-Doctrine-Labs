// Cloudflare Pages Function: server-side AI without exposing credentials.
// Enable the Workers AI binding named AI in the Pages project before using this endpoint.
const MAX_TEXT = 12000;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get("Origin");
  const host = request.headers.get("Host");
  if (origin && host) {
    try { if (new URL(origin).host !== host) return new Response(JSON.stringify({ error: "Origin not allowed." }), { status: 403, headers: JSON_HEADERS }); }
    catch { return new Response(JSON.stringify({ error: "Invalid origin." }), { status: 403, headers: JSON_HEADERS }); }
  }
  if (!env.AI || typeof env.AI.run !== "function") {
    return new Response(JSON.stringify({ error: "AI is not enabled yet. In Cloudflare Pages, add a Workers AI binding named AI, then redeploy." }), { status: 503, headers: JSON_HEADERS });
  }
  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Please send valid JSON." }), { status: 400, headers: JSON_HEADERS });
  }
  const task = String(body.task || "");
  const text = String(body.text || "").trim();
  const question = String(body.question || "").trim();
  if (!["writing", "summary", "pdfqa"].includes(task)) return new Response(JSON.stringify({ error: "Unsupported task." }), { status: 400, headers: JSON_HEADERS });
  if (!text || text.length > MAX_TEXT) return new Response(JSON.stringify({ error: "Enter text between 1 and 12,000 characters." }), { status: 400, headers: JSON_HEADERS });
  if (task === "pdfqa" && !question) return new Response(JSON.stringify({ error: "Enter a question about the PDF." }), { status: 400, headers: JSON_HEADERS });
  const instructions = {
    writing: "Improve the user's draft for clarity, grammar and structure. Preserve their meaning; do not invent facts. If this is a brief, produce a useful draft and state assumptions briefly.",
    summary: "Summarize the supplied text faithfully. Give a concise summary and key points. Preserve important numbers and caveats; do not add unsupported claims.",
    pdfqa: "Answer the question using only the supplied PDF text. If the answer is not present, say so. Cite page labels such as Page 2 when available. Do not guess."
  };
  const prompt = task === "pdfqa"
    ? instructions[task] + "\nQuestion: " + question + "\nPDF text:\n" + text
    : instructions[task] + "\nUser text:\n" + text;
  try {
    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "You are a careful assistant inside Obaid Doctrine Labs. Be accurate, concise, and transparent about uncertainty." },
        { role: "user", content: prompt }
      ],
      max_tokens: 700
    });
    const output = result?.response || result?.output_text || "";
    if (!output) throw new Error("Empty model response");
    return new Response(JSON.stringify({ result: output }), { status: 200, headers: JSON_HEADERS });
  } catch {
    return new Response(JSON.stringify({ error: "The AI request failed or reached its free usage limit. Please try again later." }), { status: 502, headers: JSON_HEADERS });
  }
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ service: "Obaid Doctrine Labs AI", status: "POST only" }), { status: 405, headers: JSON_HEADERS });
}
