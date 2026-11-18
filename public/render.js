const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (u, alt = '') => u ? `<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy">` : `<div class="ph"></div>`;
const bg = u => u ? ` style="background-image:url('${esc(u)}')"` : '';
const norm = h => { if (!h || h[0] === '#') return null; return h.split(/[#?]/)[0].replace(/\.html$/, '').replace(/\/+$/, '') || '/' };
let here = '/';
const isOn = n => norm(n.href) === here || (n.children || []).some(k => norm(k.href) === here && here !== '/');

/* ---------- shared blocks ---------- */
const CIRC = `<svg class="circ" aria-hidden="true" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMid slice" fill="none" stroke="#4b92ff" stroke-width="1.5" stroke-opacity=".5"><path d="M600 60H430l-40 40H300M600 150H470l-30 30H360M600 250H500l-40-40H400M600 330H520M600 20H540"/><g fill="#0b63e5" stroke="none"><circle cx="300" cy="100" r="5"/><circle cx="360" cy="180" r="5"/><circle cx="400" cy="210" r="5"/><circle cx="520" cy="330" r="5"/></g></svg>`;
const ICONS = {
  fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7 2 0 3 2 2 4-1 2-3 3-6 3zM14 12c4 0 7 1 7 4 0 2-2 3-4 2-2-1-3-3-3-6zM12 14c0 4-1 7-4 7-2 0-3-2-2-4 1-2 3-3 6-3zM10 12c-4 0-7-1-7-4 0-2 2-3 4-2 2 1 3 3 3 6z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', drop: '<path d="M12 3s6 6.3 6 10.5A6 6 0 0 1 6 13.5C6 9.3 12 3 12 3z"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8a2.1 2.1 0 0 1-3-3l8-8z"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>'
};
const LBL_DEFAULT = {"requestQuote": "Request a quote ›", "viewAllProjects": "View all projects", "applyNow": "Apply Now ›", "openPositions": "Open Positions", "ourValues": "Our values", "ourTeam": "Our team", "readMore": "Read more", "showLess": "Show less", "filterAll": "All", "phoneLabel": "Phone", "emailLabel": "Email", "officeLabel": "Office", "addressLabel": "Address", "hoursLabel": "Working hours", "sendEnquiry": "Send enquiry", "formName": "Your name", "formContact": "Email or phone", "formMessage": "What do you need installed or maintained?", "sendMessage": "Send Message ›", "formEmail": "Email", "formPhone": "Phone", "formHelp": "How can we help?", "home": "Home", "backHome": "Back to home ›", "notFoundTitle": "Page not found", "notFoundText": "The page you are looking for does not exist."};
let LB = LBL_DEFAULT;
const paras = t => String(t || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');
const icon = n => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.wrench}</svg>`;
const banner = (b, label) => `<section class="pbanner"${bg(b.image)}>${CIRC}<div class="wrap"><div class="crumb"><a href="/">${esc(LB.home)}</a> › ${esc(label)}</div><h1>${esc(b.title)}</h1>${b.subtitle ? `<p>${esc(b.subtitle)}</p>` : ''}</div></section>`;
const ctaHTML = c => `<section class="cta"><div class="wrap"><h2>${esc(c.cta.title)}</h2><a class="btn" href="/contact">${esc(c.cta.button)} ›</a></div></section>`;
const whyHTML = c => { const why = c.why; return `<section class="pad" id="why"${''}><div class="wrap why">
  <div><div class="label">${esc(why.label)}</div><h2>${esc(why.title)}</h2><p class="intro">${esc(why.text)}</p>
  ${why.items.map(i => `<div class="item"><div class="mark">»</div><div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div></div>`).join('')}</div>
  <div>${img(why.image, why.title)}</div></div></section>` };
const licHTML = c => `<section class="pad creds"><div class="wrap"><div class="sec-h"><h2>${esc(c.licence.title)}</h2></div>
  <div class="cgrid">${c.licence.items.map(i => `<div><small>${esc(i.label)}</small><b>${esc(i.value)}</b></div>`).join('')}</div></div></section>`;

function shell(c, main) {
  const { site, nav, footer } = c, cta = site.cta || { label: 'Request a quote', href: '/contact' };
  const top = site.showTopBar ? `<div class="topbar"><div class="wrap">
    <div class="tinfo">${site.phones.map(p => `<a href="tel:${esc(p.replace(/[^+\d]/g, ''))}"><i>✆</i>${esc(p)}</a>`).join('')}<a href="mailto:${esc(site.email)}"><i>✉</i>${esc(site.email)}</a></div>
    <div class="tsoc">${site.social.map(s => `<a href="${esc(s.href)}" aria-label="${esc(s.label)}" title="${esc(s.label)}">${esc(s.icon)}</a>`).join('')}</div></div></div>` : '';
  return `${top}
  <header><div class="wrap nrow">
    <a class="logo" href="/" aria-label="${esc(site.name)} home">${site.logo ? `<img src="${esc(site.logo)}" alt="${esc(site.name)}">` : ''}<span class="lt"><b>${esc(site.name)}</b><small>${esc(site.tagline)}</small></span></a>
    <button class="burger" id="bb" aria-label="Menu" aria-expanded="false">☰</button>
    <nav id="nav">${nav.map(n => n.children && n.children.length
      ? `<div class="dd"><a class="${isOn(n) ? 'on' : ''}" href="${esc(n.href)}">${esc(n.label)} <span class="car">⌄</span></a><div class="drop">${n.children.map(k => `<a href="${esc(k.href)}">${esc(k.label)}</a>`).join('')}</div></div>`
      : `<a class="${isOn(n) ? 'on' : ''}" href="${esc(n.href)}">${esc(n.label)}</a>`).join('')}<a class="btn sm navcta" href="${esc(cta.href)}">${esc(cta.label)}</a></nav>
  </div></header>
  <main>${main}</main>
  <footer class="foot"><div class="wrap"><span>${esc(footer.copyright)}</span><nav class="fl" aria-label="Footer">${footer.links.map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</nav></div></footer>`;
}

/* ---------- pages ---------- */
const pages = {
  home: c => {
    const { hero, about, services, why, sectors, projects, site, footer } = c;
    const proc = c.process || { title: '', intro: '', items: [] }, ch = c.contactHome || { title: 'Contact us', text: '' };
    const paras = String(about.text || '').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('');
    const card = i => `<article class="pcard"><div class="pimg">${img(i.image, i.title)}</div><div class="pb"><h3>${esc(i.title)}</h3><div class="meta">${[i.category, i.location, i.year].filter(Boolean).map(esc).join(' · ')}</div><p>${esc(i.description)}</p></div></article>`;
    const secs = {
      hero: () => `<section class="hero"${bg(hero.image)}>${CIRC}<div class="wrap">
    <div class="kick">${esc(hero.kicker)}</div><h1>${esc(hero.title)}</h1><p>${esc(hero.text)}</p>
    <div class="btns"><a class="btn" href="/contact">${esc(hero.button1)}</a><a class="btn out" href="/services">${esc(hero.button2)}</a></div></div></section>
    ${(hero.stats || []).length ? `<div class="wrap statwrap"><div class="stats4">${hero.stats.map(s => `<div><b>${esc(s.value)}</b><small>${esc(s.label)}</small></div>`).join('')}</div></div>` : ''}`,
      services: () => `<section class="sec" id="services"><div class="wrap">
    <h2 class="h2">${esc(services.title)}</h2><p class="sub">${esc(services.intro)}</p><div class="rule"></div>
    <div class="svgrid">${services.items.map((s, i) => `<article class="svc"><div class="svimg">${img(s.image, s.title)}</div><div class="svico">${icon(s.icon)}</div>
      <h3><a href="/services#service-${i + 1}">${esc(s.title)}</a></h3><p>${esc(s.description)}</p><ul>${(s.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul></article>`).join('')}</div></div></section>`,
      about: () => `<section class="sec tint" id="about"><div class="wrap two">
    <div><h2 class="h2">${esc(about.title)}</h2>${paras}<div class="aimg">${img(about.image, about.title)}</div></div>
    <div class="quals">${why.items.map(i => `<div class="qual"><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`).join('')}</div></div></section>`,
      process: () => `<section class="sec" id="process"><div class="wrap"><h2 class="h2">${esc(proc.title)}</h2><p class="sub">${esc(proc.intro)}</p>
    <ol class="steps">${proc.items.map((s, i) => `<li><span class="sn">${i + 1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol></div></section>`,
      sectors: () => `<section class="sec tint" id="sectors"><div class="wrap"><h2 class="h2">${esc(sectors.title)}</h2><p class="sub">${esc(sectors.text)}</p>
    <div class="pills">${sectors.items.map(i => `<span>${esc(i.title)}</span>`).join('')}</div></div></section>`,
      projects: () => `<section class="sec" id="projects"><div class="wrap"><h2 class="h2">${esc(projects.homeTitle || 'Selected projects')}</h2><p class="sub">${esc(projects.homeIntro || '')}</p>
    <div class="pgrid">${projects.items.slice(0, 3).map(card).join('')}</div>${(m => m ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" title="Project video" loading="lazy" allowfullscreen></iframe></div>` : '')(String(projects.homeVideo || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/))}${projects.items.length ? `<p style="margin-top:28px"><a class="btn out dark" href="/projects">${esc(LB.viewAllProjects)}</a></p>` : ''}</div></section>`,
      contact: () => `<section class="sec navy" id="contact"><div class="wrap two">
    <div><h2 class="h2">${esc(ch.title)}</h2><p>${esc(ch.text)}</p>
      <p class="cl">${esc(LB.phoneLabel)}: ${site.phones.map(p => `<a href="tel:${esc(p.replace(/[^+\d]/g, ''))}">${esc(p)}</a>`).join(' / ')}<br>${esc(LB.emailLabel)}: <a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>${esc(LB.officeLabel)}: ${esc(footer.address)}</p></div>
    <form class="hform" id="hf"><input name="name" placeholder="${esc(LB.formName)}" required maxlength="100" aria-label="${esc(LB.formName)}"><input name="contact" placeholder="${esc(LB.formContact)}" required maxlength="150" aria-label="${esc(LB.formContact)}">
      <textarea name="message" placeholder="${esc(LB.formMessage)}" required maxlength="2000" aria-label="${esc(LB.formMessage)}"></textarea>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn" type="submit">${esc(LB.sendEnquiry)}</button><div class="fmsg" id="hfm" role="status"></div></form></div></section>`,
      why: () => whyHTML(c), licence: () => licHTML(c), cta: () => ctaHTML(c)
    };
    const order = (c.layout && c.layout.home) || Object.keys(secs).map(s => ({ section: s, visible: true }));
    return order.filter(o => o.visible !== false && secs[o.section]).map(o => secs[o.section]()).join('');
  },

  about: c => {
    const a = c.aboutPage;
    return banner(a.banner, 'About Us') + `
  <section class="about"><div class="wrap">
    <div><div class="label">${esc(a.intro.label)}</div><h2>${esc(a.intro.title)}</h2><p>${esc(a.intro.text)}</p></div>
    <div>${img(a.intro.image, a.intro.title)}</div></div></section>
  <section class="pad"><div class="wrap duo">
    <div class="mv"><h3>${esc(a.mission.title)}</h3><p>${esc(a.mission.text)}</p></div>
    <div class="mv"><h3>${esc(a.vision.title)}</h3><p>${esc(a.vision.text)}</p></div></div></section>
  <section class="stats"><div class="wrap">${a.stats.map(s => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div></section>
  ${whyHTML(c)}${licHTML(c)}${ctaHTML(c)}`;
  },

  services: c => {
    const s = c.servicesPage;
    return banner(s.banner, 'Services') + `<section class="pad"><div class="wrap"><p class="lead">${esc(s.intro)}</p>
    ${c.services.items.map((it, i) => `<article class="srow ${i % 2 ? 'rev' : ''}" id="service-${i + 1}"><div class="frame">${img(it.image, it.title)}</div>
      <div><h2>${esc(it.title)}</h2><p>${esc(it.description)}</p>
      <ul class="pts">${(it.points || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul><a class="btn" href="/contact">${esc(LB.requestQuote)}</a></div></article>`).join('')}
    </div></section>` + ctaHTML(c);
  },

  projects: c => {
    const p = c.projects, cats = [...new Set(p.items.map(i => i.category).filter(Boolean))];
    return banner(p.banner, 'Projects') + `<section class="pad"><div class="wrap"><p class="lead">${esc(p.intro)}</p>
    <div class="filters" id="filters"><button class="chip on" data-f="">${esc(LB.filterAll)}</button>${cats.map(k => `<button class="chip" data-f="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="pgrid">${p.items.map(i => `<article class="pcard" data-c="${esc(i.category)}"><div class="pimg">${img(i.image, i.title)}${i.category ? `<span class="tag">${esc(i.category)}</span>` : ''}</div>
      <div class="pb"><h3>${esc(i.title)}</h3><div class="meta">${[i.location, i.year].filter(Boolean).map(esc).join(' · ')}</div><p>${esc(i.description)}</p></div></article>`).join('')}</div>
    ${p.items.length ? '' : '<p>Projects coming soon.</p>'}</div></section>` + ctaHTML(c);
  },

  news: c => {
    const n = c.news;
    return banner(n.banner, 'News & Media') + `<section class="pad"><div class="wrap"><p class="lead">${esc(n.intro)}</p>
    <div class="ngrid">${n.items.map(i => `<article class="ncard"><div class="nimg">${img(i.image, i.title)}</div><div class="pb">
      <div class="meta">${[i.date, i.category].filter(Boolean).map(esc).join(' · ')}</div><h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p>
      ${i.body ? `<div class="nbody" hidden>${esc(i.body)}</div><button class="more" data-more="${esc(LB.readMore)}" data-less="${esc(LB.showLess)}">${esc(LB.readMore)}</button>` : ''}</div></article>`).join('')}</div>
    ${n.items.length ? '' : '<p>No news yet.</p>'}</div></section>` + ctaHTML(c);
  },

  careers: c => {
    const r = c.careers;
    return banner(r.banner, 'Careers') + `<section class="pad"><div class="wrap"><p class="lead">${esc(r.intro)}</p>
    <div class="ben">${r.benefits.map(b => `<div>${esc(b)}</div>`).join('')}</div>
    <div class="sec-h"><h2>${esc(LB.openPositions)}</h2></div>
    ${r.openings.map(o => `<article class="job"><div><h3>${esc(o.title)}</h3><div class="meta">${[o.location, o.type].filter(Boolean).map(esc).join(' · ')}</div><p>${esc(o.description)}</p></div>
      <a class="btn" href="mailto:${esc(r.applyEmail)}?subject=${encodeURIComponent('Application: ' + o.title)}">${esc(LB.applyNow)}</a></article>`).join('')}
    ${r.openings.length ? '' : `<p>There are no openings right now. You can still send your CV to <a href="mailto:${esc(r.applyEmail)}">${esc(r.applyEmail)}</a>.</p>`}
    </div></section>`;
  },

  contact: c => {
    const k = c.contactPage, f = c.footer;
    return banner(k.banner, 'Contact Us') + `<section class="pad"><div class="wrap cgrid2">
    <div><p class="lead" style="margin-bottom:34px">${esc(k.intro)}</p>
      <div class="ci"><div class="mark">📍</div><div><b>${esc(LB.addressLabel)}</b>${esc(f.address)}</div></div>
      <div class="ci"><div class="mark">📞</div><div><b>${esc(LB.phoneLabel)}</b>${f.phones.map(p => `<a href="tel:${esc(p.replace(/[^+\d]/g, ''))}">${esc(p)}</a>`).join('<br>')}</div></div>
      <div class="ci"><div class="mark">✉</div><div><b>${esc(LB.emailLabel)}</b><a href="mailto:${esc(f.email)}">${esc(f.email)}</a></div></div>
      <div class="ci"><div class="mark">🕘</div><div><b>${esc(LB.hoursLabel)}</b>${esc(k.hours)}</div></div></div>
    <form class="cform" id="cf"><h2>${esc(k.formTitle)}</h2>
      <input name="name" placeholder="${esc(LB.formName)}" required maxlength="100"><input name="email" type="email" placeholder="${esc(LB.formEmail)}" maxlength="150">
      <input name="phone" type="tel" placeholder="${esc(LB.formPhone)}" maxlength="40"><textarea name="message" placeholder="${esc(LB.formHelp)}" required maxlength="2000"></textarea>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn" type="submit">${esc(LB.sendMessage)}</button><div class="fmsg" id="fm" role="status"></div></form>
    </div></section>`;
  }
};



pages.directors = c => { const d = c.directorPage; return banner(d.banner, 'Managing Director’s Message') + `<section class="pad"><div class="wrap mdgrid"><div class="mdcard">${img(d.image, d.name)}<h3>${esc(d.name)}</h3><div class="meta">${esc(d.role)}</div></div><div class="msg">${paras(d.message)}</div></div></section>` + ctaHTML(c) };
pages.vision = c => { const v = c.visionPage; return banner(v.banner, 'Vision & Mission') + `<section class="pad"><div class="wrap duo"><div class="mv"><h3>${esc(v.vision.title)}</h3><p>${esc(v.vision.text)}</p></div><div class="mv"><h3>${esc(v.mission.title)}</h3><p>${esc(v.mission.text)}</p></div></div></section>
  <section class="pad creds"><div class="wrap"><div class="sec-h"><h2>${esc(LB.ourValues)}</h2></div><div class="cgrid">${v.values.map(x => `<div><b>${esc(x.title)}</b><small style="margin-top:6px">${esc(x.text)}</small></div>`).join('')}</div></div></section>` + ctaHTML(c) };
pages.accreditation = c => { const a = c.accreditationPage; return banner(a.banner, 'Accreditation') + `<section class="pad"><div class="wrap"><p class="lead">${esc(a.intro)}</p>${a.certificates.length ? `<div class="pgrid">${a.certificates.map(x => `<article class="pcard"><div class="pimg">${img(x.image, x.title)}</div><div class="pb"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></article>`).join('')}</div>` : ''}</div></section>` + licHTML(c) + ctaHTML(c) };
[['quality', 'Quality Policy'], ['safety', 'Health and Safety Policy'], ['environmental', 'Environmental Policy'], ['sustainability', 'Sustainability Policy']].forEach(([k, l]) => {
  pages[k] = c => { const p = c.policies[k]; return banner(p.banner, l) + `<section class="pad"><div class="wrap two"><div><p class="lead" style="margin-bottom:18px">${esc(p.intro)}</p>${paras(p.statement)}<ul class="pts">${p.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div>${img(p.image, p.banner.title)}</div></div></section>` + ctaHTML(c) };
});
pages.team = c => { const t = c.teamPage; return banner(t.banner, 'Team History') + `<section class="pad"><div class="wrap"><p class="lead">${esc(t.intro)}</p>
  <ol class="tl">${t.milestones.map(m => `<li><span class="yr">${esc(m.year)}</span><div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></div></li>`).join('')}</ol>
  ${t.team.length ? `<div class="sec-h" style="margin-top:56px"><h2>${esc(LB.ourTeam)}</h2></div><div class="pgrid">${t.team.map(m => `<article class="pcard"><div class="pimg">${img(m.image, m.name)}</div><div class="pb"><h3>${esc(m.name)}</h3><div class="meta">${esc(m.role)}</div><p>${esc(m.text)}</p></div></article>`).join('')}</div>` : ''}</div></section>` + ctaHTML(c) };
pages.notfound = c => banner({ title: LB.notFoundTitle, subtitle: LB.notFoundText }, LB.notFoundTitle) + `<section class="pad"><div class="wrap"><a class="btn" href="/">${esc(LB.backHome)}</a></div></section>`;

function seoFor(c, pg) {
  const s = (c.seo && c.seo.pages && c.seo.pages[pg]) || {}, n = c.site.name;
  const d = { home: [`${n} – ${c.hero.kicker} in the UAE`, c.hero.text], about: [`About Us – ${n}`, c.aboutPage.intro.text], services: [`Services – ${n}`, c.servicesPage.intro],
    projects: [`Projects – ${n}`, c.projects.intro], news: [`News & Media – ${n}`, c.news.intro], careers: [`Careers – ${n}`, c.careers.intro],
    contact: [`Contact Us – ${n}`, c.contactPage.intro], directors: [`Managing Director’s Message – ${n}`, ''], vision: [`Vision & Mission – ${n}`, ''], accreditation: [`Accreditation – ${n}`, ''], quality: [`Quality Policy – ${n}`, ''], safety: [`Health and Safety Policy – ${n}`, ''], environmental: [`Environmental Policy – ${n}`, ''], sustainability: [`Sustainability Policy – ${n}`, ''], team: [`Team History – ${n}`, ''], notfound: [`Page not found – ${n}`, ''] }[pg] || [n, c.hero.text];
  return { title: s.title || d[0], description: String(s.description || d[1] || '').slice(0, 160) };
}
function publicContent(c) {
  const pub = a => (a || []).filter(x => !x.draft);
  return { ...c, services: { ...c.services, items: pub(c.services.items) }, projects: { ...c.projects, items: pub(c.projects.items) },
    news: { ...c.news, items: pub(c.news.items) }, careers: { ...c.careers, openings: pub(c.careers.openings) } };
}
function renderPage(c, pg, pathname) { c = publicContent(c); LB = { ...LBL_DEFAULT, ...(c.labels || {}) }; here = norm(pathname || '/'); return shell(c, (pages[pg] || pages.notfound)(c)); }

if (typeof module !== 'undefined' && module.exports) module.exports = { renderPage, seoFor, publicContent }; else window.JFT = { renderPage, seoFor, publicContent };
