import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

async function renderAnnotations(page, cssViewport, pageEl) {
  const annotations = await page.getAnnotations({ intent: "display" });
  const linkAnnotations = annotations.filter(
    (item) => item.subtype === "Link" && (item.url || item.unsafeUrl)
  );

  if (linkAnnotations.length === 0) return;

  const annotationLayerEl = document.createElement("div");
  annotationLayerEl.className = "annotationLayer";

  for (const ann of linkAnnotations) {
    const url = ann.url || ann.unsafeUrl;
    if (!url || !Array.isArray(ann.rect) || ann.rect.length !== 4) continue;

    const [x1, y1, x2, y2] = cssViewport.convertToViewportRectangle(ann.rect);
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    const linkEl = document.createElement("a");
    linkEl.href = url;
    linkEl.style.position = "absolute";
    linkEl.style.left = `${left}px`;
    linkEl.style.top = `${top}px`;
    linkEl.style.width = `${width}px`;
    linkEl.style.height = `${height}px`;

    if (!url.startsWith("mailto:") && !url.startsWith("tel:")) {
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
    }

    annotationLayerEl.appendChild(linkEl);
  }

  pageEl.appendChild(annotationLayerEl);
}

export async function renderPdfInto(container, pdfUrl) {
  if (!container || !pdfUrl) return;

  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  container.innerHTML = "";

  const displayWidth = container.clientWidth || 968;
  const dpr = window.devicePixelRatio || 1;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = displayWidth / unscaledViewport.width;

    const cssViewport = page.getViewport({ scale });
    const renderViewport = page.getViewport({ scale: scale * dpr });

    const pageEl = document.createElement("div");
    pageEl.className = "cv-page";
    pageEl.style.width = `${cssViewport.width}px`;
    pageEl.style.height = `${cssViewport.height}px`;

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${cssViewport.width}px`;
    canvas.style.height = `${cssViewport.height}px`;

    const textLayerEl = document.createElement("div");
    textLayerEl.className = "textLayer";
    textLayerEl.style.setProperty("--scale-factor", String(scale));

    pageEl.appendChild(canvas);
    pageEl.appendChild(textLayerEl);
    container.appendChild(pageEl);

    await page.render({
      canvasContext: canvas.getContext("2d"),
      viewport: renderViewport,
    }).promise;

    const textContent = await page.getTextContent();
    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container: textLayerEl,
      viewport: cssViewport,
    });
    await textLayer.render();

    await renderAnnotations(page, cssViewport, pageEl);
  }
}

export function initPdfEmbeds(selector = "[data-pdf-src]") {
  const targets = Array.from(document.querySelectorAll(selector));
  if (targets.length === 0) return;

  const renderAll = () => {
    targets.forEach((el) => {
      const src = el.getAttribute("data-pdf-src");
      renderPdfInto(el, src);
    });
  };

  renderAll();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 150);
  });
}

// Automatically initialize any [data-pdf-src] elements on load
initPdfEmbeds();