/* Kitbox — PDF Merge (pdf-lib 1.17.1). 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var list = document.getElementById("file-list");
  var status = document.getElementById("tool-status");
  var nameIn = document.getElementById("out-name");
  var runBtn = document.getElementById("run");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress.firstElementChild;

  var items = [];
  var busy = false;
  var dragIndex = -1;

  function render() {
    list.innerHTML = "";
    items.forEach(function (it, idx) {
      var row = K.el("li", { class: "file-row", draggable: "true", "data-index": String(idx) });
      var thumb = K.el("div", { class: "thumb" });
      thumb.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg>';
      row.appendChild(thumb);
      var meta = K.el("div", { class: "file-meta" });
      meta.appendChild(K.el("span", { class: "name", text: (idx + 1) + ". " + it.file.name }));
      meta.appendChild(K.el("span", {
        class: "sub",
        text: I.bytes(it.file.size) + (it.pages ? " · " + t("pdfPages", { n: I.num(it.pages) }) : "")
      }));
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
      rm.addEventListener("click", function () { items.splice(idx, 1); render(); });
      actions.appendChild(up); actions.appendChild(down); actions.appendChild(rm);
      row.appendChild(actions);

      row.addEventListener("dragstart", function (e) {
        dragIndex = idx;
        row.classList.add("dragging");
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      });
      row.addEventListener("dragend", function () { row.classList.remove("dragging"); dragIndex = -1; });
      row.addEventListener("dragover", function (e) { e.preventDefault(); });
      row.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (dragIndex > -1 && dragIndex !== idx) move(dragIndex, idx);
      });

      list.appendChild(row);
    });
    runBtn.disabled = items.length < 2 || busy;
    resetBtn.disabled = !items.length || busy;
  }

  function move(from, to) {
    if (to < 0 || to >= items.length) return;
    var it = items.splice(from, 1)[0];
    items.splice(to, 0, it);
    render();
    var rows = list.querySelectorAll(".file-row");
    if (rows[to]) {
      var btn = rows[to].querySelector("button");
      if (btn) btn.focus();
    }
    K.setStatus(status, (ar ? "الترتيب الجديد: " : "New order: ") + items.map(function (i) { return i.file.name; }).join(" · "));
  }

  function addFiles(files) {
    var dupes = 0;
    var jobs = [];
    files.forEach(function (f) {
      var isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if (!isPdf) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
      if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: I.bytes(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
      if (items.some(function (i) { return i.file.name === f.name && i.file.size === f.size; })) { dupes++; return; }
      var item = { file: f, pages: 0, bytes: null, broken: false };
      items.push(item);
      jobs.push(inspect(item));
    });
    if (dupes) K.toast(t("duplicateSkipped", { n: I.num(dupes) }), "warning");
    render();
    Promise.all(jobs).then(render);
  }

  function inspect(item) {
    return K.needLib("pdf-lib").then(function (PDFLib) {
      return item.file.arrayBuffer().then(function (buf) {
        item.bytes = new Uint8Array(buf);
        return PDFLib.PDFDocument.load(item.bytes, { ignoreEncryption: false });
      }).then(function (doc) {
        item.pages = doc.getPageCount();
      }).catch(function (err) {
        item.broken = true;
        var msg = String(err && err.message || "");
        var key = /encrypt/i.test(msg) ? "pdfEncrypted" : "pdfInvalid";
        K.toast(t(key, { name: item.file.name }), "error");
        var i = items.indexOf(item);
        if (i > -1) items.splice(i, 1);
      });
    }).catch(function () {
      K.setStatus(status, t("libraryFailed"), "error");
    });
  }

  async function run() {
    if (items.length < 2) { K.setStatus(status, t("needTwoPdfs"), "error"); return; }
    busy = true; runBtn.disabled = true; progress.hidden = false;
    K.shieldState("scanning");
    try {
      var PDFLib = await K.needLib("pdf-lib");
      var out = await PDFLib.PDFDocument.create();
      for (var i = 0; i < items.length; i++) {
        K.setStatus(status, t("processing", { i: I.num(i + 1), n: I.num(items.length) }));
        bar.style.width = Math.round((i / items.length) * 100) + "%";
        await K.nextFrame();
        var bytes = items[i].bytes || new Uint8Array(await items[i].file.arrayBuffer());
        var src = await PDFLib.PDFDocument.load(bytes);
        var pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(function (p) { out.addPage(p); });
      }
      var data = await out.save();
      var blob = new Blob([data], { type: "application/pdf" });
      var name = K.sanitizeName(nameIn.value || "kitbox-merged", "pdf");
      K.downloadBlob(blob, name);
      K.setStatus(status, t("merged") + " " + t("processedOnDevice") + " (" + I.bytes(blob.size) + ")", "success");
      K.shieldState("done");
    } catch (e) {
      K.setStatus(status, t("failed"), "error");
      K.shieldState("idle");
    }
    bar.style.width = "0%";
    progress.hidden = true;
    busy = false;
    render();
  }

  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", function () {
    items = [];
    render();
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  });

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles });
  render();
})();
