const fs = require('fs');
const path = require('path');
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.vue')) arrayOfFiles.push(path.join(dirPath, file));
    }
  });
  return arrayOfFiles;
}
const allVueFiles = getAllFiles(path.join(process.cwd(), 'src', 'components'));
allVueFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Fix mismatched quotes (double start, single end)
  content = content.replace(/from\s+"(\.\.\/\.\.\/(?:composables|utils|services|supabase)\/[^"']*?)'/g, 'from "$1"');
  // Also check if any component-to-component imports were broken the same way? The script didn't touch those using regex in that way, but just in case
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed quotes in ' + file);
  }
});

// Also fix CoinTable which had a single quote start and end issue before?
// Let's check CoinTable.vue explicitly
const coinTablePath = path.join(process.cwd(), 'src', 'components', 'coins', 'CoinTable.vue');
if (fs.existsSync(coinTablePath)) {
  let ctContent = fs.readFileSync(coinTablePath, 'utf8');
  if (ctContent.includes('from "../../utils/format.js\'')) {
    ctContent = ctContent.replace('from "../../utils/format.js\'', 'from "../../utils/format.js"');
    fs.writeFileSync(coinTablePath, ctContent, 'utf8');
    console.log('Fixed CoinTable');
  }
}
