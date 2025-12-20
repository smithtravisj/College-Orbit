import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '../app/api');

function findRouteFiles(dir, skipPaths = []) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(apiDir, fullPath);

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

    const lines = content.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const exportMatch = line.match(/^(\s*)export async function (GET|POST|PATCH|DELETE)/);

      if (exportMatch) {
        const indent = exportMatch[1];
        const method = exportMatch[2];

        // Replace this line's function declaration
        const newLine = line.replace(
          /export async function (GET|POST|PATCH|DELETE)/,
          `export const ${method} = withRateLimit(async function`
        );
        result.push(newLine);

        i++;

        // Now find the opening brace and count braces to find the closing brace
        let braceCount = (newLine.match(/{/g) || []).length - (newLine.match(/}/g) || []).length;
        const functionStartIndex = result.length - 1;

        // Keep adding lines until we find the closing brace
        while (i < lines.length && braceCount > 0) {
          const currentLine = lines[i];
          const openCount = (currentLine.match(/{/g) || []).length;
          const closeCount = (currentLine.match(/}/g) || []).length;

          braceCount += openCount - closeCount;

          if (braceCount === 0) {
            // This is the line with the closing brace
            // Replace the final } with });
            let closingBraceLine = currentLine;
            if (currentLine.match(/^\s*}\s*$/)) {
              // Match any line that is just whitespace and a closing brace
              closingBraceLine = currentLine.replace(/}/, '});');
            }
            result.push(closingBraceLine);
          } else {
            result.push(currentLine);
          }

          i++;
        }
      } else {
        result.push(line);
        i++;
      }
    }

    content = result.join('\n');

    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ Updated: ${path.relative(apiDir, file)}`);
  } catch (error) {
    console.error(`✗ Error processing ${path.relative(apiDir, file)}:`, error.message);
  }
}

console.log(`\nProcessed ${routeFiles.length} route files`);
