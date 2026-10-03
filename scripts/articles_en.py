# -*- coding: utf-8 -*-
"""English tool copy: titles, descriptions, how-to steps, long-form article, FAQ."""

EN = {}

EN["image-compressor"] = {
    "name": "Image Compressor",
    "title": "Image Compressor — Shrink JPG, PNG & WebP | Kitbox",
    "desc": "Compress JPG, PNG and WebP images in your browser. Adjust quality, cap the width, compare before and after, and download a ZIP. Nothing is uploaded.",
    "h1": "Compress images without uploading them",
    "benefit": "Make photos dramatically smaller for websites, email and messaging apps while keeping them sharp — all of it happens inside this browser tab.",
    "card": "Shrink JPG, PNG and WebP files with a live quality control.",
    "howto": [
        "Drop your JPG, PNG or WebP files onto the drop area, pick them with the file button, or paste an image with Ctrl + V.",
        "Set the quality slider. Around 75 is a good default for photographs; raise it for images with fine text or hard edges.",
        "Optionally set a maximum width so oversized camera photos are scaled down before they are re-encoded.",
        "Press Compress images, review the before and after sizes, then download files individually or as a single ZIP archive.",
    ],
    "article": """
<h2>What this image compressor actually does</h2>
<p>Every photo you take carries far more data than a web page needs. A modern phone camera writes 4000-pixel-wide files with very light compression, which is perfect for printing and wasteful for a blog post, a product listing or an email attachment. This tool re-encodes your picture at a lower quality setting, and optionally scales it down first, so the visible result stays close to the original while the file becomes a fraction of its former size.</p>
<p>The work is done by the image decoder and canvas encoder that already ship inside your browser. Your file is read into memory from your own disk, drawn onto an off-screen canvas, and encoded again as JPEG, PNG or WebP. At no point is it sent anywhere. That is why the tool keeps working on a slow connection and why the byte counter in the header never moves.</p>

<h2>Why people compress images</h2>
<p>Page weight is the single easiest performance win on most websites. Images routinely account for more than half of the bytes a visitor downloads, and Google's Core Web Vitals treat a slow Largest Contentful Paint as a ranking-relevant quality problem. Cutting a 4 MB hero photograph down to 250 KB can take seconds off the load time on a mobile connection. Other common reasons are email attachment limits, upload caps on marketplaces and job portals, storage costs, and messaging apps that silently degrade anything too large.</p>

<h2>Choosing a quality setting</h2>
<p>Quality values are not percentages of visual fidelity; they are encoder parameters. In practice, photographs look untouched down to about 80, remain very good at 70, and start to show blocky artefacts in smooth gradients such as skies below 60. Screenshots, logos, line art and anything with crisp text behave differently: JPEG smears their edges, so keep PNG or WebP for those and rely on the maximum-width control instead of aggressive quality reduction.</p>
<p>A practical workflow is to compress once at 75, look at the comparison slider at full width, and only then decide whether to go lower. The percentage saved is shown per file and as a combined total, so you can tell immediately whether a second pass is worth it.</p>

<h2>Tips and best practices</h2>
<ul>
  <li>Resize before you compress. A 4032-pixel photo displayed in a 1200-pixel column is wasting three quarters of its data no matter which quality you choose.</li>
  <li>Keep your originals. Compression is lossy and cannot be undone; always work from a copy.</li>
  <li>Prefer WebP when your audience uses current browsers. It typically beats JPEG by 25–35% at the same perceived quality.</li>
  <li>Compress once. Repeatedly re-encoding an already compressed JPEG stacks artefacts without saving much.</li>
  <li>Batch similar images together so a single quality setting suits all of them.</li>
</ul>

<h2>Common problems and troubleshooting</h2>
<p>If the result is larger than the original, the source was already well optimised; the tool detects this and keeps the original file instead. If a photo appears rotated, note that orientation metadata is applied during decoding, so the output is stored upright rather than relying on an EXIF flag that some viewers ignore. If a very large batch feels slow, remember that the processing power is your own device's — files are handled one at a time so the page stays responsive, and you can remove items you no longer need.</p>
<p>Transparency is preserved for PNG and WebP. If you need a transparent PNG as a JPEG, use the <a href="/image-converter/">image converter</a>, which lets you choose the colour that replaces the transparent areas.</p>

<h2>Privacy</h2>
<p>No account, no queue, no server-side copy. The images never leave the machine you are reading this on, which matters for identity documents, medical scans, contracts, unreleased product photos and anything else you would not email to a stranger.</p>
""",
    "faq": [
        ("Are my images uploaded to a server?", "No. The compressor reads your files directly from your device, processes them with your browser's built-in canvas encoder, and writes the result back to your downloads folder. No copy is transmitted to Kitbox or to any third party."),
        ("Which formats are supported?", "JPG/JPEG, PNG and WebP. Each file is re-encoded in its own format, so a PNG stays a PNG with its transparency intact. Use the image converter if you also need to change the format."),
        ("How much smaller will my files be?", "It depends entirely on the source. Unoptimised camera photos commonly shrink by 70–90% at quality 75. Images that have already been compressed by a CMS may only shrink a little, and the tool will keep the original if compression would make it bigger."),
        ("Is there a file size or file count limit?", "There is no server limit because there is no server. In practice your device's available memory is the limit; files above 100 MB are skipped to protect the browser tab, and very large batches are processed one image at a time."),
        ("Does compression remove EXIF data?", "Yes. Re-encoding through a canvas discards metadata such as GPS coordinates, camera model and timestamps, which is usually desirable before publishing a photo online."),
        ("Can I compress images on my phone?", "Yes. The tool is designed mobile-first and uses the same browser APIs on Android and iOS. Tap the drop area to open your photo picker, then download the results to your device."),
    ],
}

