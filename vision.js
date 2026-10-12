/* Benue Arise for Hon — Vision & Mission page
   Requires config.js to define window.ARISE_CONFIG and Supabase's public
   publishable key. Load this file with:
   <script type="module" src="vision.js"></script>
*/

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG = window.ARISE_CONFIG || {};

const SUPABASE_URL = CONFIG.SUPABASE_URL || "";
const SUPABASE_KEY = CONFIG.SUPABASE_PUBLISHABLE_KEY || "";

const MOVEMENT_NAME = "Benue Arise for Hon";
const CANDIDATE_NAME = "Prof. Sebastine Tartenger Hon, SAN";
const CANDIDATE_ROLE = "SDP Governorship Candidate, Benue State 2027";
const SLOGAN = "RESCUE | REBUILD | RESTORE";

const SELECTORS = {
  vision: "#vision-content",
  mission: "#mission-content",
  status: "#vision-status",
  download: "#download-vision-pdf"
};

/* Safely escape text before inserting it into HTML. */
const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

/* Display page status messages. */
function setStatus(message, kind = "info") {
  let element = document.querySelector(SELECTORS.status);

  if (!element) {
    element = document.createElement("p");
    element.id = "vision-status";
    element.className = "vision-status";
    element.setAttribute("role", "status");

    const anchor =
      document.querySelector(SELECTORS.vision) ||
      document.querySelector(SELECTORS.mission) ||
      document.querySelector("main");

    anchor?.prepend(element);
  }

  element.textContent = message;
  element.dataset.state = kind;
}

/* Render the statements returned by Supabase. */
function setStatement(container, rows, emptyMessage) {
  if (!container) return;

  if (!rows.length) {
    container.innerHTML =
      `<p class="statement-empty">${escapeHTML(emptyMessage)}</p>`;
    return;
  }

  container.innerHTML = rows.map((row, index) => {
    const title = escapeHTML(
      row.title ||
      (row.section_type === "vision" ? "Our Vision" : "Our Mission")
    );

    const content = escapeHTML(row.content_text || "")
      .replace(/\r?\n/g, "<br>");

    return `
      <article class="statement-entry">
        <span class="statement-number">
          ${String(index + 1).padStart(2, "0")}
        </span>

        <div class="statement-entry-copy">
          <h3>${title}</h3>
          <p>
            ${content ||
              "Content will be published here after it has been approved."}
          </p>
        </div>
      </article>
    `;
  }).join("");
}

/* Show a fallback if the database cannot be reached. */
function fallbackStatement(container, title, message) {
  if (!container) return;

  container.innerHTML = `
    <article class="statement-entry">
      <span class="statement-number">—</span>

      <div class="statement-entry-copy">
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(message)}</p>
      </div>
    </article>
  `;
}

/* Load published vision and mission content from Supabase. */
async function loadStatements() {
  const visionContainer = document.querySelector(SELECTORS.vision);
  const missionContainer = document.querySelector(SELECTORS.mission);

  if (!visionContainer && !missionContainer) return;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const message =
      "Vision and mission content is temporarily unavailable. Please check back later.";

    fallbackStatement(visionContainer, "Our Vision", message);
    fallbackStatement(missionContainer, "Our Mission", message);

    setStatus(
      "The website database configuration is missing. Check config.js.",
      "error"
    );

    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: {
      schema: "arise_site"
    },

    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  setStatus("Loading approved vision and mission statements…");

  const { data, error } = await supabase
    .from("vision_mission_content")
    .select(
      "id, section_type, title, content_text, display_order, created_at"
    )
    .eq("published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Unable to load vision/mission content:",
      error
    );

    const message =
      "Approved statements could not be loaded right now. Please try again later.";

    fallbackStatement(visionContainer, "Our Vision", message);
    fallbackStatement(missionContainer, "Our Mission", message);

    setStatus(
      "Could not load the published statements. Please refresh the page later.",
      "error"
    );

    return;
  }

  const rows = Array.isArray(data) ? data : [];

  const visions = rows.filter(
    (row) => row.section_type === "vision"
  );

  const missions = rows.filter(
    (row) => row.section_type === "mission"
  );

  setStatement(
    visionContainer,
    visions,
    "Our vision statement will appear here once approved content is published."
  );

  setStatement(
    missionContainer,
    missions,
    "Our mission statement will appear here once approved content is published."
  );

  if (!rows.length) {
    setStatus(
      "No approved vision or mission statements have been published yet.",
      "info"
    );
  } else {
    setStatus(
      "Published vision and mission statements loaded.",
      "success"
    );
  }
}

