(() => {
  const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
    "September", "Oktober", "November", "Dezember"];
  const COLORS = {
    salbei: "#6f9676", terrakotta: "#c0694f", blau: "#4f73a8",
    lavendel: "#8a76bd", rose: "#c46a8a", graphit: "#3d3d3d"
  };

  const TYPES = {
    week: { label: "Wochenplaner", title: "Meine Woche", uses: ["start"] },
    meal: { label: "Essensplan + Einkaufsliste", title: "Essensplan", uses: ["start"] },
    clean: {
      label: "Putzplan", title: "Putzplan", uses: ["start", "items"],
      items: "Staubsaugen\nBad putzen\nKüche wischen\nMüll rausbringen\nWäsche waschen\nBetten beziehen\nFenster putzen\nPflanzen gießen"
    },
    habit: {
      label: "Habit-Tracker (Monat)", title: "Habit-Tracker", uses: ["month", "items"], landscape: true,
      items: "2 Liter Wasser\n10.000 Schritte\nLesen\nKein Handy nach 22 Uhr\nSport\nMeditation\nVor 23 Uhr schlafen\nObst & Gemüse"
    },
    todo: { label: "To-do-Liste", title: "To-do-Liste", uses: [] }
  };

  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  function nextMonday() {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const offset = (8 - d.getDay()) % 7 || 7;
    return d.getDay() === 1 ? d : addDays(d, offset);
  }

  // ---------- State (URL <-> Formular) ----------
  const now = new Date();
  const state = {
    type: "week", title: "", color: "salbei", start: iso(nextMonday()),
    month: now.getMonth(), year: now.getFullYear(), items: null
  };

  function readUrl() {
    const p = new URLSearchParams(location.search);
    if (TYPES[p.get("t")]) state.type = p.get("t");
    if (COLORS[p.get("c")]) state.color = p.get("c");
    if (p.has("title")) state.title = p.get("title").slice(0, 60);
    if (/^\d{4}-\d{2}-\d{2}$/.test(p.get("start"))) state.start = p.get("start");
    const m = parseInt(p.get("m"), 10), y = parseInt(p.get("y"), 10);
    if (m >= 0 && m <= 11) state.month = m;
    if (y >= 2000 && y <= 2100) state.year = y;
    if (p.has("items")) state.items = p.get("items").slice(0, 600);
  }

  function writeUrl() {
    const t = TYPES[state.type], p = new URLSearchParams({ t: state.type, c: state.color });
    if (state.title) p.set("title", state.title);
    if (t.uses.includes("start")) p.set("start", state.start);
    if (t.uses.includes("month")) { p.set("m", state.month); p.set("y", state.year); }
    if (t.uses.includes("items") && state.items !== null && state.items !== t.items) p.set("items", state.items);
    history.replaceState(null, "", "?" + p.toString());
  }

  const itemList = () => (state.items ?? TYPES[state.type].items ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 16);

  // ---------- Renderer ----------
  const lines = (n) => `<div class="lines">${"<i></i>".repeat(n)}</div>`;
  const checks = (n) => `<ul class="checks">${"<li></li>".repeat(n)}</ul>`;

  function header(title, sub) {
    return `<header class="sh-head"><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}</header>`;
  }

  function weekRange() {
    const s = new Date(state.start + "T00:00:00");
    return { s, label: `${fmt(s)} – ${fmt(addDays(s, 6))}${addDays(s, 6).getFullYear()}` };
  }

  const R = {
    week(title) {
      const { s, label } = weekRange();
      const days = DAYS.map((d, i) => `
        <section class="box"><h2>${d} <span>${fmt(addDays(s, i))}</span></h2>${lines(6)}</section>`).join("");
      return header(title, label) + `
        <div class="grid-week">${days}
          <section class="box accent"><h2>Top 3 der Woche</h2>${checks(3)}<h2 class="mt">Notizen</h2>${lines(2)}</section>
        </div>`;
    },
    meal(title) {
      const { s, label } = weekRange();
      const rows = DAYS.map((d, i) => `<tr><th>${DAYS_SHORT[i]}<small>${fmt(addDays(s, i))}</small></th>
        <td></td><td></td><td></td><td></td></tr>`).join("");
      const cats = ["Obst & Gemüse", "Kühlregal", "Vorrat & Backen", "Drogerie & Sonstiges"]
        .map((c) => `<section><h3>${c}</h3>${checks(7)}</section>`).join("");
      return header(title, label) + `
        <table class="tbl meal"><thead><tr><th></th><th>Frühstück</th><th>Mittag</th><th>Abend</th><th>Snack</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <h2 class="band">Einkaufsliste</h2><div class="grid-4">${cats}</div>`;
    },
    clean(title) {
      const { label } = weekRange();
      const items = itemList();
      const filler = Math.max(0, 14 - items.length);
      const row = (t) => `<tr><th>${esc(t)}</th>${"<td><b></b></td>".repeat(7)}</tr>`;
      return header(title, label) + `
        <table class="tbl clean"><thead><tr><th>Aufgabe</th>${DAYS_SHORT.map((d) => `<th>${d}</th>`).join("")}</tr></thead>
        <tbody>${items.map(row).join("")}${row("").repeat(filler)}</tbody></table>
        <div class="grid-2 mt">
          <section class="box"><h2>Monatlich</h2>${checks(5)}</section>
          <section class="box"><h2>Notizen</h2>${lines(5)}</section>
        </div>`;
    },
    habit(title) {
      const days = new Date(state.year, state.month + 1, 0).getDate();
      const items = itemList();
      const filler = Math.max(0, 10 - items.length);
      const wd = (d) => DAYS_SHORT[(new Date(state.year, state.month, d).getDay() + 6) % 7];
      const nums = Array.from({ length: days }, (_, i) => i + 1);
      const head = `<tr><th></th>${nums.map((d) => `<th class="${/Sa|So/.test(wd(d)) ? "we" : ""}"><small>${wd(d)}</small>${d}</th>`).join("")}</tr>`;
      const row = (t) => `<tr><th>${esc(t)}</th>${nums.map(() => "<td><b></b></td>").join("")}</tr>`;
      return header(title, `${MONTHS[state.month]} ${state.year}`) + `
        <table class="tbl habit d${days}"><thead>${head}</thead>
        <tbody>${items.map(row).join("")}${row("").repeat(filler)}</tbody></table>
        <div class="grid-3 mt">
          <section class="box"><h2>Ziel des Monats</h2>${lines(3)}</section>
          <section class="box"><h2>Was lief gut?</h2>${lines(3)}</section>
          <section class="box"><h2>Belohnung</h2>${lines(3)}</section>
        </div>`;
    },
    todo(title) {
      return header(title, "Datum: ______________") + `
        <section class="box accent"><h2>Die 3 wichtigsten Dinge</h2>${checks(3)}</section>
        <div class="grid-2 mt">
          <section class="box"><h2>Erledigen</h2>${checks(16)}</section>
          <section class="box"><h2>Anrufen / Schreiben</h2>${checks(7)}<h2 class="mt">Besorgen</h2>${checks(7)}</section>
        </div>
        <section class="box mt"><h2>Notizen</h2>${lines(4)}</section>`;
    }
  };

  // ---------- Render + Vorschau ----------
  function render() {
    const t = TYPES[state.type];
    const sheet = $("#sheet");
    sheet.className = "sheet" + (t.landscape ? " landscape" : "");
    sheet.style.setProperty("--accent", COLORS[state.color]);
    sheet.innerHTML = `<div class="sh-body">${R[state.type](state.title || t.title)}</div>
      <footer class="sh-foot">Kostenlos erstellt mit ${esc(SITE.name)} · ${esc(SITE.url)}</footer>`;
    $("#pagesize").textContent = `@page { size: A4 ${t.landscape ? "landscape" : "portrait"}; margin: 0; }`;
    document.querySelectorAll("[data-uses]").forEach((el) => {
      el.hidden = !t.uses.includes(el.dataset.uses);
    });
    writeUrl();
    fit();
  }

  function fit() {
    const wrap = $("#preview"), sheet = $("#sheet");
    const scale = Math.min(1, (wrap.clientWidth - 2) / sheet.offsetWidth);
    sheet.style.transform = `scale(${scale})`;
    wrap.style.height = sheet.offsetHeight * scale + "px";
  }

  // ---------- Formular ----------
  function initForm() {
    const type = $("#f-type");
    type.innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
    $("#f-month").innerHTML = MONTHS.map((m, i) => `<option value="${i}">${m}</option>`).join("");
    $("#f-colors").innerHTML = Object.entries(COLORS).map(([k, v]) =>
      `<button type="button" class="swatch" data-c="${k}" style="--c:${v}" aria-label="Farbe ${k}" title="${k}"></button>`).join("");

    const sync = () => {
      type.value = state.type;
      $("#f-title").value = state.title;
      $("#f-title").placeholder = TYPES[state.type].title;
      $("#f-start").value = state.start;
      $("#f-month").value = state.month;
      $("#f-year").value = state.year;
      $("#f-items").value = state.items ?? TYPES[state.type].items ?? "";
      document.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-pressed", b.dataset.c === state.color));
    };

    type.addEventListener("change", () => { state.type = type.value; state.title = ""; state.items = null; sync(); render(); });
    $("#f-title").addEventListener("input", (e) => { state.title = e.target.value.slice(0, 60); render(); });
    $("#f-start").addEventListener("change", (e) => { if (e.target.value) { state.start = e.target.value; render(); } });
    $("#f-month").addEventListener("change", (e) => { state.month = +e.target.value; render(); });
    $("#f-year").addEventListener("change", (e) => { state.year = +e.target.value || now.getFullYear(); render(); });
    $("#f-items").addEventListener("input", (e) => { state.items = e.target.value; render(); });
    $("#f-colors").addEventListener("click", (e) => {
      const b = e.target.closest(".swatch"); if (!b) return;
      state.color = b.dataset.c; sync(); render();
    });
    document.querySelectorAll("[data-pick]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); state.type = a.dataset.pick; state.title = ""; state.items = null;
      sync(); render(); $("#tool").scrollIntoView({ behavior: "smooth" });
    }));

    $("#btn-print").addEventListener("click", () => window.print());
    $("#btn-share").addEventListener("click", async () => {
      const url = location.href;
      try {
        if (navigator.share) await navigator.share({ title: "Mein Planer", url });
        else { await navigator.clipboard.writeText(url); flash("Link kopiert!"); }
      } catch { /* abgebrochen */ }
    });
    sync();
  }

  function flash(msg) {
    const el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(flash.t); flash.t = setTimeout(() => (el.hidden = true), 1800);
  }

  // ---------- Monetarisierung (aus config.js) ----------
  function initMoney() {
    if (SITE.kofi) document.querySelectorAll(".js-kofi").forEach((a) => { a.href = SITE.kofi; a.hidden = false; });
    if (SITE.premium) document.querySelectorAll(".js-premium").forEach((el) => {
      el.hidden = false; el.querySelectorAll("a").forEach((a) => (a.href = SITE.premium));
    });
    if (SITE.amazonTag && SITE.affiliate.length) {
      $("#aff-list").innerHTML = SITE.affiliate.map((a) =>
        `<li><a rel="sponsored noopener" target="_blank" href="https://www.amazon.de/s?k=${encodeURIComponent(a.q)}&tag=${encodeURIComponent(SITE.amazonTag)}">${esc(a.label)}*</a></li>`).join("");
      $("#affiliate").hidden = false;
    }
    document.querySelectorAll(".js-sitename").forEach((el) => (el.textContent = SITE.name));
  }

  readUrl();
  initForm();
  initMoney();
  render();
  addEventListener("resize", fit);
  // Für das PDF-Build-Skript
  window.__planner = { state, render, TYPES, COLORS };
})();
