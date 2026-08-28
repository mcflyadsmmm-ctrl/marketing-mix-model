/**
 * MDS Made Easy — course chrome + interactives (static, no backend).
 * Draft: pages use noindex; robots Disallow until go-live.
 */
(function () {
  const MODULES = [
    { id: "hub", href: "/mds-made-easy/", label: "Course hub" },
    { id: "total-roas", href: "/mds-made-easy/total-roas", label: "1 · Total ROAS" },
    { id: "break-even", href: "/mds-made-easy/break-even", label: "2 · Break-even" },
    { id: "import-export", href: "/mds-made-easy/import-export", label: "3 · Import & export" },
    { id: "monday-ritual", href: "/mds-made-easy/monday-ritual", label: "4 · Monday ritual" },
    { id: "ai-prompts", href: "/mds-made-easy/ai-prompts", label: "5 · AI prompts" },
    { id: "glossary", href: "/mds-made-easy/glossary", label: "6 · Glossary lab" },
    { id: "suites-and-custom", href: "/mds-made-easy/suites-and-custom", label: "7 · Suites & Custom" },
  ];

  const STORAGE_KEY = "mcfly_mds_progress_v1";

  function progress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function saveProgress(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function currentId() {
    const path = (location.pathname.replace(/\/$/, "") || "/").toLowerCase();
    if (path === "/mds-made-easy" || path.endsWith("/mds-made-easy/index.html"))
      return "hub";
    const hit = MODULES.find((m) => path.endsWith(m.id) || path.includes("/" + m.id));
    return hit ? hit.id : "hub";
  }

  function injectChrome() {
    const body = document.body;
    if (!body.classList.contains("mds-course")) return;

    const banner = document.createElement("div");
    banner.className = "mds-draft-banner";
    banner.innerHTML =
      "<strong>DRAFT — not public.</strong> Hidden from nav, sitemap, and crawlers until you say <strong>MDS Made Easy go live</strong>.";
    body.prepend(banner);

    const mount = document.querySelector("[data-mds-shell]");
    if (!mount) return;

    const id = currentId();
    const done = progress();
    const nav = document.createElement("nav");
    nav.className = "mds-nav";
    nav.setAttribute("aria-label", "Course modules");
    nav.innerHTML =
      '<a class="mds-brand" href="/mds-made-easy/">MDS Made Easy</a>' +
      '<p class="mds-price">$79 course · timeless till desk</p><ol></ol>';
    const ol = nav.querySelector("ol");
    MODULES.forEach((m) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = m.href;
      a.textContent = m.label;
      if (m.id === id) a.classList.add("is-active");
      if (done[m.id]) a.classList.add("done");
      li.appendChild(a);
      ol.appendChild(li);
    });

    const main = document.createElement("div");
    main.className = "mds-main";
    while (mount.firstChild) main.appendChild(mount.firstChild);

    const shell = document.createElement("div");
    shell.className = "mds-shell";
    shell.appendChild(nav);
    shell.appendChild(main);
    mount.appendChild(shell);

    const mark = main.querySelector("[data-mds-mark]");
    if (mark && id !== "hub") {
      const wrap = document.createElement("div");
      wrap.className = "mds-mark-done";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = done[id] ? "Marked complete ✓" : "Mark module complete";
      btn.addEventListener("click", () => {
        const p = progress();
        p[id] = true;
        saveProgress(p);
        btn.textContent = "Marked complete ✓";
        const link = nav.querySelector('a[href="' + MODULES.find((x) => x.id === id).href + '"]');
        if (link) link.classList.add("done");
      });
      wrap.appendChild(btn);
      mark.appendChild(wrap);
    }
  }

  function wireRoasLab() {
    const root = document.querySelector("[data-mds-roas-lab]");
    if (!root) return;
    const sales = root.querySelector('[name="sales"]');
    const spend = root.querySelector('[name="spend"]');
    const out = root.querySelector("[data-mds-out]");
    const hint = root.querySelector("[data-mds-hint]");
    function run() {
      const s = Number(sales.value);
      const p = Number(spend.value);
      if (!Number.isFinite(s) || !Number.isFinite(p) || p <= 0) {
        out.textContent = "Enter sales and spend (spend > 0).";
        hint.textContent = "";
        return;
      }
      const roas = s / p;
      out.textContent = "Total ROAS = " + roas.toFixed(2) + "×";
      hint.textContent =
        "Same calendar window for both numbers. Platform ROAS is a different claim.";
      hint.classList.toggle("warn", false);
    }
    sales.addEventListener("input", run);
    spend.addEventListener("input", run);
    run();
  }

  function wireBeLab() {
    const root = document.querySelector("[data-mds-be-lab]");
    if (!root) return;
    const margin = root.querySelector('[name="margin"]');
    const label = root.querySelector("[data-mds-margin-label]");
    const out = root.querySelector("[data-mds-out]");
    const compare = root.querySelector('[name="live"]');
    function run() {
      const m = Number(margin.value) / 100;
      label.textContent = margin.value + "%";
      if (!m || m <= 0 || m >= 1) {
        out.textContent = "Margin must be between 1% and 99%.";
        return;
      }
      const be = 1 / m;
      let msg = "Break-even Total ROAS ≈ " + be.toFixed(2) + "×";
      const live = Number(compare.value);
      if (Number.isFinite(live) && live > 0) {
        msg +=
          live >= be
            ? " · Your " + live.toFixed(2) + "× clears the floor (on average)."
            : " · Your " + live.toFixed(2) + "× is below break-even.";
      }
      out.textContent = msg;
    }
    margin.addEventListener("input", run);
    compare.addEventListener("input", run);
    run();
  }

  function wireAlignLab() {
    const root = document.querySelector("[data-mds-align-lab]");
    if (!root) return;
    const salesStart = root.querySelector('[name="salesStart"]');
    const salesEnd = root.querySelector('[name="salesEnd"]');
    const spendStart = root.querySelector('[name="spendStart"]');
    const spendEnd = root.querySelector('[name="spendEnd"]');
    const out = root.querySelector("[data-mds-out]");
    function run() {
      const ok =
        salesStart.value &&
        salesEnd.value &&
        spendStart.value === salesStart.value &&
        spendEnd.value === salesEnd.value;
      if (!salesStart.value || !salesEnd.value || !spendStart.value || !spendEnd.value) {
        out.textContent = "Enter all four dates (YYYY-MM-DD).";
        out.classList.remove("warn");
        return;
      }
      if (ok) {
        out.textContent = "Aligned — safe to compute Total ROAS for this window.";
        out.classList.remove("warn");
      } else {
        out.textContent =
          "Misaligned windows. Fix dates before trusting any ratio or AI answer.";
        out.classList.add("warn");
      }
    }
    [salesStart, salesEnd, spendStart, spendEnd].forEach((el) =>
      el.addEventListener("change", run),
    );
    run();
  }

  function wireCards() {
    document.querySelectorAll("[data-mds-card]").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("is-open"));
    });
  }

  function wirePrompts() {
    document.querySelectorAll("[data-mds-prompt]").forEach((block) => {
      const btn = block.querySelector("button");
      const pre = block.querySelector("pre");
      if (!btn || !pre) return;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent || "");
          btn.textContent = "Copied";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 1600);
        } catch {
          btn.textContent = "Select text";
        }
      });
    });
  }

  function wireQuiz() {
    const root = document.querySelector("[data-mds-refuse-quiz]");
    if (!root) return;
    const scoreEl = root.querySelector("[data-mds-score]");
    let score = 0;
    let answered = 0;
    root.querySelectorAll("[data-mds-q]").forEach((q) => {
      q.querySelectorAll("button").forEach((b) => {
        b.addEventListener("click", () => {
          if (q.dataset.done) return;
          q.dataset.done = "1";
          answered += 1;
          const correct = b.dataset.ok === "1";
          if (correct) score += 1;
          b.style.borderColor = correct ? "var(--truth)" : "var(--lie)";
          scoreEl.textContent = score + " / " + answered + " correct";
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectChrome();
    wireRoasLab();
    wireBeLab();
    wireAlignLab();
    wireCards();
    wirePrompts();
    wireQuiz();
  });
})();
