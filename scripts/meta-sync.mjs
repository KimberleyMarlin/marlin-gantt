// Meta sync: reads Marlin's Meta ad accounts with a System User token and writes campaign
// snapshots into SharePoint for the Marketing OS (Marketing Report → Paid media).
//
// Runs from .github/workflows/meta-sync.yml. This repository is PUBLIC, and so are its Action
// logs, so this script never prints campaign names, figures or tokens: only counts and errors.
//
// Output (SharePoint, Marlin Hospitality Marketing → Documents):
//   Integrations/Meta/_all.json                 all venues (share with head office only)
//   Integrations/Meta/venues/<venue-slug>.json  one per venue (share with that venue's managers)
//   Integrations/Meta/history/_all-YYYY-MM.json month-end copy, overwritten through the month
//
// Settings (GitHub → Settings → Secrets and variables → Actions):
//   META_TOKEN        System User token with ads_read            (secret)
//   META_ACCOUNTS     {"act_123":"The Left Bank", ...}           (secret; venue names as in the OS)
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET  Entra app with Sites.Selected write (secrets)
//   SP_DRIVE_ID       optional; defaults to the marketing site's document library
//   META_API_VERSION  optional; defaults to v24.0
// No dependencies: Node 20+ only.

const API = process.env.META_API_VERSION || 'v24.0';
const DRIVE = process.env.SP_DRIVE_ID || 'b!nNEymQHH-USapvbmTivj6MUjOnOvRKdGt3tKLEHQKgU_egVf0fN4SqcpKRs-yYTv';
const FOLDER = 'Integrations/Meta';
const KEEP_ENDED_DAYS = 120; // ended campaigns stay in the snapshot this long after they stop

// Same rule as venueSlug() in index.html, so the OS finds each venue's file.
export const venueSlug = v => String(v || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchRetry(url, opts = {}, tries = 5) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, opts);
    if (![429, 500, 502, 503, 504].includes(res.status) || i >= tries - 1) return res;
    await sleep(2000 * 2 ** i);
  }
}
async function failMessage(res, what) {
  let msg = '';
  try { const j = await res.json(); msg = j?.error?.message || j?.error_description || ''; } catch { /* not JSON */ }
  return `${what} failed: HTTP ${res.status}${msg ? ` (${String(msg).slice(0, 160)})` : ''}`;
}

