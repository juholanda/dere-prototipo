#!/usr/bin/env node
/*
  tooling/build-proto.js — build seguro e repetível do protótipo a-DeRE.

  O QUE FAZ (idempotente: pode rodar quantas vezes quiser):
   1. Gate de senha (dere123): garante o bloco #dere-gate logo após <body> em
      TODA página do app (index.html da raiz + v4/*.html). Injeta só se faltar.
   2. Cache-bust do ds.css: usa o HASH do conteúdo do ds.css como versão, então
      o ?v= só muda quando o ds.css realmente muda (nada de números soltos).
   3. Grava a versão em version.json (fonte única).
   4. Valida: nenhuma página do app pode ficar sem gate; avisa se a vitrine
      (design-system/index.html) estiver sem gate.

  O QUE NÃO FAZ (de propósito): não roda git, não faz push, não toca em NADA
  fora deste repo. Deploy = rode este build, confira, e aí sim commite/pushe.
  Uso: node tooling/build-proto.js
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const GATE = fs.readFileSync(path.join(__dirname, 'gate.html'), 'utf8').trim();

// versão = hash curto do ds.css (cache-bust estável, muda só quando o ds muda)
const dsPath = path.join(ROOT, 'design-system', 'ds.css');
const ver = crypto.createHash('sha1').update(fs.readFileSync(dsPath)).digest('hex').slice(0, 8);

// páginas que o build gerencia: index.html da raiz + a vitrine + tudo em v4/
const appPages = [path.join(ROOT, 'index.html'), path.join(ROOT, 'design-system', 'index.html')]
  .concat(fs.readdirSync(path.join(ROOT, 'v4'))
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(ROOT, 'v4', f)))
  .filter(fs.existsSync);

let injected = 0, rebusted = 0;
const problems = [];

for (const file of appPages) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  const rel = path.relative(ROOT, file);

  // 1) gate: injeta logo após <body> se ainda não tiver
  if (!/id="dere-gate"/.test(src)) {
    if (/<body[^>]*>/.test(src)) {
      src = src.replace(/(<body[^>]*>)/, '$1\n' + GATE);
      injected++;
    } else {
      problems.push(rel + ': sem <body>, não deu pra injetar o gate');
    }
  }

  // 2) cache-bust do ds.css pela versão (hash): versionados e não-versionados
  const versioned = src.replace(/ds\.css\?v=[^"'\s]*/g, 'ds.css?v=' + ver);
  const rebustSrc = versioned.replace(/ds\.css(["'])/g, 'ds.css?v=' + ver + '$1');
  if (rebustSrc !== src) { src = rebustSrc; rebusted++; }

  if (src !== before) fs.writeFileSync(file, src);
}

// 3) versão em version.json (fonte única)
fs.writeFileSync(path.join(ROOT, 'version.json'), JSON.stringify({ v: ver }) + '\n');

// 4) validação
for (const file of appPages) {
  if (!/id="dere-gate"/.test(fs.readFileSync(file, 'utf8'))) {
    problems.push(path.relative(ROOT, file) + ': SEM GATE após o build');
  }
}
console.log('build-proto — versão (hash do ds.css): ' + ver);
console.log('  ' + appPages.length + ' páginas (app + vitrine) · gate injetado em ' + injected + ' · ds.css re-versionado em ' + rebusted);
if (problems.length) {
  console.log('\nPROBLEMAS (build falhou):');
  problems.forEach(p => console.log('  - ' + p));
  process.exit(1);
}
console.log('OK — app inteiro gated e versionado. git/commit/push é passo separado e manual.');
