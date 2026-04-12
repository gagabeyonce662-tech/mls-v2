const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const targetCorpus = path.resolve(__dirname, 'corpus');

const SOURCES = ['backend', 'frontend'];
const IGNORE = ['.git', 'node_modules', '__pycache__', '.vercel', '.next', 'dist'];

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (IGNORE.includes(path.basename(src))) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    // Only copy code files to keep snippet viewer light
    const ext = path.extname(src).toLowerCase();
    const ALLOWED_EXTS = ['.py', '.ts', '.tsx', '.css', '.json', '.js', '.md', '.html'];
    if (ALLOWED_EXTS.includes(ext)) {
      fs.copyFileSync(src, dest + '.txt');
    }
  }
}

console.log('--- Syncing Workflow Corpus ---');
if (fs.existsSync(targetCorpus)) {
    fs.rmSync(targetCorpus, { recursive: true, force: true });
}
fs.mkdirSync(targetCorpus, { recursive: true });

SOURCES.forEach(source => {
  const sourcePath = path.join(projectRoot, source);
  if (fs.existsSync(sourcePath)) {
    console.log(`Syncing ${source}...`);
    copyRecursiveSync(sourcePath, path.join(targetCorpus, source));
  }
});

console.log('--- Corpus Sync Complete ---');