EN["image-resizer"] = {
    "name": "Image Resizer",
    "title": "Image Resizer — Resize Photos by Pixels or % | Kitbox",
    "desc": "Resize images by pixels or percentage with aspect-ratio lock and ready-made social presets. Batch processing, format choice and instant download in your browser.",
    "h1": "Resize images to exact dimensions in your browser",
    "benefit": "Hit a precise pixel size, scale a whole batch by percentage, or use a ready-made preset for Instagram, YouTube, Facebook and passport photos.",
    "card": "Exact pixel sizes, percentage scaling and social media presets.",
    "howto": [
        "Add one or more JPG, PNG or WebP images using the drop area, the file picker, or Ctrl + V.",
        "Choose whether to resize by pixels or by percentage, then enter the target values. Keep the aspect-ratio lock on to avoid distortion.",
        "Pick a preset if you are targeting a known platform size, and select the output format and quality.",
        "Press Resize images and download each result, or grab everything at once as a ZIP file.",
    ],
    "article": """
<h2>What image resizing really means</h2>
<p>Resizing changes the number of pixels in an image. Downscaling throws data away and is almost always safe; upscaling invents pixels by interpolation and can only ever look softer than the original. This tool uses high-quality smoothing when it redraws your picture, which avoids the jagged edges you get from naive nearest-neighbour scaling.</p>
<p>The entire operation happens on a canvas inside your browser. Your photo is decoded from your own disk, drawn at the requested size, and encoded again in the format you choose. Nothing is uploaded, so there is no waiting room, no queue and no retention policy to read.</p>

<h2>Pixels, percentages and aspect ratio</h2>
<p>Use pixel mode when a platform or a layout dictates an exact size — a 1200-pixel-wide blog header, a 512-pixel app icon source, a 413 × 531 passport photograph. Use percentage mode when you simply need everything smaller: a batch of mixed-size photographs scaled to 50% keeps their relative proportions without you having to calculate anything.</p>
<p>The aspect-ratio lock is on by default. With it enabled, entering a width fills in the matching height so circles stay circular and faces are not stretched. Turn it off only when you deliberately want to squeeze an image into a fixed frame, and expect visible distortion if the original proportions are far from the target.</p>

<h2>The presets, and when to use them</h2>
<p>Social platforms re-compress whatever you give them, and they do a better job when the dimensions already match their layout. The Instagram post preset produces the square 1080 × 1080 that the feed expects; the story preset uses the 9:16 frame of 1080 × 1920. YouTube thumbnails are 1280 × 720, Facebook covers 820 × 312, and the favicon preset gives you a clean 512 × 512 master from which every smaller icon size can be derived. The passport preset uses the common 413 × 531 pixel layout for a 35 × 45 mm photo at 300 DPI — always confirm the requirements of the authority you are applying to, because countries differ.</p>

<h2>Practical tips</h2>
<ul>
  <li>Resize from the largest original you have. Going 4000 → 1200 once beats going 4000 → 2000 → 1200.</li>
  <li>Choose PNG for logos, screenshots and anything with transparency; choose JPG or WebP for photographs.</li>
  <li>If the output needs to serve a retina display, export at twice the CSS pixel size and let the browser scale it down.</li>
  <li>For a favicon, start at 512 × 512 and keep the artwork simple — fine details disappear at 32 pixels.</li>
  <li>Batch work is easiest when the source images share an orientation; otherwise use percentage mode.</li>
</ul>

<h2>Troubleshooting</h2>
<p>If a resized photo looks soft, you probably upscaled it; there is no way to recover detail that was never captured. If the output file is unexpectedly large, lower the quality slider or switch to WebP. If a PNG with transparency is exported as JPG, transparent pixels are filled with white here — use the <a href="/image-converter/">image converter</a> if you need control over that fill colour. If dimension fields seem to fight you, check whether the aspect-ratio lock is on.</p>

<h2>Privacy</h2>
<p>Resizing is a common step for identity documents, children's school photos and medical paperwork. Because this tool never transmits your file, those images stay on your device for their entire life cycle, and the privacy shield in the header stays at zero bytes uploaded.</p>
""",
    "faq": [
        ("Can I resize several images at once?", "Yes. Add as many files as you like; they are processed sequentially so the page stays responsive, and you can download them individually or together as a ZIP archive."),
        ("Will resizing reduce the file size too?", "Usually yes, substantially — fewer pixels means fewer bytes. You also control the output quality, so you can tune size and sharpness independently."),
        ("What does the aspect-ratio lock do?", "It keeps the original width-to-height proportion. Type a width and the height is calculated for you, which prevents stretched or squashed results."),
        ("Can I make an image bigger?", "You can, by entering larger dimensions or a percentage above 100. Interpolation cannot add real detail, so expect a softer picture; enlarging beyond about 150% rarely looks good."),
        ("Which preset should I use for a passport photo?", "The built-in passport preset outputs 413 × 531 pixels, which corresponds to 35 × 45 mm at 300 DPI. Requirements vary by country, so always check the official specification before submitting."),
        ("Does the tool work offline?", "The page itself needs to load from the network, but once it has, resizing runs entirely on your device. The optional ZIP download loads one small library from a public CDN."),
    ],
}

EN["image-converter"] = {
    "name": "Image Converter",
    "title": "Image Converter — JPG, PNG & WebP, Both Ways | Kitbox",
    "desc": "Convert images between JPG, PNG and WebP in any direction. Batch convert, choose quality, set a background for transparency, and download a ZIP — all offline in your browser.",
    "h1": "Convert images between JPG, PNG and WebP",
    "benefit": "Switch formats in any direction, in batches, with full control over quality and over the colour that replaces transparency when you export to JPG.",
    "card": "Switch between JPG, PNG and WebP in batches, with quality control.",
    "howto": [
        "Add your JPG, PNG or WebP images by dropping them, choosing them, or pasting with Ctrl + V.",
        "Pick the target format. When converting to JPG, choose the background colour used for transparent pixels.",
        "Adjust the quality slider for JPG and WebP output; PNG is lossless and ignores it.",
        "Press Convert images, check the previews, then download each file or the whole set as a ZIP.",
    ],
    "article": """
<h2>Which format should you use?</h2>
<p>JPEG is the right choice for photographs that will be viewed anywhere, including very old software. It is lossy, has no transparency, and compresses continuous tones efficiently. PNG is lossless and supports an alpha channel, which makes it ideal for logos, icons, screenshots and anything with crisp edges or text — at the cost of much larger files for photographic content. WebP sits between the two: it offers both lossy and lossless modes plus transparency, and it is supported by every current browser. For a typical website image, WebP is 25–35% smaller than an equivalent-quality JPEG.</p>
<p>This converter decodes your image with the browser's own decoder and re-encodes it through a canvas. Because the pixels are rendered before they are written out, the conversion is a true re-encode rather than a container rename, and metadata such as GPS coordinates is dropped in the process.</p>

<h2>Why conversion comes up so often</h2>
<p>Design tools export PNG by default, and a folder of PNG screenshots can easily weigh ten times what the same content needs. Content management systems and job portals sometimes accept only JPG. Email clients and older printers can stumble on WebP. A theme might demand transparent PNG assets while your source material is JPEG. Converting locally saves a round trip to an online service and, more importantly, keeps commercial artwork and personal photos out of someone else's upload folder.</p>

<h2>Handling transparency</h2>
<p>JPEG has no concept of transparency. When you convert a transparent PNG or WebP into JPG, every see-through pixel must be given a colour. Many tools silently use black, which looks like a mistake on a light page. Here you choose the colour explicitly with a picker, so you can match the exact background of the page or document where the image will sit. If you need to keep transparency, convert to PNG or WebP instead.</p>

<h2>Tips and best practices</h2>
<ul>
  <li>Never convert a JPEG to PNG expecting better quality. The lost detail is already gone and the file will simply get bigger.</li>
  <li>Convert PNG photographs to WebP or JPG; convert PNG line art to WebP lossless if you need the smaller size with sharp edges.</li>
  <li>Use a consistent quality setting across a batch so a gallery looks uniform.</li>
  <li>Keep a master copy in the highest-quality format you have, and convert copies for each destination.</li>
  <li>Check the preview grid after converting — it is the quickest way to catch an unexpected background colour.</li>
</ul>

<h2>Troubleshooting</h2>
<p>If a converted file is bigger than the source, you probably moved from a lossy format to a lossless one; reverse the direction or switch to WebP. If colours shift slightly, that is normal: the browser converts to the sRGB working space, and images carrying an exotic colour profile will be rendered rather than tagged. If a file is skipped, its type is not one of the three supported formats — animated GIFs, HEIC photos and RAW camera files are outside the scope of this tool. If you only need a smaller file in the same format, the <a href="/image-compressor/">image compressor</a> is the better fit.</p>

<h2>Privacy</h2>
<p>Everything runs in this tab. There is no upload step, no temporary server copy, and no retention window to worry about, which makes local conversion the safest option for client work, unreleased designs and personal photographs.</p>
""",
    "faq": [
        ("Which conversions are supported?", "Any direction between JPG, PNG and WebP: JPG to PNG, JPG to WebP, PNG to JPG, PNG to WebP, WebP to JPG and WebP to PNG."),
        ("What happens to transparency when I convert to JPG?", "JPEG cannot store transparency, so transparent pixels are filled with the background colour you pick before converting. Choose white for most documents, or match your page background."),
        ("Does converting to PNG improve a JPEG's quality?", "No. Detail removed by JPEG compression cannot be restored. Converting to PNG only produces a larger file containing the same visible information."),
        ("Can I convert many images at once?", "Yes. Add a whole batch, convert them with one click, and download them individually or as a single ZIP archive generated in your browser."),
        ("Is metadata preserved?", "No. Because the image is redrawn before encoding, EXIF metadata such as camera model, timestamps and GPS location is removed, which is usually what you want before publishing."),
        ("Are HEIC, GIF, SVG or RAW files supported?", "Not at the moment. The tool deliberately covers the three formats the browser can both decode and encode reliably: JPG, PNG and WebP."),
    ],
}

