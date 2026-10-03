/* Kitbox — JSON Formatter / Validator. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var ta = document.getElementById("json-input");
  var status = document.getElementById("tool-status");
  var indentSel = document.getElementById("indent");
  var formatBtn = document.getElementById("format");
  var minifyBtn = document.getElementById("minify");
  var validateBtn = document.getElementById("validate");
  var copyBtn = document.getElementById("copy");
  var dlBtn = document.getElementById("download");
  var resetBtn = document.getElementById("reset");
  var treeBox = document.getElementById("json-tree");
  var treeWrap = document.getElementById("tree-wrap");
  var sizeNote = document.getElementById("size-note");

  var MAX_TREE_NODES = 4000;

  function positionOf(text, index) {
    var upto = text.slice(0, index);
    var lines = upto.split("\n");
    return { line: lines.length, col: lines[lines.length - 1].length + 1 };
  }

  function parse() {
    var text = ta.value;
    if (!text.trim()) { K.setStatus(status, t("jsonEmpty"), "error"); return null; }
    try {
      return { value: JSON.parse(text) };
    } catch (err) {
      var msg = String(err.message || "");
      var m = /position\s+(\d+)/i.exec(msg);
      var pos = m ? positionOf(text, parseInt(m[1], 10)) : { line: 1, col: 1 };
      var lm = /line\s+(\d+)\s+column\s+(\d+)/i.exec(msg);
      if (lm) pos = { line: parseInt(lm[1], 10), col: parseInt(lm[2], 10) };
      K.setStatus(status, t("jsonInvalid", { line: I.num(pos.line), col: I.num(pos.col), msg: msg }), "error");
      focusPosition(pos);
      return null;
    }
  }

  function focusPosition(pos) {
    var lines = ta.value.split("\n");
    var idx = 0;
    for (var i = 0; i < pos.line - 1 && i < lines.length; i++) idx += lines[i].length + 1;
    idx += Math.max(0, pos.col - 1);
    try { ta.focus(); ta.setSelectionRange(idx, Math.min(ta.value.length, idx + 1)); } catch (e) { /* noop */ }
  }

  function indentValue() {
    var v = indentSel.value;
    if (v === "tab") return "\t";
    return parseInt(v, 10);
  }

  function setOutput(text, message) {
    ta.value = text;
    sizeNote.textContent = (ar ? "حجم المخرجات: " : "Output size: ") + I.bytes(new Blob([text]).size);
    K.setStatus(status, message, "success");
    updateButtons();
  }

  function updateButtons() {
    var has = ta.value.trim().length > 0;
    copyBtn.disabled = dlBtn.disabled = !has;
    resetBtn.disabled = !has;
  }

  function buildTree(value) {
    var nodes = 0;
    function node(key, val) {
      nodes++;
      var li = document.createElement("li");
      if (nodes > MAX_TREE_NODES) {
        li.textContent = ar ? "… تم اختصار العرض للحفاظ على سرعة الصفحة" : "… tree truncated to keep the page responsive";
        return li;
      }
      var isObj = val !== null && typeof val === "object";
      if (!isObj) {
        var span = document.createElement("span");
        if (key !== null) {
          var k = document.createElement("span");
          k.className = "json-key";
          k.textContent = JSON.stringify(key) + ": ";
          span.appendChild(k);
        }
        var v = document.createElement("span");
        v.className = val === null ? "json-null" : (typeof val === "string" ? "json-str" : typeof val === "number" ? "json-num" : "json-bool");
        v.textContent = JSON.stringify(val);
        span.appendChild(v);
        li.appendChild(span);
        return li;
      }
      var details = document.createElement("details");
      details.open = nodes < 40;
      var summary = document.createElement("summary");
      var isArr = Array.isArray(val);
      var count = isArr ? val.length : Object.keys(val).length;
      summary.textContent = (key !== null ? JSON.stringify(key) + ": " : "") + (isArr ? "[" : "{") + " " + I.num(count) + " " + (ar ? "عنصر" : "items") + " " + (isArr ? "]" : "}");
      details.appendChild(summary);
      var ul = document.createElement("ul");
      if (isArr) val.forEach(function (x, i) { ul.appendChild(node(String(i), x)); });
      else Object.keys(val).forEach(function (k2) { ul.appendChild(node(k2, val[k2])); });
      details.appendChild(ul);
      li.appendChild(details);
      return li;
    }
    var root = document.createElement("ul");
    root.appendChild(node(null, value));
    return root;
  }

  function showTree(value) {
    treeBox.innerHTML = "";
    treeBox.appendChild(buildTree(value));
    treeWrap.hidden = false;
  }

  formatBtn.addEventListener("click", function () {
    var r = parse();
    if (!r) return;
    setOutput(JSON.stringify(r.value, null, indentValue()), t("jsonFormatted"));
    showTree(r.value);
  });

  minifyBtn.addEventListener("click", function () {
    var r = parse();
    if (!r) return;
    setOutput(JSON.stringify(r.value), t("jsonMinified"));
    showTree(r.value);
  });

  validateBtn.addEventListener("click", function () {
    var r = parse();
    if (!r) return;
    K.setStatus(status, t("jsonValid"), "success");
    showTree(r.value);
  });

  copyBtn.addEventListener("click", function () { if (ta.value) K.copyText(ta.value); });
  dlBtn.addEventListener("click", function () {
    if (!ta.value) return;
    K.downloadBlob(new Blob([ta.value], { type: "application/json;charset=utf-8" }), "kitbox-data.json");
  });
  resetBtn.addEventListener("click", function () {
    ta.value = "";
    treeBox.innerHTML = "";
    treeWrap.hidden = true;
    sizeNote.textContent = "";
    updateButtons();
    ta.focus();
    K.setStatus(status, t("cleared"));
  });
  ta.addEventListener("input", updateButtons);

  updateButtons();
})();
