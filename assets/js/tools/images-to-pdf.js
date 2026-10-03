/* Kitbox — Images to PDF (pdf-lib 1.17.1). 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var list = document.getElementById("file-list");
  var preview = document.getElementById("preview-grid");
  var status = document.getElementById("tool-status");
  var pageSize = document.getElementById("page-size");
  var orientation = document.getElementById("orientation");
  var orientationField = document.getElementById("orientation-field");
  var margin = document.getElementById("margin");
  var marginOut = document.getElementById("margin-out");
  var nameIn = document.getElementById("out-name");
  var runBtn = document.getElementById("run");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress.firstElementChild;
  var ACCEPT = ["image/jpeg", "image/png"];

  var SIZES = { a4: [595.28, 841.89], letter: [612, 792] };
  var items = [];
  var busy = false;
  var dragIndex = -1;

  function render() {
    list.innerHTML = "";
    preview.innerHTML = "";
    items.forEach(function (it, idx) {
      var row = K.el("li", { class: "file-row", draggable: "true" });
      row.appendChild(K.el("img", { src: it.thumb, alt: "", width: "52", height: "52", loading: "lazy" }));
      var meta = K.el("div", { class: "file-meta" });
      meta.appendChild(K.el("span", { class: "name", text: (idx + 1) + ". " + it.file.name }));
      meta.appendChild(K.el("span", { class: "sub", text: I.bytes(it.file.size) }));
      row.appendChild(meta);
      var actions = K.el("div", { class: "row-actions" });
      var up = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("moveUp") + ": " + it.file.name, title: t("moveUp") });
      up.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>';
      up.disabled = idx === 0;
      up.addEventListener("click", function () { move(idx, idx - 1); });
      var down = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("moveDown") + ": " + it.file.name, title: t("moveDown") });
      down.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14m0 0 6-6m-6 6-6-6"/></svg>';
      down.disabled = idx === items.length - 1;
      down.addEventListener("click", function () { move(idx, idx + 1); });
      var rm = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("removeFile") + ": " + it.file.name, title: t("removeFile") });
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener("click", function () {
        try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
        items.splice(idx, 1); render();
      });
      actions.appendChild(up); actions.appendChild(down); actions.appendChild(rm);
      row.appendChild(actions);

      row.addEventListener("dragstart", function () { dragIndex = idx; row.classList.add("dragging"); });
      row.addEventListener("dragend", function () { row.classList.remove("dragging"); dragIndex = -1; });
      row.addEventListener("dragover", function (e) { e.preventDefault(); });
      row.addEventListener("drop", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (dragIndex > -1 && dragIndex !== idx) move(dragIndex, idx);
      });

      list.appendChild(row);

      var fig = K.el("figure");
      fig.appendChild(K.el("img", { src: it.thumb, alt: (ar ? "معاينة الصفحة " : "Page preview ") + (idx + 1), loading: "lazy" }));
      fig.appendChild(K.el("figcaption", { text: (ar ? "صفحة " : "Page ") + I.num(idx + 1) }));
      preview.appendChild(fig);
    });
    preview.hidden = !items.length;
    runBtn.disabled = !items.length || busy;
    resetBtn.disabled = !items.length || busy;
  }

  function move(from, to) {
    if (to < 0 || to >= items.length) return;
    var it = items.splice(from, 1)[0];
    items.splice(to, 0, it);
    render();
    var rows = list.querySelectorAll(".file-row");
    if (rows[to]) { var b = rows[to].querySelector("button"); if (b) b.focus(); }
  }

  function addFiles(files) {
    var dupes = 0, added = 0;
    files.forEach(function (f) {
      if (ACCEPT.indexOf(f.type) === -1) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
      if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: I.bytes(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
      if (items.some(function (i) { return i.file.name === f.name && i.file.size === f.size; })) { dupes++; return; }
      items.push({ file: f, thumb: URL.createObjectURL(f) });
      added++;
    });
    if (dupes) K.toast(t("duplicateSkipped", { n: I.num(dupes) }), "warning");
    if (added) K.setStatus(status, t("filesAdded", { n: I.num(added) }), "success");
    render();
  }

  async function run() {
    if (!items.length) { K.setStatus(status, t("needImages"), "error"); return; }
    busy = true; runBtn.disabled = true; progress.hidden = false;
    K.shieldState("scanning");
    try {
      var PDFLib = await K.needLib("pdf-lib");
      var doc = await PDFLib.PDFDocument.create();
      var m = parseInt(margin.value, 10) || 0;
      var sizeKey = pageSize.value;

      for (var i = 0; i < items.length; i++) {
        K.setStatus(status, t("processing", { i: I.num(i + 1), n: I.num(items.length) }));
        bar.style.width = Math.round((i / items.length) * 100) + "%";
        await K.nextFrame();
        var f = items[i].file;
        var buf = new Uint8Array(await f.arrayBuffer());
        var img = f.type === "image/png" ? await doc.embedPng(buf) : await doc.embedJpg(buf);
        var pw, ph;
        if (sizeKey === "fit") {
          pw = img.width + m * 2;
          ph = img.height + m * 2;
        } else {
          var base = SIZES[sizeKey] || SIZES.a4;
          pw = base[0]; ph = base[1];
          if (orientation.value === "landscape") { var tmp = pw; pw = ph; ph = tmp; }
        }
        var page = doc.addPage([pw, ph]);
        var availW = Math.max(1, pw - m * 2);
        var availH = Math.max(1, ph - m * 2);
        var scale = Math.min(availW / img.width, availH / img.height);
        var dw = img.width * scale;
        var dh = img.height * scale;
        page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }

      var data = await doc.save();
      var blob = new Blob([data], { type: "application/pdf" });
      K.downloadBlob(blob, K.sanitizeName(nameIn.value || "kitbox-images", "pdf"));
      K.setStatus(status, t("pdfCreated", { n: I.num(items.length) }) + " " + t("processedOnDevice"), "success");
      K.shieldState("done");
    } catch (e) {
      K.setStatus(status, String(e && e.message) === "load-failed" ? t("libraryFailed") : t("failed"), "error");
      K.shieldState("idle");
    }
    bar.style.width = "0%";
    progress.hidden = true;
    busy = false;
    render();
  }

  pageSize.addEventListener("change", function () { orientationField.hidden = pageSize.value === "fit"; });
  orientationField.hidden = pageSize.value === "fit";
  margin.addEventListener("input", function () { marginOut.textContent = I.num(margin.value) + " pt"; });
  marginOut.textContent = I.num(margin.value) + " pt";
  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", function () {
    items.forEach(function (it) { try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ } });
    items = [];
    render();
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  });

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles, paste: true });
  render();
})();