EN["pdf-merge"] = {
    "name": "PDF Merge",
    "title": "Merge PDF Files Online — Private & Free | Kitbox",
    "desc": "Combine several PDF files into one document in your browser. Reorder pages by dragging, see page counts and sizes, and download instantly. No upload, no sign-up.",
    "h1": "Merge PDF files without uploading them",
    "benefit": "Combine contracts, invoices, scans and reports into a single tidy document, with full control over the order — and without handing your paperwork to a server.",
    "card": "Combine multiple PDFs into one, with drag-and-drop ordering.",
    "howto": [
        "Drop two or more PDF files onto the drop area or choose them with the file picker. Kitbox reads each file and shows its size and page count.",
        "Arrange the documents by dragging a row, or use the up and down buttons for keyboard and screen-reader access.",
        "Give the combined document a file name.",
        "Press Merge PDFs. The new file is assembled in memory and saved straight to your downloads folder.",
    ],
    "article": """
<h2>What merging a PDF involves</h2>
<p>A PDF is a container of page objects plus the fonts, images and metadata those pages reference. Merging is therefore not a matter of gluing two files end to end: each page must be copied into a new document along with every resource it depends on, and the cross-reference table has to be rebuilt. This tool uses pdf-lib, a well-established open-source PDF library, loaded from a public CDN and executed entirely inside your browser tab. Your documents are read from your own disk into memory, recombined, and written back out as a download.</p>

<h2>Why people merge PDFs</h2>
<p>Scanners produce one file per batch, so a ten-page contract arrives as three separate documents. Expense claims need receipts in one attachment. University applications ask for a single PDF containing a transcript, a certificate and a passport copy. Legal bundles, tender submissions and insurance claims all have the same requirement: one file, in a specific order, with nothing missing. Doing that online usually means uploading sensitive paperwork to a stranger's server. Doing it locally means the paperwork never leaves your laptop.</p>

<h2>Getting the order right</h2>
<p>Order is the part people get wrong, so the list is designed around it. Each row shows the position number, the original file name, the file size and the page count read from the document itself, so you can confirm you have the right version before merging. Rows can be dragged with a mouse or touch, and every row also exposes explicit move-up and move-down buttons, which means the whole feature is usable with a keyboard or a screen reader. The status line announces the new order after each move.</p>

<h2>Best practices</h2>
<ul>
  <li>Name your source files with a numeric prefix (01-, 02-) so they sort predictably before you even add them.</li>
  <li>Check page counts in the list against what you expect; a scan that stopped early is easier to spot here than in the merged result.</li>
  <li>Merge scanned images at their original resolution, then compress the pictures beforehand with the <a href="/image-compressor/">image compressor</a> if size matters.</li>
  <li>If you only need some pages from a long document, split it first with <a href="/pdf-split/">PDF split</a>, then merge the pieces you want.</li>
  <li>Keep the originals until you have opened and checked the merged file.</li>
</ul>

<h2>Problems you may hit</h2>
<p>Password-protected documents cannot be merged. PDF encryption exists precisely to stop programmatic access, so the file is rejected with a clear message rather than being silently mangled; remove the protection in the application that created the file and try again. Damaged or truncated PDFs — a common result of an interrupted download — are also rejected. Files that merely have a .pdf extension but a different internal format will fail the same check.</p>
<p>Form fields and digital signatures deserve a note. Copying pages into a new document preserves their visual appearance, but interactive form data and cryptographic signatures are tied to the original file and do not survive a merge. If a signature must remain valid, merge before signing, not after.</p>

<h2>Privacy</h2>
<p>Contracts, medical records, bank statements and identity documents are exactly the kind of material that should not be uploaded casually. Kitbox performs the merge in your browser's memory, which is why the shield in the header can honestly report zero bytes uploaded.</p>
""",
    "faq": [
        ("Are my PDF files uploaded anywhere?", "No. The documents are read from your device into your browser's memory, combined locally with pdf-lib, and written back to your downloads folder. Kitbox has no server that receives files."),
        ("How many PDFs can I merge at once?", "There is no fixed limit. The practical ceiling is your device's memory, since all documents must be held open while the new file is assembled. Very large scanned bundles are the usual constraint."),
        ("Can I merge password-protected PDFs?", "No. Encrypted documents are rejected with an explanatory message. Open the file in the application that produced it, remove the protection, save a copy, and merge that copy."),
        ("Will bookmarks, form fields and signatures survive?", "Page content, text and images are preserved. Interactive form data, bookmarks and digital signatures belong to the original document structure and are not carried over by a page-level merge."),
        ("Can I change the page order inside a single PDF?", "Not directly in this tool. Split the document into pieces with the PDF split tool, then merge those pieces back in the order you want."),
        ("Does merging reduce quality?", "No. Pages are copied, not re-rendered, so text stays selectable and images keep their original resolution. The merged file is roughly the sum of its parts."),
    ],
}

