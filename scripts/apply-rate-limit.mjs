import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '../app/api');

// Recursively find all route.ts files
function findRouteFiles(dir, skipPaths = []) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(apiDir, fullPath);

    // Skip auth, migrate, and already processed files
    if (skipPaths.some(skip => relPath.includes(skip))) {
      continue;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(findRouteFiles(fullPath, skipPaths));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

const routeFiles = findRouteFiles(apiDir, ['auth', 'migrate']);

for (const file of routeFiles) {
  try {
    let content = fs.readFileSync(file, 'utf-8');

    // Skip if already has withRateLimit
    if (content.includes('withRateLimit')) {
      console.log(`✓ Already processed: ${path.relative(apiDir, file)}`);
      continue;
    }

    // Find the position of the last import statement
    const importMatches = [...content.matchAll(/^import .+ from .+;$/gm)];
    if (importMatches.length === 0) {
      console.log(`⚠ No imports found in: ${path.relative(apiDir, file)}`);
      continue;
    }

    const lastImport = importMatches[importMatches.length - 1];
    const insertPos = lastImport.index + lastImport[0].length;

    // Add withRateLimit import
    content =
      content.slice(0, insertPos) +
      "\nimport { withRateLimit } from '@/lib/withRateLimit';" +
      content.slice(insertPos);

    // Wrap export functions
    // Pattern: export async function (GET|POST|PATCH|DELETE)(
    content = content.replace(
      /export async function (GET|POST|PATCH|DELETE)\(/g,
      'export const $1 = withRateLimit(async function('
    );

    // Replace closing braces of handler functions with });
    // This is tricky - we need to find the right closing brace
    // Let's do this by looking for the pattern: }\\n(\\n|// or export)
    const lines = content.split('\n');
    const processed = [];
    let inHandler = false;
    let handlerDepth = 0;
    let bracesAtStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a handler function start
      if (line.includes('export const') &&
          line.includes('= withRateLimit(async function(')) {
        inHandler = true;
        handlerDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        bracesAtStart = handlerDepth;
        processed.push(line);
        continue;
      }

      if (inHandler) {
        // Count braces
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        handlerDepth += openBraces - closeBraces;

        // If this line will close the handler, mark it
        if (handlerDepth <= 0 && closeBraces > 0) {
          // This is the closing brace - replace } with });
          processed.push(line.replace(/}\s*$/, '});'));
          inHandler = false;
          handlerDepth = 0;
        } else {
          processed.push(line);
        }
      } else {
        processed.push(line);
      }
    }

    content = processed.join('\n');

    // Write back
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ Updated: ${path.relative(apiDir, file)}`);
  } catch (error) {
    console.error(`✗ Error processing ${path.relative(apiDir, file)}:`, error.message);
  }
}

console.log(`\nProcessed ${routeFiles.length} route files`);
