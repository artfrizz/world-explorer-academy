import { readFile, writeFile } from 'node:fs/promises'
const html = await readFile('single-dist/index.html', 'utf8')
if (/<(?:script|link)[^>]+(?:src|href)=["'](?:https?:|\/\/|\.\/assets\/)/i.test(html)) throw new Error('Standalone HTML references an external asset')
await writeFile('world-explorer-academy.html', html)
console.log('Created world-explorer-academy.html (self-contained)')
