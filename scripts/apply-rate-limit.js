const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a handler function start
      if (line.includes('export const') &&
          (line.includes('= withRateLimit(async function(') ||
           line.includes('function('))) {
        inHandler = true;
        handlerDepth = 0;
        processed.push(line);
        continue;
      }

      if (inHandler) {
        // Track braces
        handlerDepth += (line.match(/{/g) || []).length;
        handlerDepth -= (line.match(/}/g) || []).length;

        processed.push(line);

        // If we've closed the handler, add the );
        if (handlerDepth === 0 && line.trim() === '}') {
          // Replace the last line
          processed[processed.length - 1] = '});';
          inHandler = false;
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
