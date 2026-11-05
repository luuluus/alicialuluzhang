document.documentElement.classList.add('js');
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };


// Rotate the About photos
const photos = document.querySelectorAll('.photos img');
let cur = 0;
if (photos.length > 1) setInterval(() => {
  photos[cur].classList.remove('active');
  cur = (cur + 1) % photos.length;
  photos[cur].classList.add('active');
}, 5000);

// Highlight the taskbar link for the section you're reading
const links = document.querySelectorAll('.dock a[href^="#"]');
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) links.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-35% 0px -55% 0px' });
['home', 'projects', 'about', 'contact'].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });

// Drifting doodles in the background
if (!reduce) {
  const bits = ['✦', '♡', '☁', '✩', '✿', '☆'];
  const cols = ['#F0556A', '#A9C8F0', '#F5D44B', '#98BF7A', '#D9CCF2'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'float';
    s.textContent = bits[i % bits.length];
    s.style.left = (Math.random() * 96) + 'vw';
    s.style.fontSize = (16 + Math.random() * 22) + 'px';
    s.style.color = cols[i % cols.length];
    s.style.animationDuration = (22 + Math.random() * 26) + 's';
    s.style.animationDelay = (-Math.random() * 40) + 's';
    document.body.appendChild(s);
  }
}

// Contact form: sends without leaving the page (Formspree)
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form.addEventListener('submit', async e => {
  e.preventDefault();
  status.className = 'form-status';
  if (form.action.includes('YOUR_FORM_ID')) {
    status.textContent = 'The form is not connected yet. Please email me directly for now.';
    status.classList.add('err');
    return;
  }
  status.textContent = 'Sending…';
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('bad response');
    form.reset();
    status.textContent = 'Thanks! Your message was sent ✦';
    status.classList.add('ok');
  } catch (err) {
    status.textContent = 'Something went wrong. Please email me at alicia.lulu.zhang@gmail.com.';
    status.classList.add('err');
  }
});

// Project level-select: pick a tile, its full details open below
const slides = [...document.querySelectorAll('.slide')];
const picker = document.getElementById('picker');
const details = document.getElementById('details');
let current = 0;

slides.forEach((s, i) => {
  const img = s.querySelector('.polaroid img');
  const t = document.createElement('button');
  t.type = 'button';
  t.className = 'tile';
  t.setAttribute('aria-controls', 'details');
  t.innerHTML = '<span class="thumb"><img class="' + img.className + '" src="' + img.getAttribute('src') + '" alt=""></span>' +
    '<strong>' + s.querySelector('h3').textContent + '</strong>' +
    '<small>' + s.querySelector('.facts dd').textContent + '</small>';
  t.addEventListener('click', () => select(i, true));
  picker.appendChild(t);
});

function select(i, scroll) {
  current = i;
  slides.forEach((s, k) => s.classList.toggle('active', k === i));
  picker.querySelectorAll('.tile').forEach((t, k) => {
    t.classList.toggle('on', k === i);
    t.setAttribute('aria-pressed', String(k === i));
  });
  if (scroll) {
    const r = details.getBoundingClientRect();
    if (r.top > window.innerHeight * 0.55 || r.top < 0) details.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}
select(0, false);
