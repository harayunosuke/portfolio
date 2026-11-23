(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const workUrl = (w) => `work.html?id=${encodeURIComponent(w.id)}`;
  let io;
  const paras = (arr) => [].concat(arr || []).map((t) => `<p>${t}</p>`).join("");

  /* ---- About page ---- */
  const st = $("#statement");
  if (st) {
    st.innerHTML = paras(STATEMENT.ja) + `<div class="detail-en">${paras(STATEMENT.en)}</div>`;
    $("#cv").innerHTML = CV.map(
      (s) => `<h2>${s.title}</h2><ul>${s.items.map(([y, t]) => `<li><span>${y}</span><span>${t}</span></li>`).join("")}</ul>`
    ).join("");
  }

  /* ---- サイト共通テキストの流し込み ---- */
  $$("[data-site]").forEach((el) => (el.innerHTML = SITE[el.dataset.site] ?? ""));
  $$("[data-site-href]").forEach((el) => (el.href = SITE[el.dataset.siteHref]));
  $$("[data-site-mail]").forEach((el) => { el.href = `mailto:${SITE.email}`; el.textContent = SITE.email; });

  /* ---- Header / Menu ---- */
  const header = $("#header");
  const overlay = $("#overlay");
  const menuBtn = $("#menuBtn");
  const hero = $("#hero");
  const toggleMenu = (open) => {
    overlay.classList.toggle("is-open", open);
    menuBtn.textContent = open ? "Close" : "Menu";
    menuBtn.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("menu-open", open);
  };
  menuBtn.addEventListener("click", () => toggleMenu(!overlay.classList.contains("is-open")));
  $$(".overlay a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  const onScroll = () => {
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight - 56 : 0;
    header.classList.toggle("on-hero", !!hero && y < heroH);
    header.classList.toggle("is-collapsed", y > (hero ? heroH : 80));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Hero slideshow ---- */
  const slidesEl = $("#heroSlides");
  if (slidesEl) {
    const heroWorks = HERO.map((id) => WORKS.find((w) => w.id === id)).filter((w) => w && w.images.length);
    slidesEl.innerHTML = heroWorks
      .map((w, i) => {
        const src = w.heroImage || w.images[0];
        const pos = w.heroPosition ? ` style="object-position:${w.heroPosition};transform-origin:${w.heroPosition}"` : "";
        return `<div class="hero-slide${i === 0 ? " is-active" : ""}">
          <img class="hero-bg" src="${src}" alt="" aria-hidden="true">
          <img class="hero-img" src="${src}" alt="${w.title}"${pos}></div>`;
      })
      .join("");
    const slides = $$(".hero-slide", slidesEl);
    // 画面と写真の比率が大きく違う（＝半分近く切れる）ときは全体表示に切り替え
    const fitHero = () => {
      const vr = hero.offsetWidth / hero.offsetHeight;
      slides.forEach((s) => {
        const img = $(".hero-img", s);
        if (!img.naturalWidth) return;
        const ir = img.naturalWidth / img.naturalHeight;
        const visible = Math.min(ir, vr) / Math.max(ir, vr);
        s.classList.toggle("is-contain", visible < 0.6);
      });
    };
    $$(".hero-img", slidesEl).forEach((img) => img.addEventListener("load", fitHero));
    window.addEventListener("resize", fitHero);
    fitHero();
    const title = $("#heroTitle");
    let idx = 0;
    const show = (i) => {
      slides[idx].classList.remove("is-active");
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add("is-active");
      title.textContent = heroWorks[idx].title;
      title.href = workUrl(heroWorks[idx]);
    };
    show(0);
    let timer = setInterval(() => show(idx + 1), 5000);
    const go = (step) => {
      clearInterval(timer);
      show(idx + step);
      timer = setInterval(() => show(idx + 1), 5000);
    };
    // PC：クリックで次へ
    let touched = false;
    hero.addEventListener("click", (e) => {
      if (touched || e.target.closest("a")) return;
      go(1);
    });
    // スマホ：タップでは進まず、左右スワイプで次／前へ
    let sx = 0, sy = 0;
    hero.addEventListener("touchstart", (e) => {
      touched = true;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    hero.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---- News ---- */
  const newsList = $("#newsList");
  if (newsList) {
    newsList.innerHTML = NEWS.map(
      (n) => `<li><span class="news-date">${n.date}</span>
        <p class="news-text"><span>${n.text}</span> <span class="news-place">${n.place}</span></p></li>`
    ).join("");
  }

  /* ---- Works (top: staggered) ---- */
  const worksList = $("#worksList");
  if (worksList) {
    worksList.innerHTML = WORKS.filter((w) => w.images.length)
      .map(
        (w) => `<article class="work-item reveal" data-id="${w.id}">
          <a href="${workUrl(w)}">
            <div class="work-thumb"><img src="${w.thumb || w.images[0]}" alt="${w.title}" loading="lazy"></div>
            <div class="work-meta"><span class="work-title">${w.title}</span><span class="work-sub">${w.sub}</span></div>
          </a></article>`
      )
      .join("");
    // 縦長写真は縦長枠に
    $$(".work-item img", worksList).forEach((img) => {
      const set = () => img.naturalHeight > img.naturalWidth && img.closest(".work-item").classList.add("is-portrait");
      img.complete ? set() : img.addEventListener("load", set);
    });
  }

  /* ---- Works (all: grid) ---- */
  const grid = $("#worksGrid");
  if (grid) {
    const render = (cat) => {
      grid.innerHTML = WORKS.filter((w) => cat === "All" || w.category === cat)
        .map(
          (w) => `<article class="reveal"><a href="${workUrl(w)}">
            <div class="work-thumb${w.images.length ? "" : " placeholder"}">${
              w.images.length
                ? `<img class="thumb-bg" src="${w.thumb || w.images[0]}" alt="" aria-hidden="true" loading="lazy"><img class="thumb-img" src="${w.thumb || w.images[0]}" alt="${w.title}" loading="lazy">`
                : "Image coming soon"
            }</div>
            <div class="work-meta"><span class="work-title">${w.title}</span><span class="work-sub">${w.year} — ${w.category}</span></div>
          </a></article>`
        )
        .join("");
      // 3:2の枠に統一。正方形・縦長の写真は切らずに全体表示（背景にぼかし）
      $$(".thumb-img", grid).forEach((img) => {
        const set = () => img.naturalWidth / img.naturalHeight < 1.2 && img.parentElement.classList.add("is-contain");
        img.complete && img.naturalWidth ? set() : img.addEventListener("load", set);
      });
      observe();
    };
    const cats = ["All", ...new Set(WORKS.map((w) => w.category))];
    const filter = $("#filter");
    filter.innerHTML = cats.map((c, i) => `<button class="${i ? "" : "is-active"}">${c}</button>`).join("");
    filter.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      $$("button", filter).forEach((x) => x.classList.toggle("is-active", x === b));
      render(b.textContent);
    });
    render("All");
  }

  /* ---- Work detail ---- */
  const detail = $("#workDetail");
  if (detail) {
    const id = new URLSearchParams(location.search).get("id");
    const i = Math.max(0, WORKS.findIndex((w) => w.id === id));
    const w = WORKS[i];
    const next = WORKS[(i + 1) % WORKS.length];
    document.title = `${w.title} — ${SITE.name}`;
    detail.innerHTML = `
      <div class="detail-head">
        <h1 class="page-title">${w.title}</h1>
        <p class="detail-sub">${w.sub}</p>
      </div>
      ${
        w.video
          ? `<video class="detail-hero" src="${w.video}" poster="${w.poster || ""}" autoplay muted loop playsinline preload="auto" aria-label="${w.title}"></video>`
          : w.images[0]
          ? `<img class="detail-hero" src="${w.images[0]}" alt="${w.title}">`
          : ""
      }
      ${
        w.youtube
          ? `<div class="detail-youtube"><iframe src="https://www.youtube-nocookie.com/embed/${w.youtube}?rel=0&playsinline=1" title="${w.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
          : ""
      }
      ${
        [].concat(w.clip || [])
          .map((c) => `<div class="detail-youtube detail-clip"><video src="${c.src}" poster="${c.poster || ""}" autoplay muted loop playsinline controls preload="metadata" aria-label="${w.title}"></video></div>`)
          .join("")
      }
      <div class="detail-body">
        <div class="detail-meta"><dl class="detail-credits">${[["Date", w.date], ["Material", w.material], ["Category", w.category], ["Collaboration", w.collab]]
          .filter(([, v]) => v)
          .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
          .join("")}</dl>${
          w.awards && w.awards.length
            ? `<div class="detail-awards"><h2>Award</h2><ul>${w.awards
                .map(([y, a, v]) => `<li><span>${y}</span><span>${a}${v ? `<small>${v}</small>` : ""}</span></li>`)
                .join("")}</ul></div>`
            : ""
        }</div>
        <div class="detail-text">
          ${paras(w.text)}
          ${w.textEn && w.textEn.length ? `<div class="detail-en">${paras(w.textEn)}</div>` : ""}
        </div>
      </div>
      <div class="detail-gallery">${w.images.slice(w.video ? 0 : 1).map((src) => `<img class="reveal" src="${src}" alt="" loading="lazy">`).join("")}</div>
      <div class="next-work"><small>Next</small><a href="${workUrl(next)}" class="arrow-link">${next.title}</a></div>`;
  }

  /* ---- 動画の音：ブラウザの制限で最初はミュート。最初のタップ／クリック／キー操作で音を出す ---- */
  const clips = $$(".detail-clip video");
  if (clips.length) {
    const unmute = () => {
      clips.forEach((v) => {
        v.muted = false;
        v.volume = 1;
        v.play().catch(() => {});
      });
      ["pointerdown", "keydown", "touchend"].forEach((ev) => document.removeEventListener(ev, unmute, true));
    };
    ["pointerdown", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, unmute, true));
  }

  /* ---- ページ内リンク（#contact など）：作品一覧の描画・画像読み込みで位置がずれるので、確実に目的地まで移動 ---- */
  const jumpTo = (hash, smooth) => {
    const el = hash && hash.length > 1 && document.getElementById(hash.slice(1));
    if (!el) return;
    // 目的地より上の遅延読み込み画像を先に読み込ませる
    $$('img[loading="lazy"]').forEach((img) => (img.loading = "eager"));
    const target = () => Math.min(el.getBoundingClientRect().top + window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
    const to = (y) => window.scrollTo({ top: y, behavior: "instant" });
    let cancelled = false;
    const cancel = () => (cancelled = true);
    ["touchstart", "wheel"].forEach((ev) => window.addEventListener(ev, cancel, { passive: true, once: true }));
    // 移動しながら毎フレーム行き先を計算し直す（画像の読み込みでページが伸びても途中で止まらない）
    const startY = window.scrollY;
    const dur = smooth ? Math.min(1400, 600 + Math.abs(target() - startY) * 0.12) : 0;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const until = t0 + dur + 3000;
    const step = (now) => {
      if (cancelled) return;
      const p = dur ? Math.min(1, (now - t0) / dur) : 1;
      const t = target();
      to(startY + (t - startY) * ease(p));
      // 到着後もしばらくは、レイアウトが動いたら追従
      if (p < 1 || (now < until && Math.abs(window.scrollY - target()) > 1) || now < t0 + dur + 600) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const h = a.getAttribute("href");
      if (h.length < 2 || !document.getElementById(h.slice(1))) return;
      e.preventDefault();
      history.replaceState(null, "", h);
      jumpTo(h, true);
    })
  );
  if (location.hash) {
    jumpTo(location.hash, false);
    window.addEventListener("load", () => jumpTo(location.hash, false));
  }

  /* ---- Scroll reveal ---- */
  function observe() {
    const limit = window.innerHeight * 0.92;
    $$(".reveal:not(.is-in)").forEach((el) => el.getBoundingClientRect().top < limit && el.classList.add("is-in"));
  }
  if (!io) {
    io = true;
    window.addEventListener("scroll", observe, { passive: true });
    window.addEventListener("resize", observe);
  }
  requestAnimationFrame(observe);
})();
