/* Kitbox — Image Converter (JPG / PNG / WebP). 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var list = document.getElementById("file-list");
  var preview = document.getElementById("preview-grid");
  var status = document.getElementById("tool-status");
  var formatSel = document.getElementById("out-format");
  var quality = document.getElementById("quality");
  var qualityOut = document.getElementById("quality-out");
  var qualityField = document.getElementById("quality-field");
  var bgField = document.getElementById("bg-field");
  var bgColor = document.getElementById("bg-color");
  var runBtn = document.getElementById("run");
  var zipBtn = document.getElementById("download-zip");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress.firstElementChild;
  var ACCEPT = ["image/jpeg", "image/png", "image/webp"];

  var items = [];
  var busy = false;

  function syncFormat() {
    var f = formatSel.value;
    qualityField.hidden = f === "image/png";
    bgField.hidden = f !== "image/jpeg";
  }

  function render() {
    list.innerHTML = "";
    preview.innerHTML = "";
    items.forEach(function (it, idx) {
      var row = K.el("li", { class: "file-row" });
      row.appendChild(K.el("img", { src: it.thumb, alt: "", width: "52", height: "52", loading: "lazy" }));
      var meta = K.el("div", { class: "file-meta" });
      meta.appendChild(K.el("span", { class: "name", text: it.file.name }));
      meta.appendChild(K.el("span", {
        class: "sub",
        text: it.outBlob
          ? it.file.type.replace("image/", "").toUpperCase() + " → " + it.outType.replace("image/", "").toUpperCase() + " · " + I.bytes(it.outBlob.size)
          : it.file.type.replace("image/", "").toUpperCase() + " · " + I.bytes(it.file.size)
      }));
      row.appendChild(meta);
      var actions = K.el("div", { class: "row-actions" });
      if (it.outBlob) {
        var dl = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("download") + ": " + it.file.name, title: t("download") });
        dl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>';
        dl.addEventListener("click", function () { K.downloadBlob(it.outBlob, it.outName); });
        actions.appendChild(dl);
      }
      var rm = K.el("button", { type: "button", class: "icon-btn", "aria-label": t("removeFile") + ": " + it.file.name, title: t("removeFile") });
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener("click", function () { removeAt(idx); });
      actions.appendChild(rm);
      row.appendChild(actions);
      list.appendChild(row);

      if (it.outURL) {
        var fig = K.el("figure");
        fig.appendChild(K.el("img", { src: it.outURL, alt: it.outName, loading: "lazy" }));
        fig.appendChild(K.el("figcaption", { text: it.outName }));
        preview.appendChild(fig);
      }
    });
    preview.hidden = !preview.children.length;
    runBtn.disabled = !items.length || busy;
    resetBtn.disabled = !items.length || busy;
    zipBtn.hidden = items.filter(function (i) { return i.outBlob; }).length < 2;
  }

  function removeAt(i) {
    var it = items[i];
    if (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    }
    items.splice(i, 1);
    render();
  }

  function addFiles(files) {
    var dupes = 0, added = 0;
    files.forEach(function (f) {
      if (ACCEPT.indexOf(f.type) === -1) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
      if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: I.bytes(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
      if (items.some(function (i) { return i.file.name === f.name && i.file.size === f.size; })) { dupes++; return; }
      items.push({ file: f, thumb: URL.createObjectURL(f), outBlob: null, outURL: null, outName: "", outType: "" });
      added++;
    });
    if (dupes) K.toast(t("duplicateSkipped", { n: I.num(dupes) }), "warning");
    if (added) K.setStatus(status, t("filesAdded", { n: I.num(added) }), "success");
    render();
  }

  async function run() {
    if (!items.length) { K.setStatus(status, t("noFiles"), "error"); return; }
    busy = true; runBtn.disabled = true; progress.hidden = false;
    K.shieldState("scanning");
    var type = formatSel.value;
    var q = parseInt(quality.value, 10) / 100;
    var ext = type === "image/jpeg" ? "jpg" : type.split("/")[1];

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      K.setStatus(status, t("processing", { i: I.num(i + 1), n: I.num(items.length) }));
      bar.style.width = Math.round((i / items.length) * 100) + "%";
      await K.nextFrame();
      try {
        var bmp = await K.decodeImage(it.file);
        var canvas = K.makeCanvas(bmp.width, bmp.height);
        var ctx = canvas.getContext("2d");
        if (type === "image/jpeg") {
          ctx.fillStyle = bgColor.value || "#FFFFFF";
          ctx.fillRect(0, 0, bmp.width, bmp.height);
        }
        ctx.drawImage(bmp, 0, 0);
        if (bmp.close) bmp.close();
        var blob = await K.canvasToBlob(canvas, type, type === "image/png" ? undefined : q);
        if (it.outURL) { try { URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ } }
        it.outBlob = blob;
        it.outURL = URL.createObjectURL(blob);
        it.outType = type;
        it.outName = K.sanitizeName(it.file.name) + "." + ext;
      } catch (e) {
        K.toast(t("readError", { name: it.file.name }), "error");
      }
    }
    bar.style.width = "0%";
    progress.hidden = true;
    busy = false;
    render();
    K.setStatus(status, t("convertedCount", { n: I.num(items.filter(function (x) { return x.outBlob; }).length) }) + " " + t("processedOnDevice"), "success");
    K.shieldState("done");
  }

  formatSel.addEventListener("change", syncFormat);
  syncFormat();
  quality.addEventListener("input", function () { qualityOut.textContent = I.num(quality.value) + "%"; });
  qualityOut.textContent = I.num(quality.value) + "%";
  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", function () {
    items.forEach(function (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    });
    items = [];
    render();
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  });
  zipBtn.addEventListener("click", function () {
    var done = items.filter(function (i) { return i.outBlob; });
    if (!done.length) return;
    zipBtn.disabled = true;
    K.needLib("jszip").then(function (JSZip) {
      var zip = new JSZip();
      done.forEach(function (it) { zip.file(it.outName, it.outBlob); });
      return zip.generateAsync({ type: "blob" });
    }).then(function (b) { K.downloadBlob(b, "kitbox-converted-images.zip"); zipBtn.disabled = false; })
      .catch(function () { K.setStatus(status, t("libraryFailed"), "error"); zipBtn.disabled = false; });
  });

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles, paste: true });
  render();
})();
