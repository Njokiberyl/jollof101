/* JOLLOF 101 — shared interactions (no external libraries) */
(function () {
  "use strict";
  var STORE = "jollof101";
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {} }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---- Mobile nav toggle ---- */
  var toggle = $(".nav-toggle"), nav = $("#topnav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---- On small screens keep the section outline collapsed so the lesson comes first ---- */
  if (window.matchMedia && window.matchMedia("(max-width: 980px)").matches) {
    $$(".outline details").forEach(function (d) { d.removeAttribute("open"); });
  }

  /* ---- Page viewed tracking: a page counts as viewed only when the learner reaches its Next/Previous area ---- */
  var data = load(); data.viewed = data.viewed || {};
  var pageId = document.body.getAttribute("data-page");
  function renderOutline() {
    $$(".outline [data-status-for]").forEach(function (el) {
      var id = el.getAttribute("data-status-for");
      if (data.viewed[id]) { el.textContent = "✓ Viewed"; el.classList.add("viewed"); }
      else { el.textContent = "Not yet viewed"; el.classList.remove("viewed"); }
    });
    $$(".outline [data-count-for]").forEach(function (el) {
      var ids = el.getAttribute("data-count-for").split(",");
      var n = ids.filter(function (i) { return data.viewed[i]; }).length;
      el.textContent = n + " of " + ids.length + " pages viewed";
    });
  }
  renderOutline();
  var pager = $(".pager");
  if (pageId && pager && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !data.viewed[pageId]) {
          data.viewed[pageId] = 1; save(data); renderOutline(); io.disconnect();
        }
      });
    });
    io.observe(pager);
  }

  /* ---- Single-question checks (self-checks and scenario items) ---- */
  function fbHTML(ok, text) {
    return '<span class="verdict">' + (ok ? "✓ Correct" : "✗ Not quite — try again") + "</span><p>" + text + "</p>";
  }
  var groups = {};
  $$(".mcq").forEach(function (q) {
    var btn = $(".mcq-check", q), out = $(".feedback", q), grp = q.getAttribute("data-group");
    if (grp) { groups[grp] = groups[grp] || []; groups[grp].push(q); }
    btn.addEventListener("click", function () {
      var chosen = $("input:checked", q);
      $$(".option", q).forEach(function (o) { o.classList.remove("is-correct", "is-wrong"); });
      if (!chosen) { out.className = "feedback info"; out.innerHTML = "<p>Select an answer first, then choose <strong>Check my answer</strong>.</p>"; return; }
      var ok = chosen.hasAttribute("data-correct");
      chosen.closest(".option").classList.add(ok ? "is-correct" : "is-wrong");
      out.className = "feedback " + (ok ? "good" : "bad");
      out.innerHTML = fbHTML(ok, chosen.getAttribute("data-fb"));
      q.setAttribute("data-result", ok ? "1" : "0");
      if (grp) updateGroup(grp);
    });
  });
  function updateGroup(grp) {
    var qs = groups[grp], sum = $('[data-summary-for="' + grp + '"]');
    if (!sum) return;
    var done = qs.filter(function (q) { return q.hasAttribute("data-result"); });
    var right = qs.filter(function (q) { return q.getAttribute("data-result") === "1"; }).length;
    var need = parseInt(sum.getAttribute("data-need"), 10);
    if (done.length < qs.length) {
      sum.className = "feedback info";
      sum.innerHTML = "<p><strong>" + done.length + " of " + qs.length + " scenarios answered.</strong> Answer all three to see your readiness result.</p>";
      return;
    }
    var pass = right >= need;
    sum.className = "feedback " + (pass ? "good" : "bad");
    sum.innerHTML = '<span class="verdict">' + (pass ? "✓ Ready for the final performance" : "Not ready yet — review and retry") + "</span>" +
      '<p><strong>Your score: ' + right + " of " + qs.length + " correct.</strong> The target is at least " + need + " of " + qs.length + ".</p>" +
      (pass ? "<p>You chose sound corrective actions. Keep these responses in mind while you cook — you will use them in real time.</p>"
            : "<p>Reread <strong>3.7 Troubleshooting</strong> above, focusing on what you observe, what may have caused it, and the small correction that fits. Then change your answers and check them again.</p>");
  }

  /* ---- Section 1 classification activity ---- */
  var cls = $("#classify");
  if (cls) {
    $("#classify-check").addEventListener("click", function () {
      var items = $$("select[data-answer]", cls), right = 0, blank = 0;
      items.forEach(function (s) {
        var fb = s.closest("li").querySelector(".item-fb");
        if (!s.value) { blank++; fb.className = "item-fb"; fb.textContent = ""; return; }
        var ok = s.value === s.getAttribute("data-answer");
        if (ok) right++;
        fb.className = "item-fb " + (ok ? "good" : "bad");
        fb.innerHTML = (ok ? "<strong>✓ Correct.</strong> " : "<strong>✗ Not quite.</strong> ") + s.getAttribute("data-explain");
      });
      var out = $("#classify-result"), total = items.length, pct = Math.round(right / total * 100);
      if (blank) {
        out.className = "feedback info";
        out.innerHTML = "<p><strong>" + blank + " item" + (blank > 1 ? "s" : "") + " still need an answer.</strong> Feedback is shown for the ones you completed. Finish the rest, then check again.</p>";
        return;
      }
      var pass = pct >= 80;
      out.className = "feedback " + (pass ? "good" : "bad");
      out.innerHTML = '<div class="score"><span class="score-num">' + pct + '%</span><span><strong>' + right + " of " + total + " classified correctly.</strong><br>Target: at least 80% (" + Math.ceil(total * 0.8) + " of " + total + ").</span></div>" +
        (pass ? "<p>✓ <strong>Target met.</strong> You can tell staple foods, ingredients and completed dishes apart, and you can link dishes to the places they are associated with.</p>"
              : "<p><strong>Not yet at the target.</strong> Read the feedback under each item marked ✗. Ask yourself: Is this eaten regularly as the base of a meal (staple)? Is it one component used to build flavour, texture or nutrition (ingredient)? Is it a finished preparation (dish)? Then change those answers and check again.</p>");
      out.focus();
    });
    $("#classify-reset").addEventListener("click", function () {
      $$("select", cls).forEach(function (s) { s.value = ""; });
      $$(".item-fb", cls).forEach(function (f) { f.className = "item-fb"; f.textContent = ""; });
      var out = $("#classify-result"); out.className = "feedback"; out.innerHTML = "";
    });
  }

  /* ---- Section 2 comparison activity ---- */
  var cmp = $("#compare-form");
  if (cmp) {
    var stored = load().compare || {};
    $$("textarea, select", cmp).forEach(function (el) { if (stored[el.name]) el.value = stored[el.name]; });
    cmp.addEventListener("input", function () {
      var d = load(); d.compare = {};
      $$("textarea, select", cmp).forEach(function (el) { d.compare[el.name] = el.value; });
      save(d);
    });
    cmp.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#compare-error"), missing = [];
      $$("textarea", cmp).forEach(function (t) {
        var empty = t.value.trim().length < 3;
        t.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(t.getAttribute("data-label"));
      });
      if (missing.length) {
        err.innerHTML = "Please complete: " + missing.join(", ") + ".";
        $$("textarea", cmp).filter(function (t) { return t.getAttribute("aria-invalid") === "true"; })[0].focus();
        return;
      }
      err.textContent = "";
      var model = $("#compare-model");
      model.hidden = false;
      $$(".your-answer").forEach(function (slot) {
        var t = cmp.elements[slot.getAttribute("data-from")], c = cmp.elements[slot.getAttribute("data-from") + "-dim"];
        slot.textContent = t.value.trim() + (c && c.value ? "  (" + c.value + ")" : "");
      });
      model.focus();
    });
  }

  /* ---- Final performance checklist ---- */
  var cl = $("#prep-checklist");
  if (cl) {
    var boxes = $$("input[type=checkbox]", cl), st = load().checklist || {};
    function tally() {
      $$("[data-tally]").forEach(function (t) {
        var phase = t.getAttribute("data-tally"), bs = boxes.filter(function (b) { return b.getAttribute("data-phase") === phase; });
        var n = bs.filter(function (b) { return b.checked; }).length;
        t.textContent = n + " of " + bs.length + " checked";
      });
    }
    boxes.forEach(function (b) {
      if (st[b.id]) b.checked = true;
      b.addEventListener("change", function () { var d = load(); d.checklist = d.checklist || {}; d.checklist[b.id] = b.checked; save(d); tally(); });
    });
    tally();
    var pr = $("#print-checklist"); if (pr) pr.addEventListener("click", function () { window.print(); });
    var rs = $("#reset-checklist"); if (rs) rs.addEventListener("click", function () { boxes.forEach(function (b) { b.checked = false; }); var d = load(); d.checklist = {}; save(d); tally(); });
  }

  /* ---- Reflection: autosave + download ---- */
  var rf = $("#reflection-form");
  if (rf) {
    var rs2 = load().reflection || {};
    $$("textarea", rf).forEach(function (t) { if (rs2[t.name]) t.value = rs2[t.name]; });
    var status = $("#reflection-status");
    rf.addEventListener("input", function () {
      var d = load(); d.reflection = {};
      $$("textarea", rf).forEach(function (t) { d.reflection[t.name] = t.value; });
      save(d); if (status) status.textContent = "Saved in this browser.";
    });
    $("#reflection-download").addEventListener("click", function () {
      var lines = ["JOLLOF 101 — Reflection", ""];
      $$("textarea", rf).forEach(function (t) {
        lines.push(t.getAttribute("data-q")); lines.push(t.value.trim() || "(no response)"); lines.push("");
      });
      var blob = new Blob([lines.join("\r\n")], { type: "text/plain" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jollof101-reflection.txt";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }
})();
