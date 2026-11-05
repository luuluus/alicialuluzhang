/* =====================================================================
   Game detail pages.

   Sections:
     1. Shared setup
     2. Click to expand (photos AND videos)
     3. Header slideshow (turned on/off in the HTML)
     4. Looping videos (play when on screen, pause when off screen)
   ===================================================================== */


/* ---------- 1. SHARED SETUP ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ---------- 2. CLICK TO EXPAND ---------- */
const box = document.createElement('dialog');
box.className = 'lightbox';
box.innerHTML = '<img alt=""><video controls loop muted playsinline></video><p></p>';
document.body.appendChild(box);
const boxImg = box.querySelector('img');
const boxVid = box.querySelector('video');
const boxCap = box.querySelector('p');

function openBox(el) {
  const isVideo = el.tagName === 'VIDEO';
  boxImg.style.display = isVideo ? 'none' : 'block';
  boxVid.style.display = isVideo ? 'block' : 'none';

  if (isVideo) {
    boxVid.src = el.currentSrc || el.querySelector('source')?.src || '';
    boxVid.poster = el.poster || '';
    boxVid.play().catch(() => {});
  } else {
    boxImg.src = el.src;
    boxImg.alt = el.alt;
  }

  boxCap.textContent = el.closest('figure')?.querySelector('figcaption')?.textContent || '';
  box.showModal();
}

// every photo or video in a .shot frame, plus the header picture(s)
document.querySelectorAll('.shot img, .shot video, .hero-img').forEach(el => {
  const name = el.alt || el.closest('figure')?.querySelector('figcaption')?.textContent || 'picture';
  el.tabIndex = 0;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', 'Expand: ' + name);
  el.addEventListener('click', () => openBox(el));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBox(el); }
  });
});

box.addEventListener('click', e => { if (e.target !== boxVid) box.close(); });  // video controls stay clickable
box.addEventListener('close', () => { boxVid.pause(); boxVid.removeAttribute('src'); boxVid.load(); });


/* ---------- 3. HEADER SLIDESHOW ----------
   Controlled by the HTML: data-slideshow="on|off", data-autoplay="on|off", data-interval="5000" */
const shows = [];

document.querySelectorAll('.slideshow').forEach(show => {
  const slides = [...show.querySelectorAll('.hero-img')];
  const on = show.dataset.slideshow !== 'off' && slides.length > 1;

  // OFF (or only one picture): a plain still image
  if (!on) {
    show.classList.add('still');
    slides.forEach((s, k) => s.classList.toggle('active', k === 0));
    return;
  }

  slides.forEach(s => { s.loading = 'eager'; });
  const stage = show.querySelector('.ss-stage');
  const interval = Number(show.dataset.interval) || 5000;
  let autoplay = show.dataset.autoplay !== 'off' && !reduceMotion;
  let i = 0, timer = null;

  // arrows
  const prev = Object.assign(document.createElement('button'), { type: 'button', className: 'ss-btn prev', textContent: '‹' });
  const next = Object.assign(document.createElement('button'), { type: 'button', className: 'ss-btn next', textContent: '›' });
  prev.setAttribute('aria-label', 'Previous picture');
  next.setAttribute('aria-label', 'Next picture');
  stage.append(prev, next);

  // dots + pause button
  const bar = document.createElement('div');
  bar.className = 'ss-bar';
  const dots = document.createElement('div');
  dots.className = 'ss-dots';
  slides.forEach((s, k) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Show picture ' + (k + 1));
    d.addEventListener('click', () => { go(k); restart(); });
    dots.appendChild(d);
  });
  bar.appendChild(dots);

  let playBtn = null;
  if (show.dataset.autoplay !== 'off' && !reduceMotion) {
    playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'ss-play';
    playBtn.addEventListener('click', () => { autoplay = !autoplay; autoplay ? start() : stop(); label(); });
    bar.appendChild(playBtn);
  }
  show.appendChild(bar);

  function label() {
    if (!playBtn) return;
    playBtn.textContent = autoplay ? '⏸ pause' : '▶ play';
    playBtn.setAttribute('aria-pressed', String(!autoplay));
  }
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    dots.querySelectorAll('button').forEach((d, k) => d.classList.toggle('on', k === i));
  }
  function start() { stop(); if (autoplay) timer = setInterval(() => { if (!document.hidden) go(i + 1); }, interval); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { if (autoplay) start(); }

  prev.addEventListener('click', () => { go(i - 1); restart(); });
  next.addEventListener('click', () => { go(i + 1); restart(); });
  show.addEventListener('mouseenter', stop);
  show.addEventListener('mouseleave', restart);
  show.addEventListener('focusin', stop);
  show.addEventListener('focusout', restart);

  // swipe on phones
  let x0 = null;
  show.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  show.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) { go(dx < 0 ? i + 1 : i - 1); restart(); }
    x0 = null;
  });

  go(0); label(); start();
  shows.push({ step: d => { go(i + d); restart(); } });
});

// left / right arrow keys change the header picture
document.addEventListener('keydown', e => {
  if (!shows.length || box.open) return;
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'ArrowLeft') shows[0].step(-1);
  if (e.key === 'ArrowRight') shows[0].step(1);
});


/* ---------- 4. LOOPING VIDEOS ----------
   Any <video class="loop-video"> (in a design step, a gallery, or the header slideshow)
   plays while it is on screen and pauses when it is not. */
const loopVideos = document.querySelectorAll('video.loop-video');

if (loopVideos.length) {
  const watcher = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) en.target.play().catch(() => {}); else en.target.pause();
  }), { threshold: 0.35 });

  loopVideos.forEach(v => {
    v.muted = true;  // browsers only autoplay muted videos
    if (reduceMotion) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
    watcher.observe(v);
  });
}