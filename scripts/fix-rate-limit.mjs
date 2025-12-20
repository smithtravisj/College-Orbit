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

    // Step 1: Add import
    const lastImportIdx = content.lastIndexOf('\nimport ');
    const lastImportEnd = content.indexOf('\n', lastImportIdx + 1);
    content = content.slice(0, lastImportEnd) +
              "\nimport { withRateLimit } from '@/lib/withRateLimit';" +
              content.slice(lastImportEnd);

    // Step 2: Wrap each handler
    const handlers = ['GET', 'POST', 'PATCH', 'DELETE'];
    for (const handler of handlers) {
      // Match: export async function HANDLER(...) {
      // Replace with: export const HANDLER = withRateLimit(async function(...) {
      const pattern = new RegExp(
        `export async function ${handler}\\(([^)]*)\\)\\s*\\{`,
        'g'
      );

      content = content.replace(pattern, (match, params) => {
        return `export const ${handler} = withRateLimit(async function(${params}) {`;
      });
    }

    // Step 3: Find and wrap closing braces
    // Look for pattern: } catch (error) { ... } followed by next export/EOF
    // and replace the final } with });
    const lines = content.split('\n');
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      result.push(line);

      // If this line contains } catch (error) {, find the matching closing brace
      if (line.includes('} catch (error) {')) {
        let braceCount = 1; // We're in one level already
        let j = i + 1;

        while (j < lines.length && braceCount > 0) {
          const currentLine = lines[j];
          const openCount = (currentLine.match(/{/g) || []).length;
          const closeCount = (currentLine.match(/}/g) || []).length;
          braceCount += openCount - closeCount;

          if (braceCount === 0) {
            // This is the line with the final closing brace
            result.push(currentLine.replace(/}\s*$/, '});'));
            i = j; // Skip ahead
          } else {
            result.push(currentLine);
          }
          j++;
        }
      }
    }

    content = result.join('\n');
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ Updated: ${relPath}`);
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
}

console.log(`\nProcessed ${routeFiles.length} route files`);