// ── Meta ──────────────────────────────────────────────────────────────
async function metaGetAll(path, params, token) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));
  let url = `https://graph.facebook.com/${API}/${path}?${qs}`;
  const out = [];
  while (url) {
    // Token in the header, never the URL, so it can't leak into an error message.
    const res = await fetchRetry(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await failMessage(res, `Meta ${path.split('/').pop()}`));
    const j = await res.json();
    out.push(...(j.data || []));
    url = j.paging?.next || null;
  }
  return out;
}
async function metaGetOne(path, params, token) {
  const res = await fetchRetry(`https://graph.facebook.com/${API}/${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await failMessage(res, 'Meta account'));
  return res.json();
}
const num = v => Number(v || 0) || 0;
// Leads and purchases: prefer Meta's combined action types, fall back to the pixel-specific ones,
// and never add both (they overlap).
function pickAction(list, types) {
  const map = Object.fromEntries((list || []).map(a => [a.action_type, num(a.value)]));
  for (const t of types) if (t in map) return map[t];
  return 0;
}
const LEAD_TYPES = ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'];
const PURCHASE_TYPES = ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'];
export function metricsFrom(row) {
  return {
    spend: Math.round(num(row?.spend) * 100) / 100,
    impressions: num(row?.impressions),
    reach: num(row?.reach),
    clicks: num(row?.inline_link_clicks),
    leads: pickAction(row?.actions, LEAD_TYPES),
    purchases: pickAction(row?.actions, PURCHASE_TYPES),
    purchaseValue: Math.round(pickAction(row?.action_values, PURCHASE_TYPES) * 100) / 100,
  };
}
export function statusOf(c, now = new Date()) {
  const s = c.effective_status || c.status || '';
  if (['ARCHIVED', 'DELETED'].includes(s)) return 'COMPLETED';
  if (c.stop_time && new Date(c.stop_time) < now) return 'COMPLETED';
  if (s.includes('PAUSED')) return 'PAUSED';
  if (['IN_PROCESS', 'PENDING_REVIEW'].includes(s)) return 'IN_REVIEW';
  return 'ACTIVE';
}
const isoDay = d => d.toISOString().slice(0, 10);

const WINDOWS = { last7: { date_preset: 'last_7d' }, last30: { date_preset: 'last_30d' }, mtd: { date_preset: 'this_month' }, lifetime: { date_preset: 'maximum' } };
const INSIGHT_FIELDS = 'campaign_id,spend,impressions,reach,inline_link_clicks,actions,action_values';

export async function readAccount(actId, venue, token, now = new Date()) {
  const info = await metaGetOne(actId, { fields: 'name,currency' }, token).catch(() => ({}));
  const campaigns = await metaGetAll(`${actId}/campaigns`, { fields: 'id,name,objective,effective_status,start_time,stop_time,daily_budget,lifetime_budget', limit: '200' }, token);
  const byWindow = {};
  for (const [w, p] of Object.entries(WINDOWS)) {
    const rows = await metaGetAll(`${actId}/insights`, { level: 'campaign', fields: INSIGHT_FIELDS, limit: '500', ...p }, token);
    byWindow[w] = Object.fromEntries(rows.map(r => [r.campaign_id, metricsFrom(r)]));
  }
  const since = new Date(now); since.setUTCDate(since.getUTCDate() - 60);
  const until = new Date(now); until.setUTCDate(until.getUTCDate() - 1);
  const dailyRows = await metaGetAll(`${actId}/insights`, {
    level: 'campaign', fields: 'campaign_id,date_start,spend,inline_link_clicks,actions', time_increment: '1',
    time_range: { since: isoDay(since), until: isoDay(until) }, limit: '500',
  }, token);
  const daily = {};
  for (const r of dailyRows) {
    const m = metricsFrom(r);
    (daily[r.campaign_id] ||= []).push({ date: r.date_start, spend: m.spend, clicks: m.clicks, leads: m.leads, purchases: m.purchases });
  }
  const cutoff = new Date(now); cutoff.setUTCDate(cutoff.getUTCDate() - KEEP_ENDED_DAYS);
  const empty = metricsFrom({});
  const out = campaigns.map(c => {
    const budgetMinor = num(c.lifetime_budget) || num(c.daily_budget);
    return {
      id: String(c.id), accountId: actId, venue, name: c.name, objective: c.objective || '',
      status: statusOf(c, now),
      start: (c.start_time || '').slice(0, 10), end: (c.stop_time || '').slice(0, 10),
      budget: budgetMinor ? { type: num(c.lifetime_budget) ? 'lifetime' : 'daily', amount: budgetMinor / 100 } : null,
      metrics: Object.fromEntries(Object.keys(WINDOWS).map(w => [w, byWindow[w][c.id] || { ...empty }])),
      daily: (daily[c.id] || []).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }).filter(c => {
    // Drop campaigns that never spent, and ended ones older than the cutoff.
    if (!c.metrics.lifetime.spend && c.status === 'COMPLETED') return false;
    if (c.status === 'COMPLETED' && c.end && new Date(c.end) < cutoff) return false;
    return true;
  });
  return { account: { id: actId, venue, name: info?.name || '', currency: info?.currency || 'AUD' }, campaigns: out };
}

// ── SharePoint (Microsoft Graph, app-only) ─────────────────────────────
async function msToken() {
  const body = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID, client_secret: process.env.MS_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials',
  });
  const res = await fetchRetry(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, { method: 'POST', body });
  if (!res.ok) throw new Error(await failMessage(res, 'Microsoft sign-in'));
  return (await res.json()).access_token;
}
async function upload(path, data, token) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE}/root:/${path.split('/').map(encodeURIComponent).join('/')}:/content`;
  // Uploading over an existing file adds a new version and keeps its sharing permissions.
  const res = await fetchRetry(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await failMessage(res, `Upload ${path.split('/').slice(-2).join('/')}`));
}

export function buildSnapshots(results, now = new Date()) {
  const generatedAt = now.toISOString();
  const accounts = results.map(r => r.account);
  const currency = accounts[0]?.currency || 'AUD';
  const all = { generatedAt, currency, accounts, campaigns: results.flatMap(r => r.campaigns) };
  const venues = {};
  for (const r of results) {
    const slug = venueSlug(r.account.venue);
    venues[slug] ||= { generatedAt, currency, accounts: [], campaigns: [] };
    venues[slug].accounts.push(r.account);
    venues[slug].campaigns.push(...r.campaigns);
  }
  return { all, venues };
}

export async function main() {
  const required = ['META_TOKEN', 'META_ACCOUNTS', 'MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.log(`Meta sync isn't configured yet (missing: ${missing.join(', ')}). Nothing to do.`);
    return;
  }
  let accounts;
  try { accounts = JSON.parse(process.env.META_ACCOUNTS); } catch { throw new Error('META_ACCOUNTS is not valid JSON. Expected {"act_123":"The Left Bank", ...}'); }
  const entries = Object.entries(accounts).map(([id, venue]) => [id.startsWith('act_') ? id : `act_${id}`, venue]);
  const results = [];
  let failures = 0;
  for (const [id, venue] of entries) {
    try { results.push(await readAccount(id, venue, process.env.META_TOKEN)); }
    catch (e) { failures++; console.log(`Account ${results.length + failures} of ${entries.length}: ${e.message}`); }
  }
  if (!results.length) throw new Error('No ad accounts could be read. Nothing was written.');
  const { all, venues } = buildSnapshots(results);
  const ms = await msToken();
  await upload(`${FOLDER}/_all.json`, all, ms);
  for (const [slug, snap] of Object.entries(venues)) await upload(`${FOLDER}/venues/${slug}.json`, snap, ms);
  await upload(`${FOLDER}/history/_all-${all.generatedAt.slice(0, 7)}.json`, all, ms);
  console.log(`Meta sync done: ${results.length} of ${entries.length} accounts, ${all.campaigns.length} campaigns, ${Object.keys(venues).length} venue files.`);
  if (failures) process.exitCode = 1; // shows red in Actions so a broken account gets noticed
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.log(`Meta sync failed: ${e.message}`); process.exitCode = 1; });
}
