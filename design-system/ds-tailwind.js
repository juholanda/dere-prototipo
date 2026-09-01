/* Config do Tailwind (CDN) — mapeia os TOKENS do ds.css para utilitários.
   Inclua nesta ordem no <head>:
     1) <script src="https://cdn.tailwindcss.com"></script>
     2) <link rel="stylesheet" href="ds.css">
     3) <script src="ds-tailwind.js"></script>
   Assim, utilitários como bg-primary / text-muted / rounded / shadow-md usam os
   mesmos tokens e já respeitam o dark mode (classe .dark no <html>). */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT:'var(--color-primary)', hover:'var(--color-primary-hover)', subtle:'var(--color-primary-subtle)', contrast:'var(--color-primary-contrast)' },
        surface:  { DEFAULT:'var(--color-surface)', muted:'var(--color-surface-2)' },
        canvas:   'var(--color-bg)',
        line:     { DEFAULT:'var(--color-border)', strong:'var(--color-border-strong)' },
        heading:  'var(--color-heading)',
        body:     'var(--color-text)',
        muted:    'var(--color-text-muted)',
        success:  { DEFAULT:'var(--color-success)', bg:'var(--color-success-bg)', fg:'var(--color-success-fg)' },
        warning:  { DEFAULT:'var(--color-warning)', bg:'var(--color-warning-bg)', fg:'var(--color-warning-fg)' },
        danger:   { DEFAULT:'var(--color-danger)',  bg:'var(--color-danger-bg)',  fg:'var(--color-danger-fg)' },
        info:     { DEFAULT:'var(--color-info)',    bg:'var(--color-info-bg)',    fg:'var(--color-info-fg)' },
      },
      borderRadius: { sm:'var(--radius-sm)', DEFAULT:'var(--radius-base)', lg:'var(--radius-lg)', pill:'var(--radius-pill)' },
      boxShadow:    { sm:'var(--shadow-sm)', md:'var(--shadow-md)' },
      fontFamily:   { sans:['var(--font-sans)'] },
    }
  }
};
