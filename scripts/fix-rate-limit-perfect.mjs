import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.join(__dirname, '../app/api');

function findRouteFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (item === 'auth' || item === 'migrate') continue;
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(findRouteFiles(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const routeFiles = findRouteFiles(apiDir);

for (const file of routeFiles) {
  try {
    let content = fs.readFileSync(file, 'utf-8');

    if (content.includes('withRateLimit')) {
      console.log(`✓ Already processed: ${path.relative(apiDir, file)}`);
      continue;
    }

    const relPath = path.relative(apiDir, file);

    // Step 1: Add import after last import
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import .+ from .+;$/)) {
        lastImportIdx = i;
      }
    }

    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, "import { withRateLimit } from '@/lib/withRateLimit';");
    }

    // Step 2: Wrap each handler function
    const output = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is a handler export
      const match = line.match(/^(\s*)export async function (GET|POST|PATCH|DELETE)\(([^)]*)(\)\s*{)/);
      if (match) {
        const [, indent, method, params] = match;
        // Replace with wrapped version
        output.push(`${indent}export const ${method} = withRateLimit(async function(${params}) {`);

        i++;
        let braceCount = 1; // We have one opening brace
        let closingLineIdx = -1;

        // Find the matching closing brace
        while (i < lines.length && braceCount > 0) {
          const currentLine = lines[i];
          const open = (currentLine.match(/{/g) || []).length;
          const close = (currentLine.match(/}/g) || []).length;
          braceCount += open - close;

          if (braceCount === 0) {
            // This is the closing brace line
            const closingLine = currentLine.replace(/}(\s*)$/, '});$1');
            output.push(closingLine);
            closingLineIdx = i;
            break;
          } else {
            output.push(currentLine);
          }

          i++;
        }
      } else {
        output.push(line);
      }
    }

    const newContent = output.join('\n');
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log(`✓ Updated: ${relPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
}

console.log(`\nProcessed ${routeFiles.length} route files`);