EN["pdf-split"] = {
    "name": "PDF Split",
    "title": "Split PDF Pages — Ranges or Every Page | Kitbox",
    "desc": "Split a PDF by page ranges such as 1-3,5,8-10, into groups of N pages, or into single pages. Download one file or a ZIP. Everything runs in your browser.",
    "h1": "Split a PDF into exactly the pages you need",
    "benefit": "Extract a chapter, separate a scanned batch into individual documents, or break a long report into even chunks — with validation that catches mistakes before they cost you time.",
    "card": "Extract page ranges, split every N pages, or separate every page.",
    "howto": [
        "Drop a single PDF onto the drop area. Kitbox reads it locally and shows the page count.",
        "Choose a split mode: specific page ranges, fixed-size groups, or one file per page.",
        "For ranges, type something like 1-3,5,8-10. Each comma-separated entry becomes its own PDF.",
        "Press Split PDF. A single result downloads directly; multiple results are packaged into a ZIP file in your browser.",
    ],
    "article": """
<h2>Three ways to split, and when each one fits</h2>
<p>Page ranges are the precise option. Writing <code>1-3,5,8-10</code> produces three documents: the first three pages, page five on its own, and pages eight to ten. Use it to pull a single chapter out of a manual, to separate the signed pages of a contract, or to discard a cover sheet. Every entry is validated against the real page count before anything is generated, so a typo such as a range that runs backwards or a page that does not exist is reported immediately instead of producing a silently wrong file.</p>
<p>Splitting every N pages suits regular documents: a 120-page report cut into twelve 10-page sections, or a double-sided scan separated into two-page records. Splitting every page individually is what you want after scanning a stack of unrelated single-page documents — invoices, certificates, receipts — in one pass.</p>

<h2>How it works under the hood</h2>
<p>The file is read into memory with the FileReader APIs that every browser provides, parsed with pdf-lib, and the requested pages are copied into fresh documents. If the operation produces more than one file, JSZip assembles them into a single archive, again in memory, so you get one download instead of twenty. Both libraries are loaded from a public CDN and run as ordinary JavaScript in your tab; neither of them opens a network connection with your data.</p>

<h2>Practical tips</h2>
<ul>
  <li>Open the PDF in a viewer first and note the page numbers you need. The tool counts physical pages starting at one, which may differ from printed numbering that skips a cover.</li>
  <li>Ranges may be listed in any order, and identical duplicates are ignored, so you can build the list as you think of it.</li>
  <li>Splitting then merging is a complete reordering workflow: use <a href="/pdf-merge/">PDF merge</a> to recombine the pieces.</li>
  <li>For a huge scan, split into groups first and work on the groups; this keeps memory use predictable on older devices.</li>
  <li>Result files are named after the source document plus the page range, which keeps a ZIP of twenty files navigable.</li>
</ul>

<h2>Validation and error messages</h2>
<p>Four classes of mistake are caught before processing starts. A malformed entry such as <code>3--5</code> or <code>abc</code> is rejected with the offending text quoted back. A reversed range like <code>9-4</code> is rejected. A range that extends past the end of the document reports both the offending page and the real total. An empty input simply asks for at least one range. Duplicate identical ranges are silently de-duplicated rather than producing two copies of the same file.</p>

<h2>Limitations</h2>
<p>Encrypted PDFs cannot be opened; remove the password in the originating application first. Damaged files are rejected rather than partially processed. Splitting copies pages, so interactive form data and digital signatures do not survive — plan your signing step accordingly. Finally, a split file is not automatically smaller in proportion to its page count, because shared resources such as embedded fonts are copied into each output document.</p>

<h2>Privacy</h2>
<p>Splitting is often the step where you remove pages you do not want to share — bank details, a home address, a medical note. Doing that on a remote server would mean uploading precisely the pages you are trying to protect. Here the original never leaves your device, and neither do the results.</p>
""",
    "faq": [
        ("How do I write page ranges?", "Use comma-separated entries. A single number such as 5 extracts one page; a hyphenated pair such as 8-10 extracts an inclusive range. A valid example is 1-3,5,8-10, which creates three separate PDF files."),
        ("What happens if I enter an invalid range?", "The tool validates everything against the document's real page count before processing. Malformed entries, reversed ranges and pages beyond the end of the document are reported with a clear message and nothing is generated."),
        ("Do I get one file or many?", "A single resulting document downloads directly as a PDF. When a split produces several documents they are packaged into one ZIP archive, created in your browser with JSZip."),
        ("Can I split a password-protected PDF?", "No. Encryption blocks programmatic access by design. Remove the password in the application that created the document, save an unprotected copy, and split that."),
        ("Is there a page limit?", "No fixed limit. Documents with several hundred pages work fine; the constraint is your device's memory, and splitting into single pages is the most demanding mode because each page becomes its own document."),
        ("Will the split files be smaller than the original?", "Usually, but not proportionally. Resources such as embedded fonts and colour profiles are duplicated into every output file, so ten single-page PDFs together can exceed the size of the ten-page original."),
    ],
}

EN["images-to-pdf"] = {
    "name": "Images to PDF",
    "title": "Convert Images to PDF — JPG & PNG to PDF | Kitbox",
    "desc": "Turn JPG and PNG images into one PDF document. Reorder pages, pick A4, Letter or fit-to-image, set orientation and margins, and download — entirely in your browser.",
    "h1": "Turn your images into one PDF document",
    "benefit": "Combine photos of documents, receipts or whiteboards into a single properly paginated PDF, with the page size, orientation and margins you actually need.",
    "card": "Combine JPG and PNG images into a single paginated PDF.",
    "howto": [
        "Add your JPG or PNG images. Each image becomes one page, and a preview strip shows the resulting order.",
        "Drag rows or use the arrow buttons to arrange the pages.",
        "Choose A4, Letter or fit-to-image, set portrait or landscape, and pick a margin.",
        "Name the file and press Create PDF. The document is built in your browser and downloaded immediately.",
    ],
    "article": """
<h2>Why a PDF instead of a folder of photos</h2>
<p>Photographs of paperwork are convenient to capture and awkward to send. Ten separate JPEGs arrive out of order, open in ten windows, and print on ten sheets with no consistent margin. A PDF solves all of that: fixed page order, predictable printing, one attachment, and a format every institution accepts. Scanning apps do this on a phone, but they usually want an account, and the files pass through a cloud service on the way.</p>
<p>This tool builds the document with pdf-lib inside your browser. Each image is embedded as a JPEG or PNG object on its own page, scaled to fit the page box you chose while preserving its proportions, and centred within the margin you set. The result is a normal PDF that any reader can open.</p>

<h2>Choosing a page size</h2>
<p>A4 (210 × 297 mm) is the international standard and the right default for anything going to a European, Middle Eastern, Asian or African office. Letter (8.5 × 11 in) is the North American equivalent. Both place your image on a fixed sheet with white space around it, which is what you want for printing and for formal submissions.</p>
<p>Fit-to-image behaves differently: each page takes the exact dimensions of its image, plus the margin. There is no white space and no letterboxing, which suits screenshots, comic pages, product catalogues and anything intended for screen reading rather than printing. The trade-off is that pages can vary in size within the same document.</p>

<h2>Margins, orientation and quality</h2>
<p>The margin is specified in PDF points, where 72 points equal one inch. Twenty-four points is roughly eight millimetres, a comfortable edge for home printers, which rarely print to the very edge of the sheet. Set it to zero for borderless screen documents. Orientation matters most for photographs taken sideways: a landscape photo on a portrait A4 page leaves large bands of white above and below, so switch the page to landscape for those.</p>
<p>Image quality is inherited from your source files; the tool embeds them without re-encoding. If the PDF is too large to email, compress the images first with the <a href="/image-compressor/">image compressor</a> and then build the document — that is far more effective than any post-processing.</p>

<h2>Tips</h2>
<ul>
  <li>Crop and straighten photographs of documents before adding them. A square, tightly cropped page looks like a scan rather than a snapshot.</li>
  <li>Shoot in even, indirect light to avoid the shadow of your own hand across the page.</li>
  <li>Keep every page in the same orientation where possible; mixed orientations are legal but awkward to read.</li>
  <li>Check the preview strip before exporting — reordering afterwards means rebuilding the file.</li>
  <li>If you need to insert these pages into an existing document, create the PDF here and then use <a href="/pdf-merge/">PDF merge</a>.</li>
</ul>

<h2>Limitations and troubleshooting</h2>
<p>Only JPG and PNG are accepted, because those are the formats a PDF can embed directly without re-encoding; convert WebP or HEIC files first with the <a href="/image-converter/">image converter</a>. A very long batch of high-resolution photographs can consume a lot of memory, so build such documents in sections and merge them. There is no optical character recognition here: the output contains pictures of text, not searchable text.</p>

<h2>Privacy</h2>
<p>Photographs of passports, bank letters, tenancy agreements and medical results are routinely turned into PDFs. Because the whole process runs locally, none of those images is transmitted, stored or scanned by anyone else.</p>
""",
    "faq": [
        ("Which image formats can I use?", "JPG and PNG. These embed directly into a PDF without re-encoding, which keeps the output faithful to your originals. Convert other formats first with the image converter."),
        ("Can I control the page order?", "Yes. Drag the rows in the list, or use the up and down buttons which also work with a keyboard and a screen reader. The preview strip always reflects the current order."),
        ("What does fit-to-image do?", "It makes every page exactly as large as its image, plus the margin you chose. This avoids white borders and suits documents meant for screen reading rather than printing."),
        ("Is the text in my photos searchable?", "No. The PDF contains images, not recognised text. Kitbox does not perform OCR, which would require either a large download or a server, and the second option would break the privacy promise."),
        ("Why is my PDF so large?", "Because it contains your full-resolution photographs. Compress the images first with the Kitbox image compressor, then build the PDF; a 10 MB document often drops below 1 MB with no visible difference."),
        ("Is anything uploaded?", "No. The document is assembled in your browser's memory with pdf-lib and saved straight to your device."),
    ],
}

