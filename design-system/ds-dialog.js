/* a-DeRE · Design System — comportamento de diálogo (modal e drawer)
   Fonte única para acessibilidade de qualquer overlay: prende o foco (Tab/Shift+Tab dão a volta),
   fecha no Esc, marca o resto da página como inert (leitor de tela e teclado não alcançam o fundo)
   e devolve o foco ao gatilho ao fechar. Suporta empilhar (um diálogo abre outro).

   Uso (o backdrop é o elemento de nível de body que você mostra/esconde):
     dsDialog.open(backdropEl);                         // mostra via [hidden], acha o [role=dialog] dentro
     dsDialog.open(backdropEl, {                        // controle fino
       dialog:  el,        // o container role="dialog" (default: primeiro [role=dialog] dentro do backdrop)
       focus:   el,        // o que focar ao abrir (default: primeiro focável)
       onOpen:  fn,        // como exibir (default: backdrop.hidden=false)
       onClose: fn         // como esconder (default: backdrop.hidden=true)
     });
     dsDialog.close();                                  // fecha o diálogo do topo da pilha
*/
window.dsDialog = (function () {
  var stack = [];
  var SEL = 'a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll(SEL), function (n) {
      return n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement;
    });
  }
  function onKey(e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(top.dialog);
    if (!f.length) { e.preventDefault(); top.dialog.focus(); return; }
    var first = f[0], last = f[f.length - 1], active = document.activeElement;
    if (e.shiftKey && (active === first || !top.dialog.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !top.dialog.contains(active))) { e.preventDefault(); first.focus(); }
  }
  /* marca tudo no <body> como inert, menos o backdrop do diálogo (e os diálogos já abertos abaixo dele) */
  function setInert(keep, on) {
    Array.prototype.forEach.call(document.body.children, function (c) {
      if (c === keep || (c.tagName === 'SCRIPT')) return;
      if (on) {
        if (c.hasAttribute('inert')) return;
        c.setAttribute('inert', '');
        c.setAttribute('data-dsinert', '');
      } else if (c.hasAttribute('data-dsinert')) {
        c.removeAttribute('inert');
        c.removeAttribute('data-dsinert');
      }
    });
  }
  function open(backdrop, opts) {
    opts = opts || {};
    var dialog = opts.dialog || backdrop.querySelector('[role="dialog"]') || backdrop;
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    var entry = { backdrop: backdrop, dialog: dialog, opener: document.activeElement, onClose: opts.onClose };
    if (opts.onOpen) opts.onOpen(); else backdrop.hidden = false;
    /* diálogos empilhados: reponha o inert com o novo backdrop no topo */
    setInert(backdrop, true);
    stack.push(entry);
    if (stack.length === 1) document.addEventListener('keydown', onKey, true);
    var target = opts.focus || focusables(dialog)[0] || dialog;
    if (target && target.focus) target.focus();
  }
  function close() {
    var entry = stack.pop();
    if (!entry) return;
    if (stack.length === 0) document.removeEventListener('keydown', onKey, true);
    /* se ainda há diálogo aberto embaixo, o inert volta a mirar o backdrop dele; senão, libera a página */
    var below = stack[stack.length - 1];
    setInert(below ? below.backdrop : entry.backdrop, false);
    if (below) setInert(below.backdrop, true);
    if (entry.onClose) entry.onClose(); else entry.backdrop.hidden = true;
    if (entry.opener && entry.opener.focus) entry.opener.focus();
  }
  return { open: open, close: close };
})();
