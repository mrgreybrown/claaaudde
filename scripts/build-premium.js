// Erzeugt das Premium-Paket (alle Vorlagen in allen Farben + 12 Habit-Tracker) als ZIP.
// Nutzung: npx http-server -p 8765 -s .   und dann   node scripts/build-premium.js [Jahr]
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

const BASE = "http://localhost:8765/";
const YEAR = +process.argv[2] || new Date().getFullYear() + 1;
const OUT = path.join(__dirname, "..", "dist", `Planerwerk-Premium-${YEAR}`);
const COLORS = ["salbei", "terrakotta", "blau", "lavendel", "rose", "graphit"];
const MONTHS = ["01-Januar", "02-Februar", "03-Maerz", "04-April", "05-Mai", "06-Juni", "07-Juli",
  "08-August", "09-September", "10-Oktober", "11-November", "12-Dezember"];

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  const jobs = [];
  for (const c of COLORS) {
    for (const t of ["week", "meal", "clean", "todo"]) jobs.push([`Vorlagen/${c}/${t}.pdf`, `?t=${t}&c=${c}`]);
    MONTHS.forEach((m, i) => jobs.push([`Habit-Tracker-${YEAR}/${c}/${m}.pdf`, `?t=habit&c=${c}&m=${i}&y=${YEAR}`]));
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, query] of jobs) {
    await page.goto(BASE + query);
    // Datumsfreie Blätter, damit sie jede Woche wiederverwendbar sind
    await page.evaluate(() => {
      document.querySelectorAll(".sh-head p").forEach((p) => {
        if (/\d{2}\.\d{2}\. –/.test(p.textContent)) p.textContent = "Woche: ______________";
      });
      document.querySelectorAll(".sheet h2 span, .meal th small").forEach((s) => s.remove());
      document.querySelector(".sh-foot").textContent = "Planerwerk Premium · Danke für deine Unterstützung!";
    });
    const dest = path.join(OUT, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await page.pdf({ path: dest, preferCSSPageSize: true, printBackground: true });
  }
  await browser.close();
  const zip = OUT + ".zip";
  fs.rmSync(zip, { force: true });
  execFileSync("python3", ["-m", "zipfile", "-c", zip, OUT]);
  console.log(`${jobs.length} PDFs -> ${zip}`);
})();