EN["qr-code-generator"] = {
    "name": "QR Code Generator",
    "title": "QR Code Generator — URL, Wi-Fi, vCard, Email | Kitbox",
    "desc": "Create QR codes for links, Wi-Fi networks, contact cards and emails. Choose colours, size, margin and error correction, then download PNG or SVG. No tracking, no upload.",
    "h1": "Generate QR codes that never expire",
    "benefit": "Static QR codes for links, Wi-Fi access, contact cards and prefilled emails — generated locally, with no redirect service that can disappear or start tracking your scans.",
    "card": "Static QR codes for links, Wi-Fi, contacts and email, as PNG or SVG.",
    "howto": [
        "Pick a content type: URL or text, Wi-Fi, vCard or email.",
        "Fill in the fields. The preview updates as you type.",
        "Adjust the foreground and background colours, the size, the quiet-zone margin and the error-correction level.",
        "Download a PNG for everyday use or an SVG for print, or copy the encoded text to inspect it.",
    ],
    "article": """
<h2>Static codes, and why that matters</h2>
<p>Many online QR generators give you a short redirect link rather than your actual data. The code points at their domain, which forwards to yours. That lets them count scans — and it means your code stops working the day the service shuts down, changes its pricing, or decides your free tier has expired. Codes generated here are static: your URL, your Wi-Fi credentials or your contact details are encoded directly into the pattern. Nothing can revoke them, and nobody logs the scans.</p>
<p>The pattern is computed by the qrcode-generator library running in your browser, then drawn onto a canvas with your chosen colours and exported as PNG or as a vector SVG.</p>

<h2>The four content types</h2>
<p><strong>URL or text</strong> is the general case: a web address, a phone number, a short message, a serial number on a label. <strong>Wi-Fi</strong> encodes the network name, security type and password in the standard WIFI: format, so a guest can join by pointing a camera at a card on the table instead of typing a long passphrase. <strong>vCard</strong> produces a contact record with name, organisation, job title, phone, email and website — ideal for a business card or an email signature. <strong>Email</strong> builds a mailto link with an optional prefilled subject and body, which works well on support posters and feedback cards.</p>

<h2>Error correction, size and the quiet zone</h2>
<p>QR codes include redundant data so they still scan when partly damaged. Level L tolerates about 7% damage, M about 15%, Q about 25% and H about 30%. Higher levels mean a denser pattern for the same content, so choose M for screens and ordinary printing, and H only when the code will be small, placed on a curved surface, exposed to weather, or partially covered by a logo.</p>
<p>The quiet zone is the blank border around the pattern. The specification calls for four modules, and scanners genuinely need it — a code butted up against dark artwork often fails. Keep the default unless you have a specific reason. For size, 512 pixels is comfortable for screens; for print, download the SVG instead, because vectors stay sharp at any scale and avoid the blurry edges of an upscaled bitmap.</p>

<h2>Design and testing tips</h2>
<ul>
  <li>Keep strong contrast between foreground and background. Light code on dark background is risky; many scanners expect the opposite polarity.</li>
  <li>Avoid pale colours. If in doubt, test the printed result from 30 centimetres away in poor light.</li>
  <li>Shorter content produces a less dense, more reliable code. Shorten long URLs before encoding, not after.</li>
  <li>Print at least 2 × 2 cm for a code scanned from arm's length, and larger for posters.</li>
  <li>Test with at least two different phones, including one with an older camera, before printing a thousand copies.</li>
</ul>

<h2>Troubleshooting</h2>
<p>If a code will not scan, the usual causes are insufficient contrast, a missing quiet zone, printing too small, or a glossy surface reflecting light. If you get a message that the content is too long, reduce it — very long vCards and multi-paragraph messages exceed what a readable code can carry. If a Wi-Fi code fails, check that the security type matches your router's actual setting, and remember that special characters in the password are escaped automatically.</p>

<h2>Privacy</h2>
<p>Wi-Fi passwords and personal contact details are sensitive. They are typed into a form that exists only in your browser, encoded locally, and never transmitted. Kitbox cannot see what you encoded, and because the code is static, no analytics service sits between the scanner and the destination.</p>
""",
    "faq": [
        ("Do these QR codes expire?", "No. They are static codes that contain your data directly, with no redirect through a third-party domain. Once printed, they keep working for as long as the destination exists."),
        ("Can anyone track scans of my code?", "Not through Kitbox. There is no redirect service and no analytics. If you encode a URL that itself contains tracking parameters, the destination site will of course still see those."),
        ("Should I download PNG or SVG?", "PNG for screens, messaging and quick use. SVG for anything printed: it is a vector, so it stays perfectly sharp at business-card or billboard size."),
        ("Which error-correction level should I choose?", "M is the sensible default. Use Q or H when the code is small, printed on a curved or textured surface, exposed to wear, or partially covered by a logo."),
        ("Is my Wi-Fi password sent anywhere?", "No. The password is used only to build the WIFI: string that is encoded into the pattern, entirely inside your browser. Nothing is transmitted or stored by Kitbox."),
        ("Why does my code fail to scan?", "Most often contrast, size or the quiet zone. Keep a dark pattern on a light background, leave the four-module border, print at 2 cm or larger, and avoid very glossy paper."),
    ],
}

