/* ===========================================================================
 * AIA Unit-Link Fund Dashboard — data updater
 * Pulls NAV + returns for all AIA (AIAIM) mutual funds from Finnomena's public
 * API and writes them into index.html (between the FUNDS_DATA markers) so the
 * dashboard's "กองทุน" tab shows fresh data. Run on a schedule (Task Scheduler).
 *
 *   node update_funds.js            # updates ./index.html in place
 *
 * No API key needed. Node 18+ (global fetch). Source: finnomena.com public API.
 * =========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const HTML = path.join(__dirname, 'index.html');
const API = 'https://www.finnomena.com/fn3/api/fund/v2/public/funds';
const LIST = 'https://www.finnomena.com/fn3/api/fund/v2/public/funds';
const CATS = 'https://www.finnomena.com/fn3/api/fund/v2/public/categories';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIA-Fund-Dashboard/1.0';

async function getJSON(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      return (j && j.data !== undefined) ? j.data : j;
    } catch (e) {
      if (i === tries) throw e;
      await new Promise(res => setTimeout(res, 800 * i));
    }
  }
}
// run async tasks with a small concurrency cap (be polite to the API)
async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
}
const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

async function main() {
  console.log('[1/4] fetching fund universe…');
  const all = await getJSON(LIST);
  const aia = all.filter(f => /^AIA-/.test(f.short_code || ''))
                 .sort((a, b) => a.short_code.localeCompare(b.short_code));
  console.log('      AIA funds found:', aia.length);

  console.log('[2/4] fetching category names…');
  let catMap = {};
  try {
    const cats = await getJSON(CATS);
    (cats || []).forEach(c => {
      catMap[c.aimc_category_id] = c.name_th || c.name_en;
      (c.sub_categories || []).forEach(s => { catMap[s.aimc_category_id] = s.name_th || s.name_en; });
    });
  } catch (e) { console.log('      (categories skipped:', e.message + ')'); }

  console.log('[3/4] fetching NAV + performance for', aia.length, 'funds…');
  const items = await pool(aia, 6, async (f) => {
    const base = API + '/' + f.fund_id;
    let latest = {}, perf = {};
    try { latest = await getJSON(base + '/latest') || {}; } catch (e) {}
    try { perf   = await getJSON(base + '/performance') || {}; } catch (e) {}
    return {
      code: f.short_code,
      name: f.name_th,
      category: catMap[f.aimc_category_id] || null,
      nav: num(latest.value),
      navDate: latest.date ? String(latest.date).slice(0, 10) : null,
      chg1d: num(latest.d_change),
      ret1m: num(perf.total_return_1m),
      ret3m: num(perf.total_return_3m),
      ret6m: num(perf.total_return_6m),
      ret1y: num(perf.total_return_1y),
      ret3y: num(perf.total_return_3y),
      ret5y: num(perf.total_return_5y),
      sharpe1y: num(perf.sharpe_ratio_1y),
      maxdd1y: num(perf.max_drawdown_1y),
      rank1y: num(perf.total_return_p_1y),      // percentile in AIMC category (lower=better)
      aum: num(latest.amount),
      url: 'https://www.finnomena.com/fund/' + f.short_code
    };
  });

  const ok = items.filter(x => x.nav != null).length;
  const asOf = items.map(x => x.navDate).filter(Boolean).sort().pop() || null;
  const payload = { asOf, fetchedAt: new Date().toISOString(), source: 'Finnomena', count: items.length, items };
  console.log('      got NAV for', ok + '/' + items.length, 'funds · latest NAV date:', asOf);

  console.log('[4/4] writing data…');
  // always drop a standalone funds.json (debug / other consumers)
  fs.writeFileSync(path.join(__dirname, 'funds.json'), JSON.stringify(payload, null, 1));
  // update the embedded FUNDS block in index.html if the markers exist
  const START = '/*FUNDS_DATA_START*/', END = '/*FUNDS_DATA_END*/';
  let html = fs.readFileSync(HTML, 'utf8');
  const s = html.indexOf(START), e = html.indexOf(END);
  if (s === -1 || e === -1) {
    console.warn('      NOTE: FUNDS_DATA markers not found in index.html — wrote funds.json only (add the กองทุน tab to embed).');
  } else {
    const block = START + 'const FUNDS=' + JSON.stringify(payload) + ';' + END;
    html = html.slice(0, s) + block + html.slice(e + END.length);
    fs.writeFileSync(HTML, html);
    console.log('      updated index.html embedded FUNDS block.');
  }
  console.log('done ·', ok, 'funds as of', asOf);
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
