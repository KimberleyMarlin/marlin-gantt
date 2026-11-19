// Social publish: publishes Approved, automatic Social Posts to Facebook and Instagram at their time,
// then reads their results back. The Marketing OS (Social page) is where posts are written and
// approved; this is the part that holds the Meta publishing token, which a public static page can't.
//
// Runs from .github/workflows/social-publish.yml every 15 minutes. This repository is PUBLIC, and so
// are its Action logs, so this script never prints captions, tokens or Page details: only counts,
// post row numbers and Meta's error messages.
//
// Reads and writes the Social Posts list (Marlin Hospitality Marketing site). Media comes from
// SharePoint: Meta is given Graph's short-lived pre-authenticated download link for the original
// file, so nothing is made public and no copy is kept anywhere else.
//
// Where each venue posts: SOCIAL_ACCOUNTS in index.html (between the social-accounts markers), the
// same table the OS shows as "Posts to". Each Page's linked Instagram account is looked up from
// the Page.
//
// Settings (GitHub → Settings → Secrets and variables → Actions):
//   META_PUBLISH_TOKEN  System User token for publishing (secret). Separate from META_TOKEN, the
//                       read-only reporting token. Needs pages_show_list, pages_read_engagement,
//                       pages_manage_posts, instagram_basic, instagram_content_publish,
//                       instagram_manage_insights and read_insights, with the System User assigned
//                       to each Page.
//   MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET  Entra app with Sites.Selected write on the
//                       Marketing site (the same app the Meta reporting sync uses) (secrets)
//   SOCIAL_LIST_ID      optional; defaults to the Social Posts list
//   META_API_VERSION    optional; defaults to v24.0
// No dependencies: Node 20+ only.

import { readFile } from 'node:fs/promises';

const API = process.env.META_API_VERSION || 'v24.0';
const SITE = 'marlingroupaus.sharepoint.com,9932d19c-c701-44f9-9aa6-f6e64e2be3e8';
const LIST = process.env.SOCIAL_LIST_ID || '0e78c896-ee5b-4936-9e27-8081432370d4';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const MAX_PER_RUN = 10;                 // posts published per run
const STALE_MINUTES = 30;               // a row left in Publishing this long was interrupted
const INSIGHTS_EVERY_HOURS = 6;         // how often a posted row's results are refreshed
const INSIGHTS_FOR_DAYS = 30;           // results stop updating this long after publishing
const CONTAINER_WAIT_MS = 10 * 60000;   // how long to wait for Instagram to process a video

export const sleep = ms => new Promise(r => setTimeout(r, ms));
const short = s => String(s || '').replace(/\s+/g, ' ').slice(0, 220);

async function fetchRetry(url, opts = {}, tries = 4) {
  for (let i = 0; ; i++) {
    const res = await fetch(url, opts);
    if (![429, 500, 502, 503, 504].includes(res.status) || i >= tries - 1) return res;
    await sleep(2000 * 2 ** i);
  }
}
async function errorText(res, what) {
  let msg = '';
  try { const j = await res.json(); msg = j?.error?.error_user_msg || j?.error?.message || j?.error_description || ''; } catch { /* not JSON */ }
  return `${what}: HTTP ${res.status}${msg ? ` (${short(msg)})` : ''}`;
}

