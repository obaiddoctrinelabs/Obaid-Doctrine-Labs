(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function message(text) { const el = $("toolMessage"); if (el) el.textContent = text; }
  function setupWorkspace(title, html) {
    $("workspaceTitle").textContent = title;
    $("workspaceBody").innerHTML = html;
    $("toolMessage").textContent = "";
    $("workspace").hidden = false;
    $("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const area = (label, id, placeholder) => '<label class="tool-label" for="' + id + '">' + label + '</label><textarea class="tool-input" id="' + id + '" rows="7" placeholder="' + placeholder + '"></textarea>';
  const btn = (id, label) => '<button class="button primary" id="' + id + '" type="button">' + label + '</button>';
  async function callAI(task, text, question, outputId, buttonId) {
    if (!text.trim()) { message("Please enter some text first."); return; }
    const button = $(buttonId); button.disabled = true; button.textContent = "Working…"; message("Sending text securely to the server-side AI service…");
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task, text, question }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI request failed.");
      $(outputId).hidden = false; $(outputId).textContent = data.result; message("AI result ready. Please review it for accuracy.");
    } catch (e) {
      message(e.message || "Could not reach the AI service.");
    } finally { button.disabled = false; button.textContent = task === "pdfqa" ? "Ask about this PDF" : task === "summary" ? "Summarize with AI" : "Improve with AI"; }
  }
  function openAI(name) {
    if (name === "summary") {
      setupWorkspace("AI Writing & Summary",
        '<p class="tool-help">Uses Cloudflare Workers AI when enabled. Avoid pasting confidential or sensitive information. AI results can be wrong; review before use.</p>' +
        area("Text to summarize or improve", "aiText", "Paste your text here") +
        '<div class="tool-actions">' + btn("aiSummarize", "Summarize with AI") + '<button class="button secondary" id="aiImprove" type="button">Improve with AI</button></div>' +
        '<div class="tool-output" id="aiResult" hidden></div>');
      $("aiSummarize").onclick = () => callAI("summary", $("aiText").value, "", "aiResult", "aiSummarize");
      $("aiImprove").onclick = () => callAI("writing", $("aiText").value, "", "aiResult", "aiImprove");
      return true;
    }
    if (name === "pdfqa") {
      setupWorkspace("PDF Research & AI Q&A",
        '<p class="tool-help">Choose a text-based PDF. Text is extracted in your browser and sent to the AI service only when you ask a question. Avoid confidential PDFs. Scanned image PDFs may not work.</p>' +
        '<label class="tool-label" for="aiPdfFile">Choose PDF (up to 12 MB)</label><input class="tool-input" id="aiPdfFile" type="file" accept="application/pdf">' +
        area("Question about the PDF", "aiPdfQuestion", "What are the main findings?") +
        btn("aiPdfAsk", "Ask about this PDF") + '<div class="tool-output" id="aiPdfResult" hidden></div>');
      let extracted = "";
      $("aiPdfFile").onchange = async () => {
        const file = $("aiPdfFile").files[0]; if (!file) return;
        if (file.size > 12 * 1024 * 1024) { message("Please choose a PDF smaller than 12 MB."); return; }
        message("Reading PDF text…");
        try {
          if (!window.pdfjsLib) await new Promise((resolve, reject) => {
            const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const doc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
          const pages = [];
          for (let i = 1; i <= Math.min(doc.numPages, 40); i++) {
            const page = await doc.getPage(i); const content = await page.getTextContent();
            pages.push("Page " + i + ": " + content.items.map(x => x.str).join(" "));
          }
          extracted = pages.join("\n").slice(0, 12000);
          message("PDF text extracted. Ask your question when ready.");
        } catch { message("Could not read the PDF. Try a text-based PDF and check your connection."); }
      };
      $("aiPdfAsk").onclick = () => callAI("pdfqa", extracted, $("aiPdfQuestion").value, "aiPdfResult", "aiPdfAsk");
      return true;
    }
    return false;
  }
  document.addEventListener("click", event => {
    const button = event.target.closest(".tool-open");
    if (!button || !["summary", "pdfqa"].includes(button.dataset.tool)) return;
    event.preventDefault(); event.stopImmediatePropagation(); openAI(button.dataset.tool);
  }, true);
})();