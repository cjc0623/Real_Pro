const fs = require("fs");
const files = fs.readFileSync(".understand-anything/tmp/uaset_final.txt", "utf8")
  .split("\n").map(s => s.trim()).filter(Boolean);
const batchFiles = files.map(p => {
  const ext = p.split(".").pop().toLowerCase();
  const language = ext === "java" ? "java" : (ext === "jsx" || ext === "js") ? "javascript" : "unknown";
  const sizeLines = fs.readFileSync(p, "utf8").split("\n").length;
  return { path: p, language, sizeLines, fileCategory: "code" };
});
const out = { projectRoot: process.cwd().split("\\").join("/"), batchFiles, batchImportData: {} };
fs.writeFileSync(".understand-anything/tmp/struct-input.json", JSON.stringify(out, null, 2));
console.log("batchFiles:", batchFiles.length);
