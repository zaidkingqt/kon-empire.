/* Kitbox — Lorem Ipsum Generator. 100% client-side. */
(function () {
  "use strict";
  var K = window.Kitbox, I = window.KitboxI18n;
  var t = K.t;
  var ar = I.lang() === "ar";

  var out = document.getElementById("lorem-out");
  var status = document.getElementById("tool-status");
  var unitSel = document.getElementById("unit");
  var countIn = document.getElementById("count");
  var startLorem = document.getElementById("start-lorem");
  var wrapP = document.getElementById("wrap-p");
  var scriptField = document.getElementById("script-field");
  var scriptSel = document.getElementById("script");
  var genBtn = document.getElementById("generate");
  var copyBtn = document.getElementById("copy");
  var dlBtn = document.getElementById("download");
  var resetBtn = document.getElementById("reset");

  var LATIN = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis commodo pharetra est eros bibendum elit nec luctus magna felis sollicitudin mauris integer in mauris eu nibh euismod gravida").split(" ");

  var ARABIC = ("النص البديل يستخدم في التصميم لملء المساحات قبل كتابة المحتوى النهائي ويساعد المصمم على تقييم شكل الصفحة وحجم الخط والمسافات بين الأسطر دون الانشغال بمعنى الكلمات وهو أسلوب قديم في الطباعة انتقل إلى الويب وصار جزءًا من أدوات العمل اليومية لدى المصممين والمطورين على حد سواء وتفيد هذه النصوص في عرض النماذج الأولية أمام العملاء").split(" ");

  function pool() {
    if (!ar) return LATIN;
    return scriptSel && scriptSel.value === "ar" ? ARABIC : LATIN;
  }

  function randWord(words) { return words[K.randomInt(words.length)]; }

  function sentence(words, first) {
    var n = 6 + K.randomInt(10);
    var parts = [];
    for (var i = 0; i < n; i++) parts.push(randWord(words));
    var s = parts.join(" ");
    if (first && words === LATIN) s = "Lorem ipsum dolor sit amet, consectetur adipiscing elit " + s;
    else if (first && words === ARABIC) s = "النص البديل هنا " + s;
    if (words !== ARABIC) s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + (words === ARABIC ? "." : ".");
  }

  function build() {
    var words = pool();
    var unit = unitSel.value;
    var n = parseInt(countIn.value, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 200) n = 200;
    var startFlag = startLorem.checked;
    var blocks = [];

    if (unit === "words") {
      var w = [];
      if (startFlag && words === LATIN) w = ["Lorem", "ipsum", "dolor", "sit", "amet"].slice(0, n);
      else if (startFlag && words === ARABIC) w = ["النص", "البديل", "هنا"].slice(0, n);
      while (w.length < n) w.push(randWord(words));
      blocks = [w.join(" ")];
    } else if (unit === "sentences") {
      var ss = [];
      for (var i = 0; i < n; i++) ss.push(sentence(words, startFlag && i === 0));
      blocks = [ss.join(" ")];
    } else {
      for (var p = 0; p < n; p++) {
        var cnt = 3 + K.randomInt(4);
        var sent = [];
        for (var j = 0; j < cnt; j++) sent.push(sentence(words, startFlag && p === 0 && j === 0));
        blocks.push(sent.join(" "));
      }
    }

    var text = wrapP.checked
      ? blocks.map(function (b) { return "<p>" + b + "</p>"; }).join("\n")
      : blocks.join("\n\n");

    out.value = text;
    copyBtn.disabled = dlBtn.disabled = !text;
    K.setStatus(status, t("loremGenerated"), "success");
  }

  if (scriptField) scriptField.hidden = !ar;

  genBtn.addEventListener("click", build);
  [unitSel, countIn, startLorem, wrapP].forEach(function (f) { f.addEventListener("change", build); });
  if (scriptSel) scriptSel.addEventListener("change", build);
  copyBtn.addEventListener("click", function () { if (out.value) K.copyText(out.value); });
  dlBtn.addEventListener("click", function () {
    if (!out.value) return;
    K.downloadBlob(new Blob([out.value], { type: "text/plain;charset=utf-8" }), "kitbox-placeholder-text.txt");
  });
  resetBtn.addEventListener("click", function () {
    out.value = "";
    copyBtn.disabled = dlBtn.disabled = true;
    K.setStatus(status, t("cleared"));
  });

  build();
})();
