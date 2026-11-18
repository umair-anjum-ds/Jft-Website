const express = require('express'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const app = express(), PORT = process.env.PORT || 3000, PASS = process.env.ADMIN_PASSWORD || '';
if (PASS.length < 8 || PASS === 'change-me') {
  console.error('Set a strong ADMIN_PASSWORD (at least 8 characters) before starting.\nExample: ADMIN_PASSWORD="MyStrongPass#2026" npm start');
  process.exit(1);
}
// Where editable data lives. Locally it is the project folder; on Render set DATA_DIR to the persistent-disk mount path (e.g. /var/data).
const ROOT = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
const DATA = path.join(ROOT, 'data/content.json'), UP = path.join(ROOT, 'uploads');
fs.mkdirSync(path.dirname(DATA), { recursive: true }); fs.mkdirSync(UP, { recursive: true });
if (ROOT !== __dirname && !fs.existsSync(DATA)) {   // first boot on an empty disk: copy the bundled starter content + images once
  fs.copyFileSync(path.join(__dirname, 'data/content.json'), DATA);
  for (const n of fs.readdirSync(path.join(__dirname, 'uploads'))) fs.copyFileSync(path.join(__dirname, 'uploads', n), path.join(UP, n));
}

const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const sameSecret = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const AUTHF = path.join(ROOT, 'data/auth.json'), scry = (p, salt) => crypto.scryptSync(String(p), salt, 32);
let stored = null; try { stored = JSON.parse(fs.readFileSync(AUTHF, 'utf8')) } catch {}
const checkPass = p => stored ? crypto.timingSafeEqual(scry(p, Buffer.from(stored.salt, 'hex')), Buffer.from(stored.hash, 'hex')) : sameSecret(p, PASS);
const tokens = new Map(), TOKEN_MS = 12 * 3600e3;   // sessions last 12 hours
const fails = new Map(), MAX_FAILS = 5, LOCK_MS = 15 * 60e3;
setInterval(() => { const n = Date.now(); for (const [t, e] of tokens) if (e < n) tokens.delete(t); for (const [i, f] of fails) if (f.until < n && f.n < MAX_FAILS) fails.delete(i); }, 600e3).unref();

const auth = (q, s, next) => {
  const t = (q.headers.authorization || '').replace('Bearer ', ''), e = tokens.get(t);
  if (e && e > Date.now()) return next();
  tokens.delete(t); s.status(401).json({ error: 'Session expired. Please log in again.' });
};

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1' || process.env.RENDER) app.set('trust proxy', 1);   // behind Nginx or Render's proxy: needed so login lockout/rate limits see real visitor IPs
app.use(require('compression')());
app.use((q, s, n) => { s.set('X-Content-Type-Options', 'nosniff'); s.set('X-Frame-Options', 'SAMEORIGIN'); n(); });
app.get('/healthz', (q, s) => s.type('text/plain').send('ok'));   // Render health check
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UP, { maxAge: '7d' }));

// ---------- SEO: server-rendered pages, sitemap, robots ----------
const { renderPage, seoFor, publicContent } = require('./public/render.js');
const PATHS = { home: '/', about: '/about', services: '/services', projects: '/projects', news: '/news', careers: '/careers', contact: '/contact', directors: '/directors-message', vision: '/vision-mission', accreditation: '/accreditation', quality: '/quality-policy', safety: '/health-and-safety-policy', environmental: '/environmental-policy', sustainability: '/sustainability-policy', team: '/team-history' };
const readContent = () => JSON.parse(fs.readFileSync(DATA, 'utf8'));
const attr = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const baseUrl = (q, c) => ((c.seo && c.seo.siteUrl) || `${q.protocol}://${q.get('host')}`).replace(/\/+$/, '');
const absUrl = (b, u) => !u ? '' : /^https?:/.test(u) ? u : b + u;
const bannerTitle = (c, pg) => { const m = { about: c.aboutPage, services: c.servicesPage, projects: c.projects, news: c.news, careers: c.careers, contact: c.contactPage, directors: c.directorPage, vision: c.visionPage, accreditation: c.accreditationPage, team: c.teamPage }[pg] || (c.policies || {})[pg]; return m && m.banner && m.banner.title };

