(() => {
  const KEY = 'resume-builder-v1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const form = $('#form');
  const paper = $('#paper');

  const blank = { name: '', title: '', email: '', phone: '', location: '', link: '', summary: '', skills: '', languages: '', experience: [{}], education: [{}], template: 'classic', accent: '#0B1F3A' };

  const example = {
    name: 'Ayesha Khan', title: 'Frontend Developer', email: 'ayesha.khan@example.com', phone: '+49 151 2345678', location: 'Berlin, Germany', link: 'linkedin.com/in/ayeshakhan',
    summary: 'Frontend developer with 5 years of experience building fast, accessible web apps for e-commerce and SaaS. I like turning messy requirements into clean interfaces that customers actually enjoy using.',
    skills: 'React, Next.js, TypeScript, Tailwind CSS, Node.js, PostgreSQL, Figma, Accessibility (WCAG)',
    languages: 'English (C1), German (B1), Urdu (native)',
    experience: [
      { role: 'Frontend Developer', company: 'Shoply GmbH', start: 'Mar 2023', end: 'Present', bullets: 'Rebuilt the checkout in Next.js, cutting cart abandonment by 18%\nLed the move to a shared design system used by 4 product teams\nImproved Largest Contentful Paint from 3.9s to 1.6s on mobile' },
      { role: 'Web Developer', company: 'Brightline Studio', start: 'Jun 2020', end: 'Feb 2023', bullets: 'Delivered 30+ client websites in React and WordPress\nBuilt a booking system that handles 2,000 appointments a month\nMentored two junior developers through their first year' },
    ],
    education: [{ degree: 'BS Computer Science', school: 'University of Sargodha', start: '2016', end: '2020' }],
    template: 'classic', accent: '#0B1F3A',
  };

  let state = load() || structuredClone(blank);

  function load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }

  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const lines = (s) => String(s || '').split('\n').map((x) => x.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

  // ---------- editor <-> state ----------
  function renderItems(kind) {
    const host = $('#' + kind);
    host.innerHTML = '';
    const tpl = $('#tpl-' + kind);
    state[kind].forEach((item, i) => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      $$('[data-k]', node).forEach((el) => { el.value = item[el.dataset.k] || ''; });
      node.addEventListener('input', (e) => { if (e.target.dataset.k) { state[kind][i][e.target.dataset.k] = e.target.value; update(); } });
      $('[data-del]', node).onclick = () => { state[kind].splice(i, 1); if (!state[kind].length) state[kind].push({}); renderItems(kind); update(); };
      $$('[data-move]', node).forEach((b) => b.onclick = () => {
        const j = i + Number(b.dataset.move); if (j < 0 || j >= state[kind].length) return;
        [state[kind][i], state[kind][j]] = [state[kind][j], state[kind][i]]; renderItems(kind); update();
      });
      host.appendChild(node);
    });
  }
  function fillForm() {
    ['name', 'title', 'email', 'phone', 'location', 'link', 'summary', 'skills', 'languages'].forEach((k) => { form.elements[k].value = state[k] || ''; });
    $('#template').value = state.template || 'classic';
    $('#accent').value = state.accent || '#0B1F3A';
    renderItems('experience'); renderItems('education');
  }
  form.addEventListener('input', (e) => { if (e.target.name) { state[e.target.name] = e.target.value; update(); } });
  $$('[data-add]').forEach((b) => b.onclick = () => { state[b.dataset.add].push({}); renderItems(b.dataset.add); update(); });
  $('#template').onchange = (e) => { state.template = e.target.value; update(); };
  $('#accent').oninput = (e) => { state.accent = e.target.value; update(); };

  // ---------- preview ----------
  function contactHtml() {
    return [state.email, state.phone, state.location, state.link].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('');
  }
  function sections() {
    const exp = state.experience.filter((e) => e.role || e.company || e.bullets);
    const edu = state.education.filter((e) => e.degree || e.school);
    const s = {};
    s.summary = state.summary ? `<h3>Profile</h3><p>${esc(state.summary)}</p>` : '';
    s.experience = exp.length ? `<h3>Experience</h3>${exp.map((e) => `<div class="entry"><div class="entry-head"><span>${esc(e.role)}${e.company ? ` <span class="sub">· ${esc(e.company)}</span>` : ''}</span><span>${esc([e.start, e.end].filter(Boolean).join(' – '))}</span></div>${lines(e.bullets).length ? `<ul>${lines(e.bullets).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>`).join('')}` : '';
    s.education = edu.length ? `<h3>Education</h3>${edu.map((e) => `<div class="entry"><div class="entry-head"><span>${esc(e.degree)}</span><span>${esc([e.start, e.end].filter(Boolean).join(' – '))}</span></div><div class="sub">${esc(e.school)}</div></div>`).join('')}` : '';
    s.skills = list(state.skills).length ? `<h3>Skills</h3><div class="tags">${list(state.skills).map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '';
    s.languages = list(state.languages).length ? `<h3>Languages</h3><div class="tags">${list(state.languages).map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '';
    return s;
  }
  function renderPreview() {
    const t = state.template || 'classic';
    paper.className = 'paper ' + t;
    paper.style.setProperty('--accent', state.accent || '#0B1F3A');
    const s = sections();
    const name = state.name ? esc(state.name) : '<span class="empty">Your name</span>';
    const role = state.title ? `<div class="role">${esc(state.title)}</div>` : '';
    if (t === 'modern') {
      paper.innerHTML = `<aside class="side"><h1>${name}</h1>${role}<div class="contact">${contactHtml()}</div>${s.skills}${s.languages}</aside><div class="main">${s.summary}${s.experience}${s.education}</div>`;
    } else if (t === 'compact') {
      paper.innerHTML = `<div class="head"><div><h1>${name}</h1>${role}</div><div class="contact">${contactHtml()}</div></div>${s.summary}${s.experience}${s.education}${s.skills}${s.languages}`;
    } else {
      paper.innerHTML = `<h1>${name}</h1>${role}<div class="contact">${contactHtml()}</div>${s.summary}${s.experience}${s.education}${s.skills}${s.languages}`;
    }
  }

  // ---------- checker ----------
  const weak = /^(responsible for|worked on|helped( with)?|assisted( with)?|involved in|participated in|tasked with|duties included|in charge of)\b/i;
  function check() {
    const tips = [];
    const add = (ok, text) => tips.push({ ok, text });
    const bullets = state.experience.flatMap((e) => lines(e.bullets));
    add(!!(state.name && state.email && state.phone), state.name && state.email && state.phone ? 'Name, email and phone are filled in.' : 'Add your name, email and phone so recruiters can reach you.');
    const sw = String(state.summary || '').split(/\s+/).filter(Boolean).length;
    add(sw >= 25 && sw <= 80, sw ? `Profile is ${sw} words${sw < 25 ? '. Add a bit more: what you do and one result.' : sw > 80 ? '. Trim it to under 80 words.' : '.'}` : 'Add a short profile of 2 to 3 sentences.');
    add(bullets.length >= 3, bullets.length >= 3 ? `${bullets.length} achievement bullets.` : 'Add at least 3 achievement bullets across your jobs.');
    const withNumbers = bullets.filter((b) => /\d/.test(b)).length;
    add(bullets.length && withNumbers / bullets.length >= 0.4, bullets.length ? `${withNumbers} of ${bullets.length} bullets include numbers${withNumbers / bullets.length < 0.4 ? '. Add results like %, time saved, users or revenue.' : '.'}` : 'Numbers make achievements believable. Add some once you write bullets.');
    const weakOnes = bullets.filter((b) => weak.test(b));
    add(!weakOnes.length, weakOnes.length ? `Start with a strong verb instead of "${weakOnes[0].split(' ').slice(0, 2).join(' ')}…". Try: Built, Led, Cut, Grew, Launched.` : 'Bullets start with action verbs.');
    const iStart = bullets.filter((b) => /^(i|my|we)\b/i.test(b));
    add(!iStart.length, iStart.length ? 'Drop "I" or "My" at the start of bullets. Write "Built…", not "I built…".' : 'No first-person bullets.');
    const long = bullets.filter((b) => b.split(/\s+/).length > 28);
    add(!long.length, long.length ? `${long.length} bullet(s) are over 28 words. Split or shorten them.` : 'Bullets are short enough to skim.');
    const skills = list(state.skills).length;
    add(skills >= 5, skills >= 5 ? `${skills} skills listed.` : 'List at least 5 skills that match the jobs you apply for (ATS systems search for them).');
    add(!!state.link, state.link ? 'Profile link included.' : 'Add your LinkedIn or portfolio link.');
    const score = Math.round((tips.filter((t) => t.ok).length / tips.length) * 100);
    const badge = $('#scoreBadge');
    badge.textContent = score;
    badge.className = 'badge ' + (score >= 80 ? 'good' : score >= 50 ? 'mid' : '');
    $('#tips').innerHTML = tips.sort((a, b) => a.ok - b.ok).map((t) => `<li class="${t.ok ? 'ok' : 'bad'}">${esc(t.text)}</li>`).join('');
  }

  function update() { renderPreview(); check(); save(); }

  // ---------- actions ----------
  $('#pdf').onclick = () => {
    const prev = document.title;
    document.title = (state.name || 'resume').replace(/\s+/g, '-') + '-CV';
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  };
  $('#sample').onclick = () => {
    if (state.name && !confirm('Replace your current resume with the example?')) return;
    state = structuredClone(example); fillForm(); update();
  };
  $('#exportJson').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (state.name || 'resume').replace(/\s+/g, '-') + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#importJson').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      state = { ...structuredClone(blank), ...data };
      if (!Array.isArray(state.experience) || !state.experience.length) state.experience = [{}];
      if (!Array.isArray(state.education) || !state.education.length) state.education = [{}];
      fillForm(); update();
    } catch { alert('That file could not be opened. Choose a .json file saved from this builder.'); }
    e.target.value = '';
  };

  fillForm();
  update();
})();
