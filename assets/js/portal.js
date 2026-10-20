(() => {
  const portal = document.getElementById('portal');
  if (!portal || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = s => portal.querySelector(s);
  const win = $('.win'), media = $('.media'), ring = $('.ring'), intro = $('.intro'), cue = $('.cue');
  const scenes = [...portal.querySelectorAll('.scene')], sc = $('.scenes'), video = $('video'), cv = $('#portalStars'), ctx = cv.getContext('2d');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);

  // video (optional): drop assets/video/intro.mp4 and it takes over
  const showVideo = () => { portal.classList.add('has-video'); video.play().catch(() => {}); };
  if (video.readyState >= 2) showVideo();
  ['loadeddata', 'canplay', 'playing'].forEach(ev => video.addEventListener(ev, showVideo, { once: true }));
  video.play().then(showVideo).catch(() => {});

  // star warp (fallback + overlay)
  let W, H, stars = [];
  const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; };
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < 420; i++) stars.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() });

  let target = 0, p = 0, vel = 0, last = 0, mx = 0, my = 0;
  const readScroll = () => {
    const r = portal.getBoundingClientRect(), total = r.height - innerHeight;
    target = clamp(-r.top / total);
  };
  addEventListener('scroll', readScroll, { passive: true }); readScroll();
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  $('.skip').addEventListener('click', () => {
    const h = document.getElementById('hero'); if (h) h.scrollIntoView({ behavior: 'smooth' });
  });

  function frame() {
    p += (target - p) * .09; vel = Math.abs(target - p);
    // phase A: small window expands to fullscreen
    const a = ease(clamp(p / .3));
    const ix = 28 * (1 - a), iy = 34 * (1 - a), rad = 22 * (1 - a);
    win.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${rad}px)`;
    ring.style.cssText = `top:${iy}%;left:${ix}%;right:${ix}%;bottom:${iy}%;border-radius:${rad}px;opacity:${1 - clamp(p / .3)}`;
    intro.style.opacity = 1 - clamp(p / .12); intro.style.transform = `translateY(${-p * 300}px)`;
    cue.style.opacity = 1 - clamp(p / .08);
    // zoom into the video the whole way
    const z = 1 + p * 1.1, fade = 1 - ease(clamp((p - .88) / .12));
    media.style.transform = `scale(${z})`; media.style.opacity = fade;
    // 3D scenes fly toward the camera, inside the video
    sc.style.transform = `rotateX(${-my * 6}deg) rotateY(${mx * 8}deg)`;
    scenes.forEach((s, i) => {
      const t = clamp((p - (.28 + i * .2)) / .28), zz = -1200 + t * 1900;
      const o = clamp(t * 4) * clamp((1 - t) * 3);
      s.style.opacity = o;
      s.style.transform = `translate(-50%,-50%) translateZ(${zz}px) rotateY(${(t - .5) * -14}deg)`;
    });
    // starfield
    ctx.clearRect(0, 0, W, H);
    const speed = .0016 + p * .004 + vel * .5, f = Math.min(W, H) * .9;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(183,148,255,.7)';
    for (const s of stars) {
      const pz = s.z; s.z -= speed; if (s.z <= .02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; continue; }
      const x = W / 2 + s.x / s.z * f * .5, y = H / 2 + s.y / s.z * f * .5;
      const px = W / 2 + s.x / pz * f * .5, py = H / 2 + s.y / pz * f * .5;
      ctx.globalAlpha = clamp(1.2 - s.z); ctx.lineWidth = Math.max(.6, (1 - s.z) * 2.2);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    }
    requestAnimationFrame(frame);
  }
  frame();

  // 3D tilt on every card
  const sel = '.skill-card,.showcase-card,.project-card,.timeline-card,.contact-card,.research-card';
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transition = 'transform .08s linear';
      el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateZ(14px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; el.style.transition = ''; });
  });
})();