function jsonLd(c, b, pg) {
  const f = c.footer, img = absUrl(b, c.seo && c.seo.defaultImage);
  const biz = { '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': b + '/#business', name: `${c.site.name} – ${c.site.tagline}`, url: b + '/', telephone: f.phones[0], email: f.email,
    areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
    address: { '@type': 'PostalAddress', streetAddress: f.address, addressLocality: 'Dubai', addressCountry: 'AE' },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: c.services.items.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.description } })) } };
  if (img) biz.image = img;
  const out = [biz];
  if (pg !== 'home' && PATHS[pg]) out.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: b + '/' }, { '@type': 'ListItem', position: 2, name: bannerTitle(c, pg) || pg, item: b + PATHS[pg] }] });
  return out.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
}

function sendPage(pg, status) {
  return (q, s) => {
    let c; try { c = readContent() } catch { return s.status(500).send('Content error') }
    const b = baseUrl(q, c), nf = pg === 'notfound', seo = seoFor(c, pg), route = PATHS[pg] || q.path, url = b + route, og = absUrl(b, c.seo && c.seo.defaultImage);
    let tpl = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8').replace('data-page="home"', `data-page="${pg}"`);
    const head = nf ? '<meta name="robots" content="noindex">' : [
      `<meta name="description" content="${attr(seo.description)}">`, `<link rel="canonical" href="${attr(url)}">`,
      '<meta property="og:type" content="website">', `<meta property="og:site_name" content="${attr(c.site.name)}">`,
      `<meta property="og:title" content="${attr(seo.title)}">`, `<meta property="og:description" content="${attr(seo.description)}">`, `<meta property="og:url" content="${attr(url)}">`,
      og ? `<meta property="og:image" content="${attr(og)}">` : '', `<meta name="twitter:card" content="${og ? 'summary_large_image' : 'summary'}">`,
      jsonLd(publicContent(c), b, pg)].filter(Boolean).join('\n');
    const html = tpl.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${attr(seo.title)}</title>\n${head}`)
      .replace('<div id="app"></div>', () => { let body; try { body = renderPage(c, pg, route) } catch (e) { console.error('render error', pg, e.message); body = '' } return `<div id="app">${body}</div>` });
    s.status(status || 200).set('Cache-Control', 'no-cache').type('html').send(html);
  };
}
Object.keys(PATHS).forEach(pg => app.get(PATHS[pg], sendPage(pg)));
app.get(/^\/(index|about|services|projects|news|careers|contact)\.html$/, (q, s) => s.redirect(301, q.params[0] === 'index' ? '/' : '/' + q.params[0]));
app.get('/sitemap.xml', (q, s) => {
  let c; try { c = readContent() } catch { return s.sendStatus(500) }
  const b = baseUrl(q, c), m = fs.statSync(DATA).mtime.toISOString().slice(0, 10);
  s.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(PATHS).map(pg => `  <url><loc>${attr(b + PATHS[pg])}</loc><lastmod>${m}</lastmod><priority>${pg === 'home' ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>`);
});
app.get('/robots.txt', (q, s) => { let c = {}; try { c = readContent() } catch {} s.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\n\nSitemap: ${baseUrl(q, c)}/sitemap.xml\n`) });
app.use('/admin.html', (q, s, n) => { s.set('X-Robots-Tag', 'noindex, nofollow'); n() });
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '10m' }));

