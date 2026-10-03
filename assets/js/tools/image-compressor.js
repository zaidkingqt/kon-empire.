/* Kitbox — Image Compressor. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;

  var zone = document.getElementById("dropzone");
  var input = document.getElementById("file-input");
  var list = document.getElementById("file-list");
  var status = document.getElementById("tool-status");
  var quality = document.getElementById("quality");
  var qualityOut = document.getElementById("quality-out");
  var maxWidth = document.getElementById("max-width");
  var runBtn = document.getElementById("run");
  var zipBtn = document.getElementById("download-zip");
  var resetBtn = document.getElementById("reset");
  var progress = document.getElementById("progress");
  var bar = progress ? progress.firstElementChild : null;
  var summary = document.getElementById("summary");
  var compareWrap = document.getElementById("compare-wrap");
  var ACCEPT = ["image/jpeg", "image/png", "image/webp"];

  var items = [];
  var busy = false;
  var cancelled = false;

  function fmt(n) { return I.bytes(n); }

  function render() {
    list.innerHTML = "";
    items.forEach(function (it, idx) {
      var row = K.el("li", { class: "file-row" });
      var img = K.el("img", { src: it.thumb, alt: "", width: "52", height: "52", loading: "lazy" });
      var meta = K.el("div", { class: "file-meta" });
      meta.appendChild(K.el("span", { class: "name", text: it.file.name }));
      var sub = K.el("span", { class: "sub" });
      if (it.outBlob) {
        var pct = (1 - it.outBlob.size / it.file.size) * 100;
        sub.innerHTML = "";
        sub.appendChild(document.createTextNode(fmt(it.file.size) + " → " + fmt(it.outBlob.size) + " "));
        var tag = K.el("strong", { class: "saved" });
        tag.textContent = pct > 0.5 ? t("savedPercent", { p: I.percent(pct) }) : t("biggerResult");
        sub.appendChild(tag);
      } else {
        sub.textContent = fmt(it.file.size) + " · " + it.file.type.replace("image/", "").toUpperCase();
      }
      meta.appendChild(sub);
      var actions = K.el("div", { class: "row-actions" });
      if (it.outBlob) {
        var dl = K.el("button", { type: "button", class: "icon-btn", title: t("download"), "aria-label": t("download") + ": " + it.file.name });
        dl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>';
        dl.addEventListener("click", function () { K.downloadBlob(it.outBlob, it.outName); });
        actions.appendChild(dl);
      }
      var rm = K.el("button", { type: "button", class: "icon-btn", title: t("removeFile"), "aria-label": t("removeFile") + ": " + it.file.name });
      rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      rm.addEventListener("click", function () { removeAt(idx); });
      actions.appendChild(rm);
      row.appendChild(img); row.appendChild(meta); row.appendChild(actions);
      list.appendChild(row);
    });
    runBtn.disabled = !items.length || busy;
    resetBtn.disabled = !items.length || busy;
    var done = items.filter(function (i) { return i.outBlob; });
    zipBtn.hidden = done.length < 2;
    updateSummary(done);
  }

  function updateSummary(done) {
    if (!done.length) { summary.hidden = true; summary.innerHTML = ""; compareWrap.hidden = true; compareWrap.innerHTML = ""; return; }
    var before = done.reduce(function (s, i) { return s + i.file.size; }, 0);
    var after = done.reduce(function (s, i) { return s + i.outBlob.size; }, 0);
    var pct = before ? (1 - after / before) * 100 : 0;
    summary.hidden = false;
    summary.innerHTML = "";
    [[fmt(before), I.lang() === "ar" ? "الحجم الأصلي" : "Original size"],
     [fmt(after), I.lang() === "ar" ? "الحجم الجديد" : "New size"],
     [I.percent(Math.max(0, pct)) + "%", I.lang() === "ar" ? "نسبة التوفير" : "Saved"]].forEach(function (p) {
      var li = K.el("li", { class: "stat" });
      li.appendChild(K.el("span", { class: "v", text: p[0] }));
      li.appendChild(K.el("span", { class: "k", text: p[1] }));
      summary.appendChild(li);
    });
    buildCompare(done[0]);
  }

  function buildCompare(it) {
    compareWrap.hidden = false;
    compareWrap.innerHTML = "";
    var h3 = K.el("h3", { text: I.lang() === "ar" ? "مقارنة قبل / بعد" : "Before / after comparison" });
    var box = K.el("div", { class: "compare" });
    var beforeImg = K.el("img", { src: it.thumbFull, alt: t("original") + ": " + it.file.name });
    var afterDiv = K.el("div", { class: "after" });
    var afterImg = K.el("img", { src: it.outURL, alt: t("result") + ": " + it.file.name });
    afterDiv.appendChild(afterImg);
    box.appendChild(beforeImg); box.appendChild(afterDiv);
    var range = K.el("input", { type: "range", min: "0", max: "100", value: "50", "aria-label": I.lang() === "ar" ? "موضع المقارنة" : "Comparison position" });
    function sync() {
      afterDiv.style.width = range.value + "%";
      var w = box.clientWidth;
      afterImg.style.width = w + "px";
    }
    range.addEventListener("input", sync);
    window.addEventListener("resize", sync);
    beforeImg.addEventListener("load", sync);
    compareWrap.appendChild(h3);
    compareWrap.appendChild(box);
    compareWrap.appendChild(range);
    sync();
  }

  function removeAt(i) {
    var it = items[i];
    if (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    }
    items.splice(i, 1);
    render();
    K.setStatus(status, items.length ? "" : t("cleared"));
  }

  function addFiles(files) {
    var added = 0, dupes = 0;
    files.forEach(function (f) {
      if (ACCEPT.indexOf(f.type) === -1) { K.toast(t("unsupported", { name: f.name }), "warning"); return; }
      if (f.size > K.CONFIG.MAX_FILE_BYTES) { K.toast(t("tooLarge", { name: f.name, limit: fmt(K.CONFIG.MAX_FILE_BYTES) }), "warning"); return; }
      var dup = items.some(function (i) { return i.file.name === f.name && i.file.size === f.size; });
      if (dup) { dupes++; return; }
      var url = URL.createObjectURL(f);
      items.push({ file: f, thumb: url, thumbFull: url, outBlob: null, outURL: null, outName: "" });
      added++;
    });
    if (dupes) K.toast(t("duplicateSkipped", { n: I.num(dupes) }), "warning");
    if (added) K.setStatus(status, t("filesAdded", { n: I.num(added) }), "success");
    render();
  }

  function targetType(file) {
    return file.type === "image/png" ? "image/png" : (file.type === "image/webp" ? "image/webp" : "image/jpeg");
  }

  async function run() {
    if (!items.length) { K.setStatus(status, t("noFiles"), "error"); return; }
    busy = true; cancelled = false;
    runBtn.disabled = true;
    progress.hidden = false;
    K.shieldState("scanning");
    var q = parseInt(quality.value, 10) / 100;
    var mw = parseInt(maxWidth.value, 10);
    if (!isFinite(mw) || mw <= 0) mw = 0;

    for (var i = 0; i < items.length; i++) {
      if (cancelled) break;
      var it = items[i];
      K.setStatus(status, t("processing", { i: I.num(i + 1), n: I.num(items.length) }));
      bar.style.width = Math.round((i / items.length) * 100) + "%";
      await K.nextFrame();
      try {
        var bmp = await K.decodeImage(it.file);
        var w = bmp.width, h = bmp.height;
        if (mw && w > mw) { h = Math.round(h * (mw / w)); w = mw; }
        var canvas = K.makeCanvas(w, h);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(bmp, 0, 0, w, h);
        if (bmp.close) bmp.close();
        var type = targetType(it.file);
        var blob = await K.canvasToBlob(canvas, type, q);
        if (blob.size >= it.file.size) blob = it.file;
        if (it.outURL) { try { URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ } }
        it.outBlob = blob;
        it.outURL = URL.createObjectURL(blob);
        it.outName = K.sanitizeName(it.file.name) + "-kitbox." + (type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg");
      } catch (e) {
        K.toast(t("readError", { name: it.file.name }), "error");
      }
    }
    bar.style.width = "100%";
    busy = false;
    progress.hidden = true;
    bar.style.width = "0%";
    render();
    if (cancelled) { K.setStatus(status, t("cancelled"), "warning"); K.shieldState("idle"); return; }
    var n = items.filter(function (x) { return x.outBlob; }).length;
    K.setStatus(status, t("compressedCount", { n: I.num(n) }) + " " + t("processedOnDevice"), "success");
    K.shieldState("done");
  }

  function reset() {
    cancelled = true;
    items.forEach(function (it) {
      try { URL.revokeObjectURL(it.thumb); } catch (e) { /* noop */ }
      try { if (it.outURL) URL.revokeObjectURL(it.outURL); } catch (e) { /* noop */ }
    });
    items = [];
    render();
    K.setStatus(status, t("cleared"));
    K.shieldState("idle");
  }

  quality.addEventListener("input", function () { qualityOut.textContent = I.num(quality.value) + "%"; });
  qualityOut.textContent = I.num(quality.value) + "%";
  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", reset);
  zipBtn.addEventListener("click", function () {
    var done = items.filter(function (i) { return i.outBlob; });
    if (!done.length) return;
    zipBtn.disabled = true;
    K.needLib("jszip").then(function (JSZip) {
      var zip = new JSZip();
      done.forEach(function (it) { zip.file(it.outName, it.outBlob); });
      return zip.generateAsync({ type: "blob" });
    }).then(function (blob) {
      K.downloadBlob(blob, "kitbox-compressed-images.zip");
      zipBtn.disabled = false;
    }).catch(function () {
      K.setStatus(status, t("libraryFailed"), "error");
      zipBtn.disabled = false;
    });
  });

  K.wireDropzone({ zone: zone, input: input, onFiles: addFiles, paste: true });
  render();
})();
