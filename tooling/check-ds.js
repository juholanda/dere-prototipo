#!/usr/bin/env node
/*
  tooling/check-ds.js — guarda o design-system-first do protótipo a-DeRE.

  POR QUE existe: componente compartilhado (ex.: o título do cabeçalho de card) tem
  que morar SÓ no ds.css. Quando uma tela redeclara o mesmo seletor no <style> local,
  ele diverge — foi o que aconteceu com `.card__h h2`: 700!important no ds, mas telas
  locais sem !important renderizavam 600 (a base h1..h6{font-weight:600!important} captura).
  Este guard FALHA o build se isso reaparecer.

  O QUE checa (só dentro de <style>, nunca em JS/markup):
   1. Seletores DONOS DO DS não podem ser redeclarados localmente (lista PROTECTED).
   2. var(--token) usado numa página tem que existir no ds.css.
   3. font-family hardcoded (fora de var()/inherit) é proibida.

  Uso: node tooling/check-ds.js   (sai !=0 se houver problema)
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DS = fs.readFileSync(path.join(ROOT, 'design-system', 'ds.css'), 'utf8');

// Seletores que são IDENTIDADE de componente do DS: moram só no ds.css.
// (O container .card__h fica de fora de propósito: cada tela define seu padding/divisória
//  de contexto — lista vs. banda. É o TÍTULO/hint/ferramentas que não podem divergir.)
const PROTECTED = ['.card__h h2', '.card__hint', '.card__h-tools',
  '.ldsteps', '.ldstep', '.ldstep__ic', '.ldstep__dot', '.ldspin', '.ldproc', '.ldprocbar'];

// tokens --x definidos no ds.css
const defined = new Set();
for (const m of DS.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(m[1]);

// telas fora do escopo do guard: email.html é o MOCKUP estilo Gmail (paleta --g-* e
// fontes Google próprias, de propósito) — não é tela do nosso DS.
const SKIP = new Set(['v4/email.html']);

// páginas do app + vitrine
const pages = [path.join(ROOT, 'index.html'), path.join(ROOT, 'design-system', 'index.html')]
  .concat(fs.readdirSync(path.join(ROOT, 'v4')).filter(f => f.endsWith('.html')).map(f => path.join(ROOT, 'v4', f)))
  .filter(fs.existsSync);

const problems = [];

for (const file of pages) {
  const rel = path.relative(ROOT, file);
  if (SKIP.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  // só o conteúdo dentro de <style>...</style> (ignora JS e markup)
  const styles = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
  if (!styles) continue;

  // tokens definidos LOCALMENTE nesta página também contam (ex.: :root próprio)
  const localDefs = new Set();
  for (const m of styles.matchAll(/(--[a-z0-9-]+)\s*:/gi)) localDefs.add(m[1]);

  // 1) redeclaração de seletor do DS
  for (const sel of PROTECTED) {
    const re = new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
    if (re.test(styles)) {
      problems.push(`${rel}: redeclara "${sel}" no <style> local — esse seletor é do ds.css (fonte única). Remova o override.`);
    }
  }

  // 2) var(--token) inexistente (nem no ds.css nem definido localmente)
  for (const m of styles.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    if (!defined.has(m[1]) && !localDefs.has(m[1])) problems.push(`${rel}: usa var(${m[1]}) que não existe no ds.css nem localmente.`);
  }

  // 3) font-family hardcoded (permite stack de sistema monospace p/ código)
  for (const m of styles.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
    const val = m[1].trim();
    if (!/var\(|inherit|monospace/.test(val)) problems.push(`${rel}: font-family hardcoded ("${val}") — use var(--font-*).`);
  }
}

if (problems.length) {
  console.log('check-ds FALHOU (' + problems.length + '):');
  [...new Set(problems)].forEach(p => console.log('  - ' + p));
  process.exit(1);
}
console.log('check-ds OK — ' + pages.length + ' páginas, 0 seletor do DS redeclarado, 0 token inexistente, 0 fonte hardcoded.');