app.get('/api/content', (q, s) => {   // admins get everything; visitors never see drafts
  let c; try { c = readContent() } catch { return s.status(500).json({ error: 'Content error' }) }
  const e = tokens.get((q.headers.authorization || '').replace('Bearer ', ''));
  s.set('Cache-Control', 'no-store').json(e && e > Date.now() ? c : publicContent(c));
});
app.get('/api/media', auth, (q, s) => s.json(fs.readdirSync(UP).filter(n => /\.(jpe?g|png|webp)$/i.test(n)).map(n => { const st = fs.statSync(path.join(UP, n)); return { name: n, url: '/uploads/' + n, size: st.size, date: st.mtime } }).sort((a, b) => new Date(b.date) - new Date(a.date))));
app.delete('/api/media/:name', auth, (q, s) => {
  const n = path.basename(q.params.name); if (!/^[\w.-]+\.(jpe?g|png|webp)$/i.test(n)) return s.status(400).json({ error: 'Bad file name' });
  try { fs.unlinkSync(path.join(UP, n)) } catch {} s.json({ ok: true });
});
app.post('/api/login', (q, s) => {
  const ip = q.ip, f = fails.get(ip) || { n: 0, until: 0 };
  if (f.n >= MAX_FAILS && f.until > Date.now()) return s.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (f.n >= MAX_FAILS) f.n = 0;
  if (!checkPass((q.body || {}).password || '')) {
    f.n++; f.until = Date.now() + LOCK_MS; fails.set(ip, f);
    return s.status(401).json({ error: 'Wrong password' });
  }
  fails.delete(ip);
  const t = crypto.randomBytes(32).toString('hex'); tokens.set(t, Date.now() + TOKEN_MS); s.json({ token: t });
});
app.post('/api/logout', auth, (q, s) => { tokens.delete((q.headers.authorization || '').replace('Bearer ', '')); s.json({ ok: true }); });
app.post('/api/password', auth, (q, s) => {
  const { current, next } = q.body || {};
  if (!checkPass(current || '')) return s.status(403).json({ error: 'Current password is wrong' });
  if (String(next || '').length < 8) return s.status(400).json({ error: 'New password must be at least 8 characters' });
  const salt = crypto.randomBytes(16); stored = { salt: salt.toString('hex'), hash: scry(next, salt).toString('hex') };
  fs.writeFileSync(AUTHF, JSON.stringify(stored));
  const keep = (q.headers.authorization || '').replace('Bearer ', ''); for (const t of tokens.keys()) if (t !== keep) tokens.delete(t);
  s.json({ ok: true });
});
app.put('/api/content', auth, (q, s) => {
  if (!q.body || typeof q.body !== 'object') return s.status(400).json({ error: 'Invalid content' });
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(q.body, null, 2)); fs.renameSync(DATA + '.tmp', DATA); s.json({ ok: true });
});
app.post('/api/upload', auth, express.raw({ type: 'image/*', limit: '8mb' }), (q, s) => {
  const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[q.headers['content-type']];
  if (!ext || !Buffer.isBuffer(q.body)) return s.status(400).json({ error: 'Use a JPG, PNG or WEBP image' });
  const n = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext; fs.writeFileSync(path.join(UP, n), q.body); s.json({ url: '/uploads/' + n });
});

// ---- contact-form enquiries ----
const ENQ = path.join(ROOT, 'data/enquiries.json'), hits = new Map();
const readEnq = () => { try { return JSON.parse(fs.readFileSync(ENQ, 'utf8')) } catch { return [] } };
app.post('/api/enquiry', (q, s) => {
  const b = q.body || {}; if (b.website) return s.json({ ok: true });            // honeypot for bots
  const cl = (v, n) => String(v || '').trim().slice(0, n);
  const e = { name: cl(b.name, 100), email: cl(b.email, 150), phone: cl(b.phone, 40), message: cl(b.message, 2000) };
  if (!e.name || !e.message || (!e.email && !e.phone)) return s.status(400).json({ error: 'Please fill in your name, a phone or email, and a message.' });
  const h = (hits.get(q.ip) || []).filter(t => t > Date.now() - 3600e3); if (h.length >= 5) return s.status(429).json({ error: 'Too many messages. Please try again later.' });
  hits.set(q.ip, [...h, Date.now()]);
  const list = readEnq(); list.unshift({ id: crypto.randomBytes(6).toString('hex'), date: new Date().toISOString(), ...e });
  fs.writeFileSync(ENQ, JSON.stringify(list.slice(0, 500), null, 2)); s.json({ ok: true });
});
app.get('/api/enquiries', auth, (q, s) => s.json(readEnq()));
app.delete('/api/enquiries/:id', auth, (q, s) => { fs.writeFileSync(ENQ, JSON.stringify(readEnq().filter(e => e.id !== q.params.id), null, 2)); s.json({ ok: true }) });
app.use((q, s) => q.path.startsWith('/api/') ? s.status(404).json({ error: 'Not found' }) : sendPage('notfound', 404)(q, s));
app.listen(PORT, () => console.log(`Site: http://localhost:${PORT}  Admin: http://localhost:${PORT}/admin.html`));