/* Convert rendered HTML content into readable text for PDF export. */
function getPlainText(element) {
  if (!element) return "";

  return (element.innerText || element.textContent || "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* Create a safe filename. */
function pdfSafeFilename(value) {
  return value.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") ||
    "benue-arise-vision-mission";
}

/* Generate and download the Vision & Mission PDF. */
async function downloadPDF() {
  const button = document.querySelector(SELECTORS.download);
  const vision = document.querySelector(SELECTORS.vision);
  const mission = document.querySelector(SELECTORS.mission);

  if (!vision && !mission) {
    setStatus(
      "The vision and mission sections were not found on this page.",
      "error"
    );
    return;
  }

  const visionText = getPlainText(vision);
  const missionText = getPlainText(mission);

  if (!visionText && !missionText) {
    setStatus(
      "There is no published content to export yet.",
      "info"
    );
    return;
  }

  const originalLabel = button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent = "Preparing PDF…";
  }

  try {
    const { jsPDF } = await import(
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm"
    );

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 18;
    const usableWidth = pageWidth - margin * 2;

    let y = 20;

    /* Add text while handling page breaks. */
    const addWrappedText = (
      text,
      fontSize = 11,
      lineHeight = 6
    ) => {
      if (!text) return;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);

      const lines = pdf.splitTextToSize(
        text,
        usableWidth
      );

      for (const line of lines) {
        if (y > pageHeight - 20) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(line, margin, y);
        y += lineHeight;
      }

      y += 3;
    };

    /* Campaign letterhead. */
    pdf.setFillColor(39, 20, 63);
    pdf.rect(0, 0, pageWidth, 44, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);

    pdf.text(
      MOVEMENT_NAME.toUpperCase(),
      margin,
      17
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    pdf.text(SLOGAN, margin, 25);

    pdf.setFontSize(10);
    pdf.text("VISION & MISSION", margin, 35);

    /* Vision section. */
    y = 56;

    pdf.setTextColor(39, 20, 63);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);

    pdf.text("Our Vision", margin, y);

    y += 8;

    pdf.setTextColor(45, 45, 45);

    addWrappedText(
      visionText || "No published vision statement.",
      11,
      6
    );

    /* Mission section. */
    if (y > pageHeight - 45) {
      pdf.addPage();
      y = 22;
    }

    pdf.setTextColor(39, 20, 63);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);

    pdf.text("Our Mission", margin, y);

    y += 8;

    pdf.setTextColor(45, 45, 45);

    addWrappedText(
      missionText || "No published mission statement.",
      11,
      6
    );

    /* Candidate identification at the end. */
    if (y > pageHeight - 32) {
      pdf.addPage();
      y = 22;
    }

    y += 3;

    pdf.setDrawColor(122, 78, 158);

    pdf.line(
      margin,
      y,
      pageWidth - margin,
      y
    );

    y += 7;

    pdf.setTextColor(39, 20, 63);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    pdf.text(CANDIDATE_NAME, margin, y);

    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(CANDIDATE_ROLE, margin, y);

    /* Add footer and page numbers to every page. */
    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);

      pdf.setTextColor(110, 110, 110);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      pdf.text(
        `${MOVEMENT_NAME} · ${SLOGAN}`,
        margin,
        pageHeight - 8
      );

      pdf.text(
        `Page ${page} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }

    pdf.save(
      `${pdfSafeFilename(MOVEMENT_NAME)}-vision-mission.pdf`
    );

    setStatus(
      "Your vision and mission PDF has been prepared.",
      "success"
    );

  } catch (error) {
    console.error("PDF export failed:", error);

    setStatus(
      "PDF export failed. Check your connection and try again.",
      "error"
    );

  } finally {
    if (button) {
      button.disabled = false;

      button.textContent =
        originalLabel ||
        "Download Vision & Mission PDF";
    }
  }
}

/* Connect the PDF button to its action. */
function wirePDFButton() {
  const button = document.querySelector(SELECTORS.download);

  if (!button) return;

  button.addEventListener("click", downloadPDF);
}

/* Automatically update any copyright year placeholders. */
function updateYear() {
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(
      new Date().getFullYear()
    );
  });
}

/* Initialize the page. */
updateYear();
wirePDFButton();
loadStatements();
