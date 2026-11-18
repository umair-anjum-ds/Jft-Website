// renderPage() and seoFor() come from render.js, which is loaded first
const after = {
  home(c) {
    const f = document.getElementById('hf'); if (!f) return; const m = document.getElementById('hfm');
    f.onsubmit = async e => {
      e.preventDefault(); m.className = 'fmsg'; m.textContent = 'Sending…'; const d = Object.fromEntries(new FormData(f));
      const body = { name: d.name, message: d.message, website: d.website, [/@/.test(d.contact) ? 'email' : 'phone']: d.contact };
      try {
        const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        f.reset(); m.className = 'fmsg ok'; m.textContent = c.contactPage.successText;
      } catch (x) { m.className = 'fmsg bad'; m.textContent = x.message || 'Could not send. Please call us instead.' }
    };
  },
  projects() {
    const chips = [...document.querySelectorAll('.chip')], cards = [...document.querySelectorAll('.pcard')];
    const show = f => { chips.forEach(b => b.classList.toggle('on', b.dataset.f === f)); cards.forEach(x => x.hidden = !!f && x.dataset.c !== f) };
    chips.forEach(b => b.onclick = () => show(b.dataset.f));
    const q = new URLSearchParams(location.search).get('cat'); if (q && chips.some(b => b.dataset.f === q)) show(q);
  },
  news() { document.querySelectorAll('.more').forEach(b => b.onclick = () => { const x = b.previousElementSibling; x.hidden = !x.hidden; b.textContent = x.hidden ? b.dataset.more : b.dataset.less }) },
  contact(c) {
    const f = document.getElementById('cf'), m = document.getElementById('fm');
    f.onsubmit = async e => {
      e.preventDefault(); m.className = 'fmsg'; m.textContent = 'Sending…';
      try {
        const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error);
        f.reset(); m.className = 'fmsg ok'; m.textContent = c.contactPage.successText;
      } catch (x) { m.className = 'fmsg bad'; m.textContent = x.message || 'Could not send. Please call us instead.' }
    };
  }
};

function render(c) {
  const pg = document.body.dataset.page || 'home';
  document.title = seoFor(c, pg).title;
  document.getElementById('app').innerHTML = renderPage(c, pg, location.pathname);
  const bb = document.getElementById('bb'), nv = document.getElementById('nav');
  bb.onclick = () => { const o = nv.classList.toggle('open'); bb.classList.toggle('on', o); bb.textContent = o ? '✕' : '☰'; bb.setAttribute('aria-expanded', o) };
  nv.onclick = e => { if (e.target.closest('a')) { nv.classList.remove('open'); bb.textContent = '☰'; bb.classList.remove('on') } };
  if (after[pg]) after[pg](c);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}
fetch('/api/content').then(r => r.json()).then(render).catch(() => document.getElementById('app').textContent = 'Unable to load content.');
