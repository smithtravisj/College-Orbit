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

    // Now handle function wrapping line by line
    const lines = content.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Check if this is a handler function declaration
      if (line.match(/export async function (GET|POST|PATCH|DELETE)\(/)) {
        const method = line.match(/(GET|POST|PATCH|DELETE)/)[0];

        // Find where the function signature ends (the opening brace)
        let signatureEndLine = i;
        let hasOpeningBrace = line.includes('{');

        // If no opening brace on this line, look for it in the next lines
        while (!hasOpeningBrace && signatureEndLine < lines.length - 1) {
          signatureEndLine++;
          hasOpeningBrace = lines[signatureEndLine].includes('{');
        }

        // Get all lines of the function signature
        const signatureLines = lines.slice(i, signatureEndLine + 1);
        const fullSignature = signatureLines.join('\n');

        // Replace the signature
        const newSignature = fullSignature
          .replace(
            /export async function/,
            `export const ${method} = withRateLimit(async function`
          )
          .replace(/{$/, '{');

        // Add the new signature (split back into lines)
        result.push(...newSignature.split('\n'));

        // Skip the lines we've already processed
        i = signatureEndLine + 1;

        // Now find the closing brace of this function
        let functionDepth = (fullSignature.match(/{/g) || []).length;
        let closingBraceIndex = i;

        while (functionDepth > 0 && closingBraceIndex < lines.length) {
          const checkLine = lines[closingBraceIndex];
          functionDepth += (checkLine.match(/{/g) || []).length;
          functionDepth -= (checkLine.match(/}/g) || []).length;

          if (functionDepth === 0) {
            // This is the line with the final closing brace
            const closingLine = lines[closingBraceIndex];
            result.push(closingLine.replace(/}\s*$/, '});'));
            i = closingBraceIndex + 1;
            break;
          } else {
            result.push(checkLine);
            closingBraceIndex++;
          }
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