EN["password-generator"] = {
    "name": "Password Generator",
    "title": "Strong Password Generator — Secure & Offline | Kitbox",
    "desc": "Generate strong passwords and passphrases with crypto.getRandomValues in your browser. Control length, character sets and ambiguity, and see a real entropy estimate.",
    "h1": "Generate strong passwords that never touch a server",
    "benefit": "Cryptographically secure random passwords and memorable passphrases, with a transparent entropy estimate instead of a vague colour bar.",
    "card": "Cryptographically secure passwords and passphrases with entropy shown.",
    "howto": [
        "Choose random characters for maximum strength, or a passphrase when you need something you can type and remember.",
        "Set the length or the number of words, and select which character sets to include.",
        "Turn on exclude ambiguous characters if the password will be read aloud or copied by hand.",
        "Press Generate, check the entropy estimate, and copy the result into your password manager.",
    ],
    "article": """
<h2>Randomness is the whole product</h2>
<p>A password generator is only as good as its source of randomness. <code>Math.random()</code> — used by a surprising number of web tools — is a fast pseudo-random generator that is explicitly documented as unsuitable for security purposes; its output can be predicted from previous values. This tool uses <code>crypto.getRandomValues()</code>, the Web Crypto interface to the operating system's cryptographically secure random source, and it rejects modulo bias by discarding values that would skew the distribution. The shuffle that mixes the required character classes into the result uses the same source.</p>
<p>Just as important: the password is created in your browser and stays there. It is not generated on a server, not logged, and not sent anywhere. The only way it leaves your device is if you copy it yourself.</p>

<h2>Reading the entropy estimate</h2>
<p>Entropy, measured in bits, states how many guesses an attacker needs on average. Each additional bit doubles that number. A 20-character password drawn from a 90-character alphabet carries roughly 130 bits, which is far beyond anything brute force can reach. Below 40 bits a password is weak against an offline attack on a leaked hash; 60 to 80 bits is reasonable for ordinary accounts; above 100 bits is appropriate for password-manager master passwords, disk encryption and recovery keys.</p>
<p>The figure shown here is calculated from the actual generation parameters — alphabet size and length, or word-list size and word count — not from a heuristic that guesses at a password you typed. That makes it honest, and it also explains why a long passphrase of common words can be stronger than a short string of symbols.</p>

<h2>Passphrases versus random characters</h2>
<p>Random characters give the most entropy per keystroke and are ideal for anything stored in a password manager, where you never type it. Passphrases — several unrelated words joined by a separator — are far easier to read from a screen, type on a phone keyboard, or dictate over the phone. Five words from the built-in list of nearly two hundred common words, plus a four-digit number, land comfortably in strong territory while remaining typeable. Use a passphrase for your device login and your password-manager master password; use random characters for everything the manager fills in for you.</p>

<h2>Practical security advice</h2>
<ul>
  <li>Never reuse a password. Credential-stuffing attacks rely entirely on reuse, and a breach at one site then compromises all the others.</li>
  <li>Use a password manager. It is the only realistic way to keep dozens of unique, long passwords.</li>
  <li>Turn on two-factor authentication wherever it is offered; it protects you even if a password leaks.</li>
  <li>Enable the exclude-ambiguous option when a password must be read aloud, written down or typed from a screen — it removes characters such as O, 0, l, 1 and the pipe.</li>
  <li>Change a password immediately when a service reports a breach, and check whether you reused it anywhere.</li>
  <li>Length beats complexity. A 24-character lowercase passphrase is stronger than an eight-character string full of symbols.</li>
</ul>

<h2>Troubleshooting</h2>
<p>Some sites still cap password length or ban symbols. Reduce the length and deselect the symbol set rather than inventing your own variation, and note the restriction in your manager. If a site rejects a pasted password, generate a passphrase instead — it is realistic to type. If the generator reports that no character types are selected, re-enable at least one set.</p>

<h2>Privacy</h2>
<p>Nothing is transmitted, nothing is stored, and nothing is remembered between page loads. Reloading the page discards the generated value entirely, so copy it into your manager before you navigate away.</p>
""",
    "faq": [
        ("How random are these passwords?", "They come from crypto.getRandomValues(), the browser's cryptographically secure random number generator, which draws from the operating system's entropy pool. Math.random() is never used anywhere in this tool."),
        ("Is my password sent to a server?", "No. It is generated and displayed entirely in your browser. Kitbox has no backend that could receive it, and nothing is written to storage or logs."),
        ("How long should my password be?", "Sixteen characters is a sensible minimum for ordinary accounts and twenty or more for anything valuable. For master passwords and recovery keys, aim for an entropy figure above 100 bits."),
        ("What is a passphrase and when should I use one?", "A passphrase is several unrelated words joined by a separator. Use one whenever you have to type the password by hand — a device login, a disk password, or your password manager's master password."),
        ("What does excluding ambiguous characters do?", "It removes characters that are easily confused in print, such as capital O and zero, lowercase l and the digit one, and the pipe. It slightly lowers entropy but prevents transcription errors."),
        ("Does Kitbox remember generated passwords?", "No. Nothing is saved. Reloading or closing the page discards the value, so copy it into your password manager before leaving."),
    ],
}

EN["word-counter"] = {
    "name": "Word Counter",
    "title": "Word Counter — Words, Characters & Reading Time | Kitbox",
    "desc": "Count words, characters, sentences and paragraphs live, with reading time, speaking time and keyword density. Handles Arabic text correctly. Nothing leaves your browser.",
    "h1": "Count words and characters as you type",
    "benefit": "Live statistics for essays, articles, social posts and scripts — including reading time, speaking time and keyword density, with proper support for Arabic script.",
    "card": "Live word, character and sentence counts plus keyword density.",
    "howto": [
        "Type directly into the text area or paste text from any document.",
        "Watch the statistics update instantly — nothing is submitted and there is no button to press.",
        "Scroll to the keyword density table to see your ten most frequent meaningful terms.",
        "Copy the text back out or clear the field when you are done.",
    ],
    "article": """
<h2>What each statistic means</h2>
<p>Words are counted as runs of letters, digits and internal apostrophes, which means a hyphenated compound counts as one word and a contraction is not split in two. Characters include every space and line break, matching the limits imposed by social networks and SMS. Characters without spaces is the figure most translation agencies and typesetters use for pricing. Sentences are detected at full stops, question marks, exclamation marks, Arabic question marks and ellipses, with line breaks also closing a sentence. Paragraphs are blocks separated by a blank line, which is how word processors and Markdown both behave.</p>
<p>Reading time assumes 225 words per minute, a widely used average for silent reading of general prose. Speaking time assumes 140 words per minute, close to a measured pace for presentations and voice-overs. Both are estimates: technical material reads slower, and an energetic podcast host speaks faster.</p>

<h2>Arabic and other scripts</h2>
<p>Many counters are written for English and quietly mis-handle anything else. Arabic words are delimited by spaces like Latin ones, but the letters live in different Unicode ranges, and naive regular expressions based on A–Z simply drop them. The matcher used here explicitly covers Arabic, Arabic Supplement, Arabic Extended-A and Arabic Presentation Forms alongside Latin and Latin Extended, so an Arabic paragraph is counted accurately. Characters are counted by Unicode code point rather than by UTF-16 code unit, which also keeps emoji and other astral-plane characters from counting twice.</p>

<h2>Keyword density, used responsibly</h2>
<p>The table lists your ten most frequent terms with their count and their share of the total. Common function words in both English and Arabic are filtered out, as are terms shorter than three characters, so what remains is a reasonable picture of what the text is actually about. This is a diagnostic, not a target. Search engines stopped rewarding keyword repetition well over a decade ago, and deliberately pushing a term to a particular percentage is a reliable way to make writing worse. Use it instead to notice an unintentional tic — the same adjective four times in a short paragraph — or to confirm that an article about PDF merging actually mentions merging more than once.</p>

<h2>Where word counts matter</h2>
<ul>
  <li>Academic work with strict limits, where exceeding the count costs marks.</li>
  <li>Meta descriptions and titles, which are measured in characters rather than words.</li>
  <li>Social posts: X, LinkedIn and Instagram all enforce character ceilings.</li>
  <li>Scripts and presentations, where speaking time decides whether you fit the slot.</li>
  <li>Freelance writing and translation, where payment is per word or per character.</li>
</ul>

<h2>Tips</h2>
<p>Paste plain text where possible; formatting is ignored but invisible characters from some editors can affect counts. If you are writing to a limit, aim for 5% under it so a later edit does not push you over. For speaking time, read a paragraph aloud and compare with the estimate to calibrate your own pace. If you need to change the capitalisation of the text afterwards, the <a href="/case-converter/">case converter</a> handles that in one click.</p>

<h2>Privacy</h2>
<p>Drafts, legal text, medical notes and unpublished writing are exactly the material people paste into online counters without thinking. Here the text stays in the text area; there is no form submission, no autosave and no analytics on what you typed.</p>
""",
    "faq": [
        ("Is my text sent anywhere?", "No. Everything is computed in your browser as you type. There is no form submission, no autosave, and nothing is stored after you close the tab."),
        ("Does it count Arabic text correctly?", "Yes. The word matcher explicitly covers the Arabic Unicode ranges, and characters are counted by code point, so Arabic, Latin, digits and emoji are all handled properly."),
        ("How is reading time calculated?", "Words divided by 225 per minute for silent reading, and by 140 per minute for speaking. These are averages for general prose; dense technical writing is slower."),
        ("What counts as a sentence?", "Text ending in a full stop, question mark, exclamation mark, Arabic question mark or ellipsis, as well as text ending at a line break. Abbreviations containing full stops can occasionally inflate the figure."),
        ("Why are short words missing from the keyword table?", "Words under three characters and common function words in English and Arabic are filtered out so the table reflects meaningful terms rather than articles and prepositions."),
        ("Is there a text length limit?", "No fixed limit. The calculation is fast enough for long documents; extremely large texts depend on your device's available memory."),
    ],
}

