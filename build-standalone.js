/* Builds a single self-contained HTML file from index.html + styles.css + js/*.js.
   Usage: node build-standalone.js   ->   dist/screenshot-annotator.html */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

const jsFiles = ["state.js", "geometry.js", "render.js", "export.js", "tools.js", "ui.js", "main.js"];
let js = "";
for (const f of jsFiles) {
  js += "\n/* ===== js/" + f + " ===== */\n" + fs.readFileSync(path.join(root, "js", f), "utf8");
}
js = js.replace(/<\/script>/gi, "<\\/script>");

let out = html.replace(
  /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i,
  "<style>\n" + css + "\n</style>"
);
out = out.replace(
  /<script\s+src="js\/state\.js"><\/script>[\s\S]*?<script\s+src="js\/main\.js"><\/script>/i,
  "<script>\n" + js + "\n</script>"
);

if (out.indexOf('src="js/') !== -1 || out.indexOf('href="styles.css"') !== -1) {
  console.error("UYARI: bazı kaynaklar gomulemedi!");
}

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
const outPath = path.join(root, "dist", "screenshot-annotator.html");
fs.writeFileSync(outPath, out, "utf8");
console.log("Olusturuldu: dist/screenshot-annotator.html (" + (out.length / 1024).toFixed(1) + " KB)");