// ── SOCIAL_ACCOUNTS from index.html ───────────────────────────────────
export function parseAccounts(html) {
  const m = String(html).match(/\/\*social-accounts:start\*\/([\s\S]*?)\/\*social-accounts:end\*\//);
  if (!m) throw new Error('SOCIAL_ACCOUNTS markers not found in index.html');
  return JSON.parse(m[1]);
}

// ── Microsoft Graph (SharePoint) ──────────────────────────────────────
async function msToken() {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.MS_CLIENT_ID, client_secret: process.env.MS_CLIENT_SECRET, scope: 'https://graph.microsoft.com/.default' });
  const res = await fetchRetry(`https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`, { method: 'POST', body });
  if (!res.ok) throw new Error(await errorText(res, 'Microsoft sign-in'));
  return (await res.json()).access_token;
}
async function graphGet(url, token) {
  const res = await fetchRetry(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await errorText(res, 'SharePoint read'));
  return res.json();
}
async function listPosts(token) {
  const out = [];
  let url = `${GRAPH}/sites/${SITE}/lists/${LIST}/items?expand=fields&$top=500`;
  while (url) { const j = await graphGet(url, token); out.push(...(j.value || [])); url = j['@odata.nextLink'] || null; }
  return out;
}
async function patchPost(id, fields, token) {
  const res = await fetchRetry(`${GRAPH}/sites/${SITE}/lists/${LIST}/items/${id}/fields`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
  if (!res.ok) throw new Error(await errorText(res, `Saving row ${id}`));
}
// A short-lived (about an hour) pre-authenticated link to the original file. Meta downloads from it.
async function mediaUrl(refRaw, token) {
  let ref; try { ref = JSON.parse(refRaw || ''); } catch { return null; }
  if (!ref?.driveId || !ref?.itemId) return null;
  const j = await graphGet(`${GRAPH}/drives/${ref.driveId}/items/${ref.itemId}?$select=name,file,@microsoft.graph.downloadUrl`, token);
  if (!j['@microsoft.graph.downloadUrl']) throw new Error('SharePoint gave no download link for the media');
  return { url: j['@microsoft.graph.downloadUrl'], mime: j.file?.mimeType || '' };
}

// ── Meta ──────────────────────────────────────────────────────────────
async function metaPost(path, params, token, base = `https://graph.facebook.com/${API}/`) {
  const res = await fetchRetry(base + path, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: new URLSearchParams(params) });
  if (!res.ok) throw new Error(await errorText(res, `Meta ${path.split('/').pop()}`));
  return res.json();
}
async function metaGet(path, params, token) {
  const res = await fetchRetry(`https://graph.facebook.com/${API}/${path}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await errorText(res, `Meta ${path.split('/').pop() || path}`));
  return res.json();
}
const fbUrl = u => (u && u.startsWith('/') ? `https://www.facebook.com${u}` : u || '');

// The Page's own token (Page posts need it) and its linked Instagram account.
const pageCache = {};
export async function pageInfo(pageId, systemToken) {
  if (!pageCache[pageId]) {
    const j = await metaGet(pageId, { fields: 'access_token,instagram_business_account' }, systemToken);
    if (!j.access_token) throw new Error('No Page access. Assign the System User to this Page in Business Settings.');
    pageCache[pageId] = { token: j.access_token, igId: j.instagram_business_account?.id || '' };
  }
  return pageCache[pageId];
}

// Facebook: hosted-file uploads for video (Meta fetches the SharePoint link itself).
async function fbVideo(pageId, edge, video, caption, token) {
  const start = await metaPost(`${pageId}/${edge}`, { upload_phase: 'start' }, token);
  const up = await fetchRetry(start.upload_url, { method: 'POST', headers: { Authorization: `OAuth ${token}`, file_url: video.url } });
  if (!up.ok) throw new Error(await errorText(up, 'Facebook video upload'));
  const finish = { upload_phase: 'finish', video_id: start.video_id };
  if (edge === 'video_reels') Object.assign(finish, { video_state: 'PUBLISHED', description: caption });
  const done = await metaPost(`${pageId}/${edge}`, finish, token);
  return { id: String(done.post_id || start.video_id), video: true };
}
export async function publishFacebook(post, pageId, page, media) {
  const caption = post.Caption || '', t = page.token, type = post.PostType || 'Feed';
  let res;
  if (type === 'Story') {
    if (media.video) res = await fbVideo(pageId, 'video_stories', media.video, '', t);
    else if (media.image) {
      const photo = await metaPost(`${pageId}/photos`, { url: media.image.url, published: 'false' }, t);
      const story = await metaPost(`${pageId}/photo_stories`, { photo_id: photo.id }, t);
      res = { id: String(story.post_id || photo.id) };
    } else throw new Error('A Facebook story needs an image or a video');
  } else if (media.video) {
    res = await fbVideo(pageId, 'video_reels', media.video, caption, t);
  } else if (media.image) {
    const photo = await metaPost(`${pageId}/photos`, { url: media.image.url, message: caption, published: 'true' }, t);
    res = { id: String(photo.post_id || photo.id) };
  } else {
    const fp = await metaPost(`${pageId}/feed`, { message: caption }, t);
    res = { id: String(fp.id) };
  }
  let url = '';
  try { url = fbUrl((await metaGet(res.id, { fields: 'permalink_url' }, t)).permalink_url); } catch { /* stories have no permalink */ }
  return { ...res, url };
}

export async function publishInstagram(post, igId, page, media, { wait = CONTAINER_WAIT_MS, poll = 10000 } = {}) {
  const t = page.token, type = post.PostType || 'Feed';
  const params = {};
  if (type === 'Story') {
    params.media_type = 'STORIES';
    if (media.video) params.video_url = media.video.url; else if (media.image) params.image_url = media.image.url;
    else throw new Error('An Instagram story needs an image or a video');
  } else if (media.video) {
    Object.assign(params, { media_type: 'REELS', video_url: media.video.url, caption: post.Caption || '', share_to_feed: 'true' });
  } else if (media.image) {
    Object.assign(params, { image_url: media.image.url, caption: post.Caption || '' });
  } else throw new Error('Instagram needs an image or a video');
  const container = await metaPost(`${igId}/media`, params, t);
  // Instagram processes the media before it can be published. Videos take a while.
  const until = Date.now() + wait;
  for (;;) {
    const st = await metaGet(container.id, { fields: 'status_code,status' }, t);
    if (st.status_code === 'FINISHED') break;
    if (['ERROR', 'EXPIRED'].includes(st.status_code)) throw new Error(`Instagram couldn't process the media (${short(st.status || st.status_code)})`);
    if (Date.now() > until) throw new Error('Instagram was still processing the video after 10 minutes. It may be too long or too large.');
    await sleep(poll);
  }
  const pub = await metaPost(`${igId}/media_publish`, { creation_id: container.id }, t);
  let url = '';
  try { url = (await metaGet(pub.id, { fields: 'permalink' }, t)).permalink || ''; } catch { /* stories have no permalink */ }
  return { id: String(pub.id), url };
}

// ── Publish one row ───────────────────────────────────────────────────
export function isDue(f, now = new Date()) {
  return f.Status === 'Approved' && f.PublishMode === 'Auto' && f.PublishAt && new Date(f.PublishAt) <= new Date(now.getTime() + 60000);
}
const parseJson = v => { try { const j = JSON.parse(v || ''); return j && typeof j === 'object' ? j : {}; } catch { return {}; } };

export async function publishRow(item, accounts, systemToken, msTok, opts = {}) {
  const f = item.fields || {};
  const platforms = String(f.Platforms || '').split(/[;,]/).map(s => s.trim()).filter(Boolean);
  const done = parseJson(f.ExternalPostId);   // {facebook:{id,video}, instagram:{id}}: kept so a retry skips what already posted
  const urls = parseJson(f.PostUrl);
  const errors = [];
  const acct = accounts[f.Venue] || {};
  if (!acct.pageId) errors.push(`No Page ID for "${f.Venue || 'no venue'}" in SOCIAL_ACCOUNTS`);
  let page = null, media = null;
  if (!errors.length) {
    try {
      page = await pageInfo(acct.pageId, systemToken);
      const [video, image] = await Promise.all([mediaUrl(f.VideoRef, msTok), f.VideoRef ? null : mediaUrl(f.ImageRef, msTok)]);
      media = { video, image };
      if ((f.PostType === 'Reel') && !video) throw new Error('This reel has no video');
    } catch (e) { errors.push(e.message); }
  }
  if (page && !errors.length) {
    if (platforms.includes('Facebook') && !done.facebook) {
      try { const r = await publishFacebook(f, acct.pageId, page, media); done.facebook = { id: r.id, video: !!r.video }; if (r.url) urls.facebook = r.url; }
      catch (e) { errors.push(`Facebook: ${e.message}`); }
    }
    if (platforms.includes('Instagram') && !done.instagram) {
      try {
        if (!page.igId) throw new Error('This Page has no linked Instagram professional account');
        const r = await publishInstagram(f, page.igId, page, media, opts);
        done.instagram = { id: r.id }; if (r.url) urls.instagram = r.url;
      } catch (e) { errors.push(`Instagram: ${e.message}`); }
    }
  }
  const notes = [...errors];
  if (platforms.includes('Google')) notes.push('Google Business Profile is posted by hand in Google.');
  const fields = { ExternalPostId: JSON.stringify(done), PostUrl: JSON.stringify(urls), Notes: notes.join(' ') };
  if (errors.length) fields.Status = 'Failed';
  else { fields.Status = 'Posted'; fields.PublishedAt = new Date().toISOString(); }
  return fields;
}

// ── Results ───────────────────────────────────────────────────────────
const num = v => (v == null ? undefined : Number(v) || 0);
export async function readInsights(f, accounts, systemToken) {
  const done = parseJson(f.ExternalPostId), out = { at: new Date().toISOString() };
  const page = await pageInfo((accounts[f.Venue] || {}).pageId, systemToken);
  if (done.facebook?.id) {
    try {
      if (done.facebook.video) {
        const v = await metaGet(done.facebook.id, { fields: 'likes.summary(true).limit(0),comments.summary(true).limit(0)' }, page.token);
        out.facebook = { likes: num(v.likes?.summary?.total_count), comments: num(v.comments?.summary?.total_count) };
        try {
          const vi = await metaGet(`${done.facebook.id}/video_insights`, { metric: 'blue_reels_play_count,post_impressions_unique' }, page.token);
          for (const m of vi.data || []) {
            const val = m.values?.[0]?.value;
            if (m.name === 'blue_reels_play_count') out.facebook.views = num(val);
            if (m.name === 'post_impressions_unique') out.facebook.reach = num(val);
          }
        } catch { /* not every video reports these */ }
      } else {
        const p = await metaGet(done.facebook.id, { fields: 'reactions.summary(true).limit(0),comments.summary(true).limit(0),shares' }, page.token);
        out.facebook = { likes: num(p.reactions?.summary?.total_count), comments: num(p.comments?.summary?.total_count), shares: num(p.shares?.count ?? 0) };
      }
    } catch (e) { out.facebookError = short(e.message); }
  }
  if (done.instagram?.id) {
    try {
      const m = await metaGet(done.instagram.id, { fields: 'like_count,comments_count' }, page.token);
      out.instagram = { likes: num(m.like_count), comments: num(m.comments_count) };
      try {
        const ins = await metaGet(`${done.instagram.id}/insights`, { metric: 'reach,views,saved,shares' }, page.token);
        for (const d of ins.data || []) {
          const val = d.values?.[0]?.value ?? d.total_value?.value;
          const key = { reach: 'reach', views: 'views', saved: 'saves', shares: 'shares' }[d.name];
          if (key) out.instagram[key] = num(val);
        }
      } catch { /* stories expire after 24 hours; some metrics aren't offered for every media type */ }
    } catch (e) { out.instagramError = short(e.message); }
  }
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────
export async function main({ now = new Date(), html } = {}) {
  const required = ['META_PUBLISH_TOKEN', 'MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) { console.log(`Social publish is not configured yet (missing: ${missing.join(', ')}). Nothing to do.`); return { configured: false }; }
  const accounts = parseAccounts(html ?? await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const systemToken = process.env.META_PUBLISH_TOKEN;
  const msTok = await msToken();
  const items = await listPosts(msTok);
  const summary = { published: 0, failed: 0, interrupted: 0, insights: 0 };

  // 1. A row stuck in Publishing was interrupted mid-run. Don't publish it again blindly: it may
  //    already be live. Mark it Failed so someone checks the Page and presses Try again.
  for (const it of items) {
    const f = it.fields || {};
    if (f.Status === 'Publishing' && new Date(it.lastModifiedDateTime || 0) < new Date(now.getTime() - STALE_MINUTES * 60000)) {
      await patchPost(it.id, { Status: 'Failed', Notes: 'Publishing was interrupted. Check the Page and Instagram before pressing Try again, it may already be live.' }, msTok);
      summary.interrupted++;
    }
  }

  // 2. Publish what's due, oldest first.
  const due = items.filter(it => isDue(it.fields || {}, now)).sort((a, b) => String(a.fields.PublishAt).localeCompare(String(b.fields.PublishAt))).slice(0, MAX_PER_RUN);
  for (const it of due) {
    await patchPost(it.id, { Status: 'Publishing' }, msTok);   // claim it, so an overlapping run skips it
    let fields;
    try { fields = await publishRow(it, accounts, systemToken, msTok); }
    catch (e) { fields = { Status: 'Failed', Notes: short(e.message) }; }
    await patchPost(it.id, fields, msTok);
    if (fields.Status === 'Posted') summary.published++;
    else { summary.failed++; console.log(`Row ${it.id} failed: ${fields.Notes}`); }
  }

  // 3. Refresh results on recently posted rows.
  const cutoff = now.getTime() - INSIGHTS_FOR_DAYS * 864e5;
  for (const it of items) {
    const f = it.fields || {};
    if (f.Status !== 'Posted' || !f.ExternalPostId || !f.PublishedAt || new Date(f.PublishedAt).getTime() < cutoff) continue;
    const last = parseJson(f.Insights).at;
    if (last && now.getTime() - new Date(last).getTime() < INSIGHTS_EVERY_HOURS * 3600000) continue;
    if (!(accounts[f.Venue] || {}).pageId) continue;
    try { await patchPost(it.id, { Insights: JSON.stringify(await readInsights(f, accounts, systemToken)) }, msTok); summary.insights++; }
    catch (e) { console.log(`Row ${it.id} results not updated: ${short(e.message)}`); }
  }
  console.log(`Social publish: ${summary.published} published, ${summary.failed} failed, ${summary.interrupted} interrupted, ${summary.insights} results updated.`);
  return { configured: true, ...summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(`Social publish failed: ${short(e.message)}`); process.exit(1); });
}