EN["case-converter"] = {
    "name": "Case Converter",
    "title": "Case Converter — Title, camelCase, snake_case | Kitbox",
    "desc": "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case or aLtErNaTiNg. Copy or download instantly.",
    "h1": "Convert text between nine letter cases",
    "benefit": "Fix shouting headlines, build code identifiers and generate URL slugs in one click, with an undo button so experiments are never costly.",
    "card": "Nine case styles including camelCase, snake_case and kebab-case.",
    "howto": [
        "Type or paste your text into the editor.",
        "Press one of the nine case buttons. The text is transformed in place.",
        "Use Undo to step back through previous versions if a conversion was not what you wanted.",
        "Copy the result or download it as a plain .txt file.",
    ],
    "article": """
<h2>The nine cases and where each belongs</h2>
<p><strong>UPPERCASE</strong> is for constants, short labels and abbreviations; a full paragraph in capitals is slower to read because the familiar word shape disappears. <strong>lowercase</strong> normalises text that arrived shouting, and is the safe form for email addresses and URLs. <strong>Title Case</strong> capitalises significant words while leaving short articles, conjunctions and prepositions alone — the convention used by most English publications for headlines. <strong>Sentence case</strong> capitalises the first letter after each terminator and is increasingly preferred for user-interface labels and headings because it reads more naturally.</p>
<p>The programming cases follow naming conventions. <strong>camelCase</strong> is standard for JavaScript and Java variables. <strong>PascalCase</strong> names classes, components and types. <strong>snake_case</strong> is the Python and SQL convention and the usual choice for database columns. <strong>kebab-case</strong> is what URLs, CSS classes and HTML attributes want, which makes it the fastest way to turn an article title into a slug. <strong>aLtErNaTiNg</strong> has no technical use; it exists for the internet's favourite sarcastic typography.</p>

<h2>How the conversion works</h2>
<p>Title and sentence case operate on words and punctuation. The programming cases first split your text into tokens, breaking at every non-alphanumeric character and also at the boundary between a lowercase letter and an uppercase one — so <code>parseHTMLDocument</code> and <code>parse html document</code> both tokenise correctly. Those tokens are then rejoined with the right separator and capitalisation. Alternating case skips whitespace when alternating, so the rhythm is not broken by spaces.</p>
<p>Everything happens on the string in the text area. There is no request, no round trip and no character limit imposed by a server.</p>

<h2>Everyday uses</h2>
<ul>
  <li>Turning a headline into a URL slug for a blog post or a documentation page.</li>
  <li>Normalising a spreadsheet column that someone typed entirely in capitals.</li>
  <li>Converting a list of labels into variable names when scaffolding code.</li>
  <li>Fixing the caps-lock accident in a long comment without retyping it.</li>
  <li>Preparing consistent headings before importing content into a CMS.</li>
</ul>

<h2>Things to watch for</h2>
<p>Automatic title case cannot know your proper nouns. Convert first, then correct names, brands and acronyms by hand — <em>iPhone</em>, <em>eBay</em> and <em>NASA</em> will all be normalised by any rule-based converter. Sentence case relies on punctuation, so a paragraph without full stops will only get one capital letter. The programming cases discard punctuation entirely, which is correct for identifiers but destructive if you feed them whole sentences; the undo button exists for exactly that moment.</p>
<p>Arabic, Hebrew, Chinese and Japanese have no concept of letter case. Those characters pass through the case buttons unchanged, which is the correct behaviour. Tokenisation for the programming cases still handles Arabic words, so you can produce a transliterated-looking identifier structure, but the result will not be valid in most languages.</p>

<h2>Tips</h2>
<p>Work on a copy of important text, since conversions are destructive even with undo available. For slugs, run kebab-case and then check for double hyphens or trailing punctuation. If you also need to know how long the result is, the <a href="/word-counter/">word counter</a> gives you words, characters and reading time. Download as .txt when you need a clean, encoding-safe file rather than a clipboard paste.</p>

<h2>Privacy</h2>
<p>Text pasted into online converters frequently contains customer names, internal project titles or unpublished copy. None of that is transmitted here: the conversion is a few lines of JavaScript operating on a string in your own browser.</p>
""",
    "faq": [
        ("What is the difference between Title Case and Sentence case?", "Title Case capitalises every significant word and leaves short articles and prepositions lowercase, as English headlines do. Sentence case capitalises only the first word of each sentence, which reads more naturally in interfaces."),
        ("Which case should I use for a URL slug?", "kebab-case. Lowercase words joined by hyphens is the convention search engines and web servers expect, and it avoids encoding problems with spaces and capitals."),
        ("Can I undo a conversion?", "Yes. Every conversion is pushed onto a history stack and the Undo button steps back through up to thirty previous versions during the current session."),
        ("Does it work with Arabic text?", "Arabic has no upper and lower case, so those buttons leave the text unchanged — which is correct. The word-splitting used by camelCase and snake_case does recognise Arabic words."),
        ("Is there a length limit?", "No. The whole conversion runs locally, so the only limit is how much text your browser can comfortably hold in a text area."),
        ("Is my text uploaded?", "No. Nothing is sent anywhere. The text exists only in your browser tab and is discarded when you close or reload the page."),
    ],
}

