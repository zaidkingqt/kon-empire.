/* Kitbox i18n — runtime strings for dynamic UI messages (EN + AR).
   Static page copy is hand-authored in HTML; this file only covers
   strings produced by JavaScript. */
(function (global) {
  "use strict";

  var DICT = {
    en: {
      /* generic actions */
      download: "Download",
      downloadAll: "Download all (ZIP)",
      remove: "Remove",
      removeFile: "Remove file",
      copy: "Copy",
      copied: "Copied to clipboard",
      copyFailed: "Could not copy. Select the text and copy manually.",
      startOver: "Start over",
      cleared: "Cleared. Ready for new files.",
      cancel: "Cancel",
      cancelled: "Cancelled.",
      close: "Close",
      moveUp: "Move up",
      moveDown: "Move down",

      /* files */
      addFiles: "Add files",
      filesAdded: "{n} file(s) added.",
      noFiles: "Add at least one file first.",
      duplicateSkipped: "{n} duplicate file(s) skipped.",
      unsupported: "{name}: unsupported file type. Skipped.",
      tooLarge: "{name} is larger than {limit} and was skipped.",
      readError: "{name} could not be read. The file may be damaged.",
      pastedImage: "Image pasted from clipboard.",
      dropHere: "Drop your files here",

      /* processing */
      working: "Working…",
      processing: "Processing {i} of {n}…",
      done: "Done",
      processedOnDevice: "Processed on your device ✓",
      failed: "Something went wrong. Please try again.",
      libraryFailed: "A required library could not be loaded. Check your connection, disable blockers for this page, and reload.",

      /* shield */
      shieldIdle: "0 bytes uploaded",
      shieldScanning: "Processing locally…",
      shieldDone: "Processed on your device ✓",

      /* image tools */
      savedPercent: "{p}% smaller",
      biggerResult: "Already optimised — original kept",
      totalSaved: "Total saved: {size} ({p}%)",
      compressedCount: "{n} image(s) compressed.",
      resizedCount: "{n} image(s) resized.",
      convertedCount: "{n} image(s) converted.",
      invalidDimensions: "Enter a width or a height greater than 0.",
      original: "Original",
      result: "Result",

      /* pdf */
      needTwoPdfs: "Add at least two PDF files to merge.",
      pdfPages: "{n} pages",
      pdfEncrypted: "{name} is password-protected and cannot be processed.",
      pdfInvalid: "{name} is not a readable PDF file.",
      merged: "PDFs merged successfully.",
      splitDone: "Created {n} PDF file(s).",
      invalidRange: "Invalid page range: {range}",
      rangeOutOfBounds: "Page {page} does not exist. The document has {total} pages.",
      enterRanges: "Enter at least one page range, e.g. 1-3,5",
      everyNInvalid: "Enter a group size between 1 and {total}.",
      pdfCreated: "PDF created ({n} page(s)).",
      needImages: "Add at least one image.",

      /* qr */
      qrEmpty: "Enter some content to generate a QR code.",
      qrTooLong: "That content is too long for a QR code. Shorten it and try again.",
      qrReady: "QR code updated.",
      ssidRequired: "Enter the network name (SSID).",

      /* password */
      noCharsets: "Select at least one character type.",
      passwordReady: "New password generated.",
      strengthVeryWeak: "Very weak",
      strengthWeak: "Weak",
      strengthFair: "Fair",
      strengthStrong: "Strong",
      strengthVeryStrong: "Very strong",
      entropyBits: "{n} bits of entropy",

      /* text tools */
      emptyText: "Type or paste some text first.",
      textConverted: "Text converted.",
      jsonValid: "Valid JSON.",
      jsonInvalid: "Invalid JSON at line {line}, column {col}: {msg}",
      jsonFormatted: "JSON formatted.",
      jsonMinified: "JSON minified.",
      jsonEmpty: "Paste some JSON first.",
      loremGenerated: "Placeholder text generated.",

      /* units */
      bytes: "B",
      kb: "KB",
      mb: "MB",
      gb: "GB",
      minutesShort: "min",
      secondsShort: "sec"
    },

    ar: {
      download: "تنزيل",
      downloadAll: "تنزيل الكل (ZIP)",
      remove: "إزالة",
      removeFile: "إزالة الملف",
      copy: "نسخ",
      copied: "تم النسخ إلى الحافظة",
      copyFailed: "تعذّر النسخ. حدّد النص وانسخه يدويًا.",
      startOver: "البدء من جديد",
      cleared: "تم المسح. جاهز لملفات جديدة.",
      cancel: "إلغاء",
      cancelled: "تم الإلغاء.",
      close: "إغلاق",
      moveUp: "تحريك لأعلى",
      moveDown: "تحريك لأسفل",

      addFiles: "إضافة ملفات",
      filesAdded: "تمت إضافة {n} ملف.",
      noFiles: "أضف ملفًا واحدًا على الأقل أولًا.",
      duplicateSkipped: "تم تجاهل {n} ملف مكرر.",
      unsupported: "{name}: نوع الملف غير مدعوم. تم تجاهله.",
      tooLarge: "حجم {name} أكبر من {limit} وتم تجاهله.",
      readError: "تعذّرت قراءة {name}. قد يكون الملف تالفًا.",
      pastedImage: "تم لصق صورة من الحافظة.",
      dropHere: "أفلت ملفاتك هنا",

      working: "جارٍ العمل…",
      processing: "جارٍ المعالجة {i} من {n}…",
      done: "تم",
      processedOnDevice: "تمت المعالجة على جهازك ✓",
      failed: "حدث خطأ ما. حاول مرة أخرى.",
      libraryFailed: "تعذّر تحميل مكتبة مطلوبة. تحقّق من اتصالك وأوقف أدوات الحجب لهذه الصفحة ثم أعد التحميل.",

      shieldIdle: "0 بايت تم رفعه",
      shieldScanning: "جارٍ المعالجة محليًا…",
      shieldDone: "تمت المعالجة على جهازك ✓",

      savedPercent: "أصغر بنسبة {p}%",
      biggerResult: "الصورة مضغوطة أصلًا — تم الإبقاء على الأصل",
      totalSaved: "إجمالي التوفير: {size} ({p}%)",
      compressedCount: "تم ضغط {n} صورة.",
      resizedCount: "تم تغيير حجم {n} صورة.",
      convertedCount: "تم تحويل {n} صورة.",
      invalidDimensions: "أدخل عرضًا أو ارتفاعًا أكبر من 0.",
      original: "الأصلية",
      result: "النتيجة",

      needTwoPdfs: "أضف ملفَّي PDF على الأقل للدمج.",
      pdfPages: "{n} صفحة",
      pdfEncrypted: "الملف {name} محمي بكلمة مرور ولا يمكن معالجته.",
      pdfInvalid: "الملف {name} ليس ملف PDF قابلًا للقراءة.",
      merged: "تم دمج ملفات PDF بنجاح.",
      splitDone: "تم إنشاء {n} ملف PDF.",
      invalidRange: "نطاق صفحات غير صالح: {range}",
      rangeOutOfBounds: "الصفحة {page} غير موجودة. المستند يحتوي على {total} صفحة.",
      enterRanges: "أدخل نطاق صفحات واحدًا على الأقل، مثل 1-3,5",
      everyNInvalid: "أدخل عدد صفحات بين 1 و {total}.",
      pdfCreated: "تم إنشاء ملف PDF ({n} صفحة).",
      needImages: "أضف صورة واحدة على الأقل.",

      qrEmpty: "أدخل محتوى لإنشاء رمز QR.",
      qrTooLong: "المحتوى طويل جدًا لرمز QR. اختصره وحاول مجددًا.",
      qrReady: "تم تحديث رمز QR.",
      ssidRequired: "أدخل اسم الشبكة (SSID).",

      noCharsets: "اختر نوع أحرف واحدًا على الأقل.",
      passwordReady: "تم إنشاء كلمة مرور جديدة.",
      strengthVeryWeak: "ضعيفة جدًا",
      strengthWeak: "ضعيفة",
      strengthFair: "متوسطة",
      strengthStrong: "قوية",
      strengthVeryStrong: "قوية جدًا",
      entropyBits: "{n} بت من العشوائية",

      emptyText: "اكتب أو الصق نصًا أولًا.",
      textConverted: "تم تحويل النص.",
      jsonValid: "JSON صالح.",
      jsonInvalid: "JSON غير صالح في السطر {line}، العمود {col}: {msg}",
      jsonFormatted: "تم تنسيق JSON.",
      jsonMinified: "تم تصغير JSON.",
      jsonEmpty: "الصق محتوى JSON أولًا.",
      loremGenerated: "تم إنشاء النص التجريبي.",

      bytes: "بايت",
      kb: "ك.ب",
      mb: "م.ب",
      gb: "ج.ب",
      minutesShort: "دقيقة",
      secondsShort: "ثانية"
    }
  };

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return l.indexOf("ar") === 0 ? "ar" : "en";
  }

  function t(key, vars) {
    var l = lang();
    var table = DICT[l] || DICT.en;
    var str = Object.prototype.hasOwnProperty.call(table, key) ? table[key] : DICT.en[key];
    if (typeof str !== "string") return key;
    if (vars) {
      str = str.replace(/\{(\w+)\}/g, function (m, k) {
        return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
      });
    }
    return str;
  }

  function locale() { return lang() === "ar" ? "ar" : "en"; }

  function num(n, opts) {
    try { return new Intl.NumberFormat(locale(), opts || {}).format(n); }
    catch (e) { return String(n); }
  }

  function bytes(n) {
    if (!isFinite(n) || n < 0) n = 0;
    var units = [t("bytes"), t("kb"), t("mb"), t("gb")];
    var i = 0;
    var v = n;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return num(v, { maximumFractionDigits: i === 0 ? 0 : (v < 10 ? 2 : 1) }) + " " + units[i];
  }

  function percent(p) {
    try {
      return new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(p);
    } catch (e) { return String(Math.round(p)); }
  }

  function date(d) {
    try {
      return new Intl.DateTimeFormat(locale(), { year: "numeric", month: "long", day: "numeric" }).format(d);
    } catch (e) { return String(d); }
  }

  global.KitboxI18n = { t: t, lang: lang, locale: locale, num: num, bytes: bytes, percent: percent, date: date, dict: DICT };
})(window);
