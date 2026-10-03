/* Kitbox — PDF Split (pdf-lib 1.17.1 + JSZip 3.10.1). 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var info = document.getElementById("file-info");
  var options = document.getElementById("split-options");
  var status = document.getElementById("tool-status");
  var modeRadios = document.querySelectorAll('input[name="split-mode"]');
  var rangeField = document.getElementById("range-field");
  var everyField = document.getElementById("every-field");
  var rangesIn = document.getElementById("ranges");
  var everyIn = document.getElementById("every-n");
  var runBtn = document.getElementById("run");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress.firstElementChild;

  var current = null; /* { file, bytes, pages } */
  var busy = false;

  function mode() {
    var m = "ranges";
    modeRadios.forEach(function (r) { if (r.checked) m = r.value; });
    return m;
  }

  function syncMode() {
    var m = mode();
    rangeField.hidden = m !== "ranges";
    everyField.hidden = m !== "every";
  }

  function renderInfo() {
    info.innerHTML = "";
    options.hidden = !current;
    runBtn.disabled = !current || busy;
    resetBtn.disabled = !current || busy;
    if (!current) return;
    var row = K.el("li", { class: "file-row" });
    var thumb = K.el("div", { class: "thumb" });
    thumb.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg>';
    row.appendChild(thumb);
    var meta = K.el("div", { class: "file-meta" });
    meta.appendChild(K.el("span", { class: "name", text: current.file.name }));
    meta.appendChild(K.el("span", { class: "sub", text: I.bytes(current.file.size) + " · " + t("pdfPages", { n: I.num(current.pages) }) }));
    row.appendChild(meta);
    var actions = K.el("div", { class: "row-actions" });
    var rm = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("removeFile"), title: t("removeFile") });
    rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    rm.addEventListener("click", reset);
    actions.appendChild(rm);
    row.appendChild(actions);
    info.appendChild(row);
    everyIn.max = String(Math.max(1, current.pages));
  }

  function addFiles(files) {
    var f = files[0];
    if (!f) return;
    var isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    if (!isPdf) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
    if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: I.bytes(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
    K.setStatus(status, t("working"));
    K.needLib("pdf-lib").then(function (PDFLib) {
      return f.arrayBuffer().then(function (buf) {
        var bytes = new Uint8Array(buf);
        return PDFLib.PDFDocument.load(bytes).then(function (doc) {
          current = { file: f, bytes: bytes, pages: doc.getPageCount() };
          renderInfo();
          K.setStatus(status, t("filesAdded", { n: I.num(1) }), "success");
        });
      });
    }).catch(function (err) {
      var msg = String(err && err.message || "");
      if (msg === "load-failed") K.setStatus(status, t("libraryFailed"), "error");
      else K.setStatus(status, t(/encrypt/i.test(msg) ? "pdfEncrypted" : "pdfInvalid", { name: f.name }), "error");
    });
  }

  /* "1-3,5,8-10" -> [[0,2],[4,4],[7,9]] (0-based inclusive). Throws on error. */
  function parseRanges(text, total) {
    var parts = text.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) throw { key: "enterRanges" };
    var out = [];
    var seen = {};
    parts.forEach(function (p) {
      var m = /^(\d+)$/.exec(p);
      var r = /^(\d+)\s*-\s*(\d+)$/.exec(p);
      var a, b;
      if (m) { a = b = parseInt(m[1], 10); }
      else if (r) { a = parseInt(r[1], 10); b = parseInt(r[2], 10); }
      else throw { key: "invalidRange", vars: { range: p } };
      if (a < 1 || b < 1 || a > b) throw { key: "invalidRange", vars: { range: p } };
      if (b > total) throw { key: "rangeOutOfBounds", vars: { page: I.num(b), total: I.num(total) } };
      var sig = a + "-" + b;
      if (seen[sig]) return;
      seen[sig] = true;
      out.push([a - 1, b - 1]);
    });
    if (!out.length) throw { key: "enterRanges" };
    return out;
  }

  function buildGroups() {
    var total = current.pages;
    var m = mode();
    if (m === "ranges") {
      return parseRanges(rangesIn.value, total).map(function (r) {
        var idx = [];
        for (var i = r[0]; i <= r[1]; i++) idx.push(i);
        return { indices: idx, label: (r[0] + 1) + (r[1] !== r[0] ? "-" + (r[1] + 1) : "") };
      });
    }
    if (m === "every") {
      var n = parseInt(everyIn.value, 10);
      if (!isFinite(n) || n < 1 || n > total) throw { key: "everyNInvalid", vars: { total: I.num(total) } };
      var groups = [];
      for (var s = 0; s < total; s += n) {
        var idx = [];
        for (var i = s; i < Math.min(s + n, total); i++) idx.push(i);
        groups.push({ indices: idx, label: (s + 1) + (idx.length > 1 ? "-" + (s + idx.length) : "") });
      }
      return groups;
    }
    var all = [];
    for (var p = 0; p < total; p++) all.push({ indices: [p], label: String(p + 1) });
    return all;
  }

  async function run() {
    if (!current) { K.setStatus(status, t("noFiles"), "error"); return; }
    var groups;
    try { groups = buildGroups(); }
    catch (e) { K.setStatus(status, t(e.key, e.vars), "error"); return; }

    busy = true; runBtn.disabled = true; progress.hidden = false;
    K.shieldState("scanning");
    try {
      var PDFLib = await K.needLib("pdf-lib");
      var src = await PDFLib.PDFDocument.load(current.bytes);
      var base = K.sanitizeName(current.file.name);
      var results = [];
      for (var g = 0; g < groups.length; g++) {
        K.setStatus(status, t("processing", { i: I.num(g + 1), n: I.num(groups.length) }));
        bar.style.width = Math.round((g / groups.length) * 100) + "%";
        await K.nextFrame();
        var doc = await PDFLib.PDFDocument.create();
        var pages = await doc.copyPages(src, groups[g].indices);
        pages.forEach(function (p) { doc.addPage(p); });
        var data = await doc.save();
        results.push({ name: base + "-pages-" + groups[g].label + ".pdf", blob: new Blob([data], { type: "application/pdf" }) });
      }
      if (results.length === 1) {
        K.downloadBlob(results[0].blob, results[0].name);
      } else {
        var JSZip = await K.needLib("jszip");
        var zip = new JSZip();
        results.forEach(function (r) { zip.file(r.name, r.blob); });
        var z = await zip.generateAsync({ type: "blob" });
        K.downloadBlob(z, base + "-split.zip");
      }
      K.setStatus(status, t("splitDone", { n: I.num(results.length) }) + " " + t("processedOnDevice"), "success");
      K.shieldState("done");
    } catch (e) {
      K.setStatus(status, String(e && e.message) === "load-failed" ? t("libraryFailed") : t("failed"), "error");
      K.shieldState("idle");
    }
    bar.style.width = "0%";
    progress.hidden = true;
    busy = false;
    runBtn.disabled = false;
  }

  function reset() {
    current = null;
    renderInfo();
    rangesIn.value = "";
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  }

  modeRadios.forEach(function (r) { r.addEventListener("change", syncMode); });
  syncMode();
  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", reset);
  rangesIn.setAttribute("placeholder", ar ? "مثال: 1-3,5,8-10" : "e.g. 1-3,5,8-10");

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles });
  renderInfo();
})();