EN["json-formatter"] = {
    "name": "JSON Formatter",
    "title": "JSON Formatter & Validator — Pretty Print | Kitbox",
    "desc": "Validate, pretty-print and minify JSON with precise line and column errors and a collapsible tree view. Large payloads stay responsive and nothing is uploaded.",
    "h1": "Format, validate and explore JSON locally",
    "benefit": "Turn an unreadable one-line API response into indented, browsable JSON — with error positions that actually tell you where the problem is.",
    "card": "Validate, pretty-print, minify and browse JSON as a tree.",
    "howto": [
        "Paste your JSON into the editor.",
        "Press Validate to check it, Format to pretty-print with your chosen indentation, or Minify to strip whitespace.",
        "Explore the collapsible tree below the editor to understand the structure.",
        "Copy the result or download it as a .json file.",
    ],
    "article": """
<h2>Why formatting matters</h2>
<p>JSON that comes out of an API is usually minified: one line, no spaces, thousands of characters. That is correct for transmission and useless for reading. Pretty-printing adds indentation and line breaks so nesting becomes visible, which turns a debugging session from guesswork into inspection. Minifying does the reverse, and is worth doing before you embed a configuration blob in a page or a build artefact, where every byte is downloaded by every visitor.</p>
<p>Both directions here use the browser's own JSON parser and serialiser. That means the validation is exactly the validation your code will experience — not an approximation by a third-party grammar — and it is fast enough for payloads of several megabytes.</p>

<h2>Finding errors quickly</h2>
<p>A parse failure reports a character offset, which is not much help in a 40,000-character string. This tool converts that offset into a line and column, shows the parser's own message, and selects the offending character in the editor so you can see it in context. The four mistakes that cause most failures are a trailing comma after the last item, single quotes instead of double quotes, unquoted object keys, and an unescaped control character or backslash inside a string. JSON also forbids comments, which surprises people coming from JavaScript or YAML.</p>

<h2>The tree view</h2>
<p>Below the editor, valid JSON is rendered as a collapsible tree. Objects and arrays become expandable nodes labelled with their item count, and leaf values are colour-coded by type: strings, numbers, booleans and null are each distinct. This is the fastest way to answer structural questions — is <code>items</code> an array of objects or an object keyed by id? — without scrolling through indented text. To keep very large documents responsive, the tree stops expanding after a few thousand nodes and says so; the formatted text above always remains complete.</p>

<h2>Practical tips</h2>
<ul>
  <li>Two-space indentation is the common default for JavaScript ecosystems; four spaces suits deeply nested configuration; tabs respect whoever reads the file next.</li>
  <li>Validate before you commit a configuration file. A single missing brace can break a deployment.</li>
  <li>Minify JSON that ships to browsers, and leave it formatted in your repository where diffs are read by humans.</li>
  <li>If a response contains credentials or personal data, a local tool is the only acceptable place to inspect it.</li>
  <li>Use the tree to confirm array lengths before writing a loop against unfamiliar data.</li>
</ul>

<h2>Limitations</h2>
<p>This is a strict JSON tool, not a JSON5 or YAML tool: comments, trailing commas and unquoted keys are errors, by design, because that is what every standards-compliant parser will tell you too. Very large numbers lose precision beyond 2^53, which is a property of JSON and JavaScript rather than of this page. Key order is preserved for objects as the parser returns them, but JSON does not formally guarantee order, so do not rely on it in your own code.</p>

<h2>Privacy</h2>
<p>API responses routinely contain access tokens, customer records and internal identifiers. Pasting them into a hosted formatter means sending that data to someone else's server. Everything on this page runs in your browser: no request is made, nothing is logged, and closing the tab removes every trace.</p>
""",
    "faq": [
        ("Is my JSON uploaded to a server?", "No. Parsing, formatting, minifying and the tree view all run in your browser using its built-in JSON engine. Nothing is transmitted or stored."),
        ("Why does my JSON fail to validate?", "The most common causes are a trailing comma, single quotes instead of double quotes, unquoted keys, and comments — which JSON does not allow. The error message gives the exact line and column."),
        ("Can it handle large files?", "Yes. Several megabytes parse and format quickly. The tree view truncates after a few thousand nodes to keep scrolling smooth, while the formatted text stays complete."),
        ("What indentation should I choose?", "Two spaces is the usual default in JavaScript projects, four spaces suits deeply nested configuration files, and tabs let each reader set their own width."),
        ("Does it support JSON5, comments or trailing commas?", "No, and that is deliberate. The tool validates strict JSON so that what passes here will also pass in any standards-compliant parser."),
        ("Can I download the result?", "Yes. Copy it to the clipboard or download it as a .json file generated in your browser."),
    ],
}

EN["lorem-ipsum-generator"] = {
    "name": "Lorem Ipsum Generator",
    "title": "Lorem Ipsum Generator — Placeholder Text | Kitbox",
    "desc": "Generate placeholder text by paragraphs, sentences or words, with optional HTML paragraph tags. Fast, private and free, with an Arabic placeholder option too.",
    "h1": "Generate placeholder text for your layouts",
    "benefit": "Fill a mockup with convincing dummy copy in seconds — paragraphs, sentences or an exact word count, wrapped in HTML tags if your template needs them.",
    "card": "Dummy paragraphs, sentences or words, with optional HTML wrapping.",
    "howto": [
        "Choose whether to generate paragraphs, sentences or a specific number of words.",
        "Set the amount, and decide whether the text should open with the classic Lorem ipsum phrase.",
        "Enable HTML wrapping if you want each paragraph surrounded by p tags.",
        "Press Generate, then copy the text or download it as a .txt file.",
    ],
    "article": """
<h2>Why designers use nonsense text</h2>
<p>Placeholder copy has been part of typesetting since the sixteenth century, when a printer scrambled a passage of Cicero's <em>De finibus bonorum et malorum</em> to make a type specimen. The point is the same today: text that cannot be read does not compete for attention, so a client reviewing a layout comments on hierarchy, rhythm and spacing rather than on the wording. Fill a mockup with the real marketing copy and the conversation turns into a copy-editing meeting before the design has been agreed.</p>
<p>Lorem ipsum also has roughly the letter distribution and word length of English, so line breaks, hyphenation and the grey texture of a paragraph look realistic — something a repeated sentence or a block of X characters cannot achieve.</p>

<h2>Paragraphs, sentences or words</h2>
<p>Generate paragraphs when you are filling an article template or a long content block; each one here contains three to six sentences of varying length, which keeps the page from looking mechanically uniform. Generate sentences when you need a specific run of text for a card, a tooltip or a summary field. Generate a word count when a component has a hard limit — a meta description, a push notification, a product title — and you want to see exactly how 25 words behave in that space.</p>
<p>The HTML wrapping option surrounds each paragraph with <code>&lt;p&gt;</code> tags, which saves a step when you are pasting directly into a template, an email builder or a CMS source view.</p>

<h2>Arabic placeholder text</h2>
<p>Latin placeholder text is actively misleading in an Arabic layout. The script runs right to left, letters join and change shape by position, ascenders and descenders behave differently, and comfortable line height is not the same as for Latin. A design that looks balanced with Lorem ipsum can fall apart the moment real Arabic arrives. The Arabic version of this page therefore offers genuine Arabic filler text so you can judge line length, leading and alignment against the script you will actually ship.</p>

<h2>Best practices</h2>
<ul>
  <li>Replace every piece of placeholder text before launch. Lorem ipsum shipping to production is a genuinely common and embarrassing bug.</li>
  <li>Match the quantity to reality. If articles will be 800 words, do not design against 80.</li>
  <li>Test the extremes too: an empty state, a one-word heading and a heading that wraps to three lines.</li>
  <li>Never use placeholder text on a page that search engines can index — duplicated nonsense is a quality signal in the wrong direction.</li>
  <li>For final typography decisions, switch to real copy as soon as any exists.</li>
</ul>

<h2>Troubleshooting</h2>
<p>If the text looks repetitive, generate fewer, longer blocks: the word pool is finite, and a large request naturally reuses words. If your template escapes HTML, turn off the paragraph-tag option and wrap the text yourself. If you need the text in a file rather than the clipboard, the download button produces a UTF-8 .txt that opens correctly in any editor, including with Arabic content.</p>

<h2>Privacy</h2>
<p>Nothing about this tool needs a network connection beyond loading the page. Text is produced locally with the browser's cryptographic random source, and nothing you generate is recorded.</p>
""",
    "faq": [
        ("What is Lorem ipsum?", "A scrambled passage of Latin from Cicero, used by printers and designers since the 1500s as placeholder text. It looks like natural language without being readable, so reviewers focus on layout."),
        ("Can I generate an exact number of words?", "Yes. Choose the words unit and enter the count. This is useful for testing fields with hard limits, such as meta descriptions or product titles."),
        ("What does the HTML option do?", "It wraps each paragraph in p tags so the output can be pasted straight into a template, email builder or CMS source editor."),
        ("Is Arabic placeholder text available?", "Yes, on the Arabic version of this page. Latin text is misleading for right-to-left layouts, so real Arabic filler gives a far more accurate preview of line height and alignment."),
        ("Is placeholder text bad for SEO?", "Yes, if it reaches a public page. Search engines see duplicated meaningless content, and visitors see an unfinished site. Always replace it before publishing."),
        ("Is anything sent to a server?", "No. The text is assembled in your browser from an embedded word list, with no network request and no logging."),
    ],
}
