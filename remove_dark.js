const fs = require("fs");
const path = require("path");

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".jsx")) {
      let content = fs.readFileSync(fullPath, "utf8");

      // Remove dark: classes
      content = content.replace(/\s*dark:[\w\-/\.]+/g, "");

      // Clean up multiple spaces inside className strings
      content = content.replace(
        /(class(?:Name)?={?["'`])(.*?)(\s*["'`]}?)/g,
        (match, prefix, classNames, suffix) => {
          const cleanedClasses = classNames.replace(/\s+/g, " ").trim();
          return `${prefix}${cleanedClasses}${suffix}`;
        },
      );

      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`Cleaned ${file}`);
    }
  }
}

processDir(path.join(__dirname, "public/src"));
