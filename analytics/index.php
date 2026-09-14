<?php declare(strict_types=1); ?>
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Analytics - Templo da Luz Amorosa</title>
  <style>
    :root { --purple:#2d144d; --gold:#f59e0b; --green:#059669; --red:#dc2626; --line:#eadff4; --muted:#6d5c7b; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; background:linear-gradient(180deg,#fbf8ff,#f3ebf9); color:#181126; }
    main { width:min(1180px,calc(100% - 28px)); margin:0 auto; padding:26px 0 44px; }
    header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px; }
    h1 { margin:0; font-size:28px; color:var(--purple); letter-spacing:-.02em; }
    h2 { margin:0 0 12px; font-size:17px; color:var(--purple); }
    p { margin:6px 0 0; color:var(--muted); line-height:1.45; }
    .badge { display:inline-flex; align-items:center; gap:8px; border:1px solid #bbf7d0; background:#ecfdf5; color:#047857; padding:9px 12px; border-radius:999px; font-weight:800; font-size:13px; }
    .dot { width:9px; height:9px; border-radius:999px; background:#10b981; box-shadow:0 0 0 4px #d1fae5; }
    .cards { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:14px; }
    .card, .panel { background:white; border:1px solid var(--line); border-radius:18px; box-shadow:0 18px 45px rgba(45,20,77,.08); }
    .card { padding:17px; }
    .card strong { display:block; font-size:30px; color:var(--purple); line-height:1; }
    .card span { display:block; margin-top:7px; color:var(--muted); font-size:13px; font-weight:800; }
    .layout { display:grid; grid-template-columns:1.45fr .9fr; gap:14px; }
    .panel { padding:18px; margin-top:14px; overflow:hidden; }
    .funnel { display:flex; flex-direction:column; gap:10px; }
    .stage { display:grid; grid-template-columns:190px 1fr 84px 92px; align-items:center; gap:12px; padding:12px; border:1px solid #f0e7f7; border-radius:16px; background:#fcfaff; }
    .stage-name { font-weight:900; color:#241535; font-size:13px; }
    .bar { height:18px; overflow:hidden; border-radius:999px; background:#f1e7f8; border:1px solid #eadff4; }
    .fill { height:100%; min-width:2px; border-radius:999px; background:linear-gradient(90deg,var(--gold),var(--green)); transition:width .25s ease; }
    .metric { text-align:right; font-weight:900; color:var(--purple); }
    .drop { text-align:right; font-size:12px; font-weight:900; color:var(--muted); }
    .drop.bad { color:var(--red); }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:11px 10px; border-bottom:1px solid #f1e9f8; text-align:left; font-size:13px; vertical-align:top; }
    th { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.08em; background:#fbf8ff; }
    tr:last-child td { border-bottom:0; }
    code { color:#4c1d95; background:#f5effa; padding:2px 6px; border-radius:7px; word-break:break-word; }
    .list { display:flex; flex-direction:column; gap:9px; }
    .row { display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; padding:10px 12px; border:1px solid #f0e7f7; border-radius:14px; background:#fcfaff; font-size:13px; }
    .row b { color:var(--purple); }
    .empty { padding:20px; text-align:center; color:var(--muted); background:#fff; border:1px dashed var(--line); border-radius:16px; }
    .hint { margin-top:10px; padding:12px; border-radius:16px; background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; font-size:13px; font-weight:700; }
    @media (max-width:900px) { .layout { grid-template-columns:1fr; } .cards { grid-template-columns:repeat(2,minmax(0,1fr)); } .stage { grid-template-columns:1fr; gap:7px; } .metric,.drop { text-align:left; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Analytics Templo da Luz Amorosa</h1>
        <p>Visão simples do funil: onde as pessoas entram, avançam, travam e clicam.</p>
      </div>
      <div class="badge"><span class="dot"></span><span id="status">Conectando</span></div>
    </header>

    <div class="cards">
      <div class="card"><strong id="onlineNow">0</strong><span>online agora</span></div>
      <div class="card"><strong id="visitorsToday">0</strong><span>visitantes hoje</span></div>
      <div class="card"><strong id="resultVisitors">0</strong><span>chegaram no resultado</span></div>
      <div class="card"><strong id="pixVisitors">0</strong><span>abriram PIX</span></div>
    </div>

    <div class="layout">
      <div>
        <section class="panel">
          <h2>Funil de Hoje</h2>
          <div id="funnel" class="funnel"></div>
          <div id="mainHint" class="hint">Aguardando dados para identificar o gargalo principal.</div>
        </section>

        <section class="panel">
          <h2>Quem Está Online Agora</h2>
          <div id="onlineTable" class="empty">Aguardando visitantes...</div>
        </section>
      </div>

      <div>
        <section class="panel">
          <h2>Páginas Mais Vistas Hoje</h2>
          <div id="pagesList" class="empty">Sem páginas ainda.</div>
        </section>

        <section class="panel">
          <h2>Cliques Mais Repetidos</h2>
          <div id="clicksList" class="empty">Sem cliques ainda.</div>
        </section>

        <section class="panel">
          <h2>Últimos Eventos</h2>
          <div id="eventsTable" class="empty">Nenhum evento ainda.</div>
        </section>
      </div>
    </div>
  </main>

  <script>
    const fmtTime = (seconds) => new Date(seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const escapeHtml = (text) => String(text || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
    const shortUrl = (url) => {
      try {
        const parsed = new URL(url);
        return parsed.pathname + parsed.search;
      } catch (error) {
        return url || '-';
      }
    };

    function renderTable(rows, headers, mapRow) {
      if (!rows.length) return '<div class="empty">Nada para mostrar agora.</div>';
      return '<table><thead><tr>' + headers.map((h) => `<th>${h}</th>`).join('') + '</tr></thead><tbody>' +
        rows.map((row) => '<tr>' + mapRow(row).map((cell) => `<td>${cell}</td>`).join('') + '</tr>').join('') +
        '</tbody></table>';
    }

    function renderKeyValueList(items) {
      const entries = Object.entries(items || {});
      if (!entries.length) return '<div class="empty">Sem dados ainda.</div>';
      return '<div class="list">' + entries.map(([label, count]) =>
        `<div class="row"><span>${escapeHtml(label)}</span><b>${count}</b></div>`
      ).join('') + '</div>';
    }

    function renderFunnel(stages) {
      const max = Math.max(1, ...stages.map((stage) => stage.visitors));
      funnel.innerHTML = stages.map((stage, index) => {
        const width = Math.max(2, Math.round((stage.visitors / max) * 100));
        const dropText = index === 0 ? '-' : `${stage.drop_rate}% abandono`;
        const bad = stage.drop_rate >= 35 ? ' bad' : '';
        return `<div class="stage">
          <div class="stage-name">${escapeHtml(stage.name)}</div>
          <div class="bar"><div class="fill" style="width:${width}%"></div></div>
          <div class="metric">${stage.visitors} pessoas</div>
          <div class="drop${bad}">${dropText}</div>
        </div>`;
      }).join('');

      const biggestDrop = stages.slice(1).reduce((best, stage) => !best || stage.drop_rate > best.drop_rate ? stage : best, null);
      if (biggestDrop && biggestDrop.drop_rate > 0) {
        mainHint.textContent = `Principal gargalo hoje: antes de "${biggestDrop.name}", com ${biggestDrop.drop_rate}% de abandono em relação à etapa anterior.`;
      } else {
        mainHint.textContent = 'Ainda não há abandono suficiente para apontar um gargalo claro.';
      }
    }

    async function loadAnalytics() {
      const response = await fetch('api.php', { cache: 'no-store' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Erro ao carregar');

      status.textContent = 'Online';
      onlineNow.textContent = data.summary.online_now;
      visitorsToday.textContent = data.summary.visitors_today;
      const resultStage = data.funnel.find((stage) => stage.key === 'resultado') || { visitors: 0 };
      const pixStage = data.funnel.find((stage) => stage.key === 'checkout_pix') || { visitors: 0 };
      resultVisitors.textContent = resultStage.visitors;
      pixVisitors.textContent = pixStage.visitors;

      renderFunnel(data.funnel);
      pagesList.innerHTML = renderKeyValueList(data.top_pages);
      clicksList.innerHTML = renderKeyValueList(data.top_clicks);

      onlineTable.innerHTML = renderTable(data.online, ['Agora', 'Página', 'Etapa', 'Origem'], (row) => [
        fmtTime(row.last_seen),
        `<code>${escapeHtml(shortUrl(row.page))}</code>`,
        escapeHtml(row.funnel_stage || row.step || row.event_type || '-'),
        escapeHtml(row.utm_source || 'Direto'),
      ]);

      eventsTable.innerHTML = renderTable(data.recent_events.slice(0, 18), ['Hora', 'Evento', 'Etapa', 'Detalhe'], (row) => [
        fmtTime(row.created_at),
        escapeHtml(row.event_type || '-'),
        escapeHtml(row.funnel_stage || '-'),
        escapeHtml(row.label || row.step || shortUrl(row.page) || '-'),
      ]);
    }

    loadAnalytics().catch((error) => { status.textContent = error.message; });
    setInterval(() => loadAnalytics().catch((error) => { status.textContent = error.message; }), 5000);
  </script>
</body>
</html>
