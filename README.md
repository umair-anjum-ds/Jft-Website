# JFT Website (Node.js + Express)

Run locally:
    npm install
    ADMIN_PASSWORD="a-strong-password" npm start      (Windows PowerShell: $env:ADMIN_PASSWORD="a-strong-password"; npm start)

Site:   http://localhost:3000
Admin:  http://localhost:3000/admin.html

All site text and images live in data/content.json and uploads/. Back up both folders.
Host on any Node host with a persistent disk (VPS, Render with disk, Railway volume).

Security: use a password of 8+ characters, and serve the site over HTTPS (Cloudflare, Nginx + Let's Encrypt, or your host's built-in SSL).

SEO & going live
- Run behind Nginx with:  TRUST_PROXY=1 ADMIN_PASSWORD="..." PORT=3000 pm2 start server.js --name jft
- In the admin panel open "SEO & Google" and set Site Url to your real address (https://yourdomain.com).
- Pages are server-rendered, so Google and link previews see the full text. /sitemap.xml and /robots.txt are generated automatically.
- After launch: add the site to Google Search Console and submit https://yourdomain.com/sitemap.xml

Admin panel (WordPress-style): https://yourdomain.com/admin.html
- Pages, Services, Projects, News & Media, Careers: list tables with search, bulk actions, Add New, Edit, Duplicate, Draft/Published.
- Media library for photos, Enquiries inbox, Appearance (Menus, Footer), Settings, Profile (change password).

Design: colours follow the supplied mockup — navy #0a2a66, blue #0b63e5, tint #eef4fc, border #d5e0f2, Inter font.
Change them in public/style.css (the :root block at the top).

Pages: Home, About Us (Company Profile, Managing Director's Message, Vision & Mission, Accreditation, Quality / Health & Safety / Environmental / Sustainability policies),
Services, Projects (Our Projects, Team History), News & Media, Careers, Contact Us. Everything is editable in the admin panel (Pages, Services, Projects, News, Careers, Media).
All photos are uploaded through the admin Media library; nothing is linked from other websites.


## Deploying on Render

The app stores content, uploads, enquiries and the admin password **on disk**, so it needs a Render **paid web service with a persistent disk** (free instances lose everything on each restart/deploy).

1. Render Dashboard > New > Blueprint > select this repo (uses `render.yaml`), or create a Web Service manually:
   - Build: `npm ci`  Start: `npm start`  Health check path: `/healthz`
   - Disk: mount path `/var/data`, 1 GB
   - Environment: `DATA_DIR=/var/data`, `NODE_VERSION=22`, `ADMIN_PASSWORD=<strong password>`
2. On first boot the bundled `data/content.json` and `uploads/` are copied to the disk once. After that, edit everything from `/admin.html` - redeploys never overwrite it.
3. In Admin > Settings set **Website address** to your final URL (needed for sitemap/SEO), then add your custom domain in Render.
4. Back up the disk content (Admin has no export): Render snapshots the disk daily; also download `content.json` / uploads occasionally.

Note: a disk-backed service runs a single instance and redeploys with a few seconds of downtime.

## Git workflow

- `main` - production; Render auto-deploys from it. Changes arrive only through a PR from `develop`, tagged `vX.Y.Z`.
- `develop` - integration branch; feature PRs target it.
- Short-lived branches from `develop`: `feat/...`, `fix/...`, `chore/...`, `docs/...`, `ci/...`.
- Commit style: Conventional Commits (`feat: ...`, `fix: ...`).
- CI (GitHub Actions) must pass before merging.
