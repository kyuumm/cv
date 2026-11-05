const projects = [
  {
    title: "携程 EasyStay",
    category: "产品与设计",
    label: "团队项目",
    summary: "围绕酒店预约、移动端体验与管理后台展开的团队项目。担任团队负责人，使用 Figma 参与产品设计，并参与移动端及后台功能规划。",
    tools: "Figma · React · Vite · Ant Design Mobile · Express mock",
    keywords: "携程 易住 酒店 预约 产品 设计 管理后台 React Vite Figma",
  },
  {
    title: "AI 产品实习",
    category: "AI 产品实践",
    label: "产品实践",
    summary: "参与产品测试、问题跟踪、需求整理、Figma 原型与文档工作。",
    tools: "产品测试 · 需求整理 · Figma",
    keywords: "AI 产品 实习 测试 问题跟踪 需求 Figma 原型 文档",
  },
  {
    title: "React ToDoList",
    category: "前端开发",
    label: "前端练习",
    summary: "使用 React 构建的待办事项应用。功能细节与项目链接待补充。",
    tools: "React",
    keywords: "React ToDoList 待办 前端",
  },
  {
    title: "Unity 飞行器项目",
    category: "其他项目",
    label: "交互 / 游戏开发",
    summary: "Unity 飞行器项目。玩法、个人负责部分与演示材料待补充。",
    tools: "Unity",
    keywords: "Unity 飞行器 游戏 交互",
  },
];

const categories = ["全部", "产品与设计", "AI 产品实践", "前端开发", "其他项目"];
const routes = ["/", "/work", "/interests", "/contact"];
const navigation = [
  ["/", "首页"],
  ["/work", "求职"],
  ["/interests", "兴趣"],
  ["/contact", "联系"],
];
const interestTopics = [
  ["cutCn.png", "剪辑"],
  ["diyCn.png", "手工"],
  ["languageCn.png", "语言"],
  ["musicCn.png", "音乐"],
  ["paintCn.png", "绘画"],
  ["photoCn.png", "摄影"],
  ["otherCn.png", "其他兴趣"],
];
const app = document.querySelector("#app");
const asset = (path) => `/asset/${path}`;
const alphaPixels = new WeakMap();
let activeCategory = "全部";
let searchTerm = "";
let menuOpen = false;

function currentRoute() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  return routes.includes(path) ? path : "/";
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getAlphaPixels(image) {
  if (alphaPixels.has(image)) return alphaPixels.get(image);
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  try {
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const alpha = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0, p = 3; i < alpha.length; i++, p += 4) alpha[i] = pixels[p];
    const result = { width: canvas.width, height: canvas.height, alpha };
    alphaPixels.set(image, result);
    return result;
  } catch {
    alphaPixels.set(image, false);
    return null;
  }
}

function hasPixelAt(image, clientX, clientY) {
  const rect = image.getBoundingClientRect();
  if (clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) return false;
  const pixels = getAlphaPixels(image);
  if (!pixels) return false;
  const x = Math.min(pixels.width - 1, Math.floor((clientX - rect.left) / rect.width * pixels.width));
  const y = Math.min(pixels.height - 1, Math.floor((clientY - rect.top) / rect.height * pixels.height));
  return pixels.alpha[y * pixels.width + x] > 0;
}

function getArtworkHit(container, clientX, clientY) {
  const links = [...container.querySelectorAll(".entry-card")].sort((a, b) =>
    Number(getComputedStyle(b).zIndex) - Number(getComputedStyle(a).zIndex));
  return links.find((link) => hasPixelAt(link.querySelector("img"), clientX, clientY)) ?? null;
}

function header(route) {
  return `<header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/" data-link aria-label="十九，返回首页">十九</a>
      <button class="menu-toggle" type="button" aria-label="${menuOpen ? "关闭菜单" : "打开菜单"}" aria-expanded="${menuOpen}">☰</button>
      <nav class="nav ${menuOpen ? "open" : ""}" aria-label="主导航">
        ${navigation.map(([path, label]) => `<a href="${path}" data-link aria-current="${route === path ? "page" : "false"}">${label}</a>`).join("")}
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="shell">
    <div class="footer-inner">
      <div class="footer-about">计算机科学与技术本科生<br>对产品与设计感兴趣。</div>
      <div class="footer-links">
        <a href="/work" data-link>项目</a>
        <a href="/interests" data-link>兴趣</a>
        <a href="mailto:planktooon@outlook.com">邮件</a>
      </div>
    </div>
    <div class="copyright"> ${new Date().getFullYear()} 十九</div>
    </div>
  </footer>`;
}

function home() {
  return `<main class="page home-page">
    <section class="home-hero" aria-label="欢迎">
      <img src="${asset("home/home_welcome.png")}" alt="手写问候语">
    </section>
    <section class="home-entries" aria-label="页面入口">
      <a class="entry-card" href="/work" data-link aria-label="求职 / 项目">
        <img src="${asset("home/home_jobBtn.png")}" alt="">
      </a>
      <a class="entry-card" href="/interests" data-link aria-label="兴趣">
        <img src="${asset("home/home_interestBtn.png")}" alt="">
      </a>
    </section>
  </main>`;
}

function projectCard(project) {
  return `<article class="project-card">
    <span class="project-type">${project.label} · ${project.category}</span>
    <h2>${project.title}</h2>
    <p>${project.summary}</p>
    <div class="project-meta">${project.tools}</div>
  </article>`;
}

function work() {
  const visibleProjects = projects.filter((project) => {
    const matchesCategory = activeCategory === "全部" || project.category === activeCategory;
    const content = `${project.title} ${project.category} ${project.label} ${project.summary} ${project.tools} ${project.keywords}`;
    return matchesCategory && content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return `<main class="page shell">
    <div class="section-heading">
      <div>
        <span class="eyebrow">Selected work & practice</span>
        <h1 class="image-heading"><span class="sr-only">求职 / 项目</span><img src="${asset("job/JobCn.png")}" alt=""></h1>
      </div>
      <p>计算机学习背景与项目实践。具体分工和成果以已确认的信息为准。</p>
    </div>
    <div class="work-layout">
      <aside class="filters" aria-label="项目筛选">
        <label class="search-label" for="project-search">搜索项目、技能或关键词</label>
        <div class="search-box"><span aria-hidden="true">⌕</span><input id="project-search" type="search" placeholder="React、Figma、AI" value="${escapeAttribute(searchTerm)}" autocomplete="off"></div>
        <p class="filter-heading">项目分类</p>
        <div class="filter-list">${categories.map((category) => `<button class="filter-button ${activeCategory === category ? "active" : ""}" data-category="${category}" aria-pressed="${activeCategory === category}">${category}</button>`).join("")}</div>
        <button class="clear-button" data-clear>清除筛选</button>
      </aside>
      <section aria-label="项目列表">
        <p class="result-count" aria-live="polite">${visibleProjects.length} 个项目</p>
        <div class="project-list">${visibleProjects.length ? visibleProjects.map(projectCard).join("") : `<div class="empty-state">没有找到匹配内容<button data-clear>显示全部项目</button></div>`}</div>
      </section>
    </div>
  </main>`;
}

function interests() {
  return `<main class="page shell interests-page">
    <div class="interest-intro">
      <img src="${asset("interest/Star1.png")}" alt="">
      <h1 class="interest-title"><span class="sr-only">兴趣</span><img src="${asset("interest/interestCn.png")}" alt=""></h1>
      <img src="${asset("interest/Star2.png")}" alt="">
    </div>
    <section class="interest-grid" aria-label="兴趣主题">
      ${interestTopics.map(([image, label]) => `<div class="interest-tile"><img src="${asset(`interest/${image}`)}" alt="${label}"></div>`).join("")}
    </section>
  </main>`;
}

function contact() {
  return `<main class="page shell"><section class="contact-page">
    <span class="eyebrow">Contact</span>
    <h1>联系</h1>
    <div class="contact-links">
      <a class="contact-link" href="mailto:planktooon@outlook.com"><span>电子邮件</span><span>planktooon@outlook.com ↗</span></a>
      <a class="contact-link" href="https://github.com/kyuumm" target="_blank" rel="noreferrer"><span>GitHub</span><span>github.com/kyuumm ↗</span></a>
    </div>
  </section></main>`;
}

function render() {
  const route = currentRoute();
  const page = route === "/work" ? work() : route === "/interests" ? interests() : route === "/contact" ? contact() : home();
  const scrim = menuOpen ? `<button class="menu-scrim" type="button" aria-label="关闭导航菜单"></button>` : "";
  app.innerHTML = `${header(route)}${scrim}${page}${footer()}`;
  bind();
}

function navigate(path) {
  history.pushState({}, "", path);
  menuOpen = false;
  render();
  window.scrollTo(0, 0);
}

function bind() {
  const artwork = app.querySelector(".home-entries");
  if (artwork) {
    const links = [...artwork.querySelectorAll(".entry-card")];
    artwork.addEventListener("pointermove", (event) => {
      const hit = getArtworkHit(artwork, event.clientX, event.clientY);
      links.forEach((link) => link.classList.toggle("pixel-hover", link === hit));
    });
    artwork.addEventListener("pointerleave", () => links.forEach((link) => link.classList.remove("pixel-hover")));
    artwork.addEventListener("click", (event) => {
      if (event.detail === 0) return;
      const hit = getArtworkHit(artwork, event.clientX, event.clientY);
      if (!hit) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const clicked = event.target.closest(".entry-card");
      if (clicked !== hit) {
        event.preventDefault();
        event.stopPropagation();
        navigate(hit.getAttribute("href"));
      }
    }, true);
  }

  app.querySelectorAll("[data-link]").forEach((link) => link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.getAttribute("href"));
  }));
  app.querySelector(".menu-toggle")?.addEventListener("click", () => { menuOpen = !menuOpen; render(); });
  app.querySelector(".menu-scrim")?.addEventListener("click", () => {
    menuOpen = false;
    render();
    app.querySelector(".menu-toggle")?.focus();
  });
  app.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    render();
    app.querySelector("#project-search")?.focus();
  }));
  app.querySelector("#project-search")?.addEventListener("input", (event) => {
    const position = event.target.selectionStart;
    searchTerm = event.target.value;
    render();
    const input = app.querySelector("#project-search");
    input.focus();
    input.setSelectionRange(position, position);
  });
  app.querySelectorAll("[data-clear]").forEach((button) => button.addEventListener("click", () => {
    activeCategory = "全部";
    searchTerm = "";
    render();
  }));
}

window.addEventListener("popstate", () => { menuOpen = false; render(); });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuOpen) {
    menuOpen = false;
    render();
    app.querySelector(".menu-toggle")?.focus();
  }
});
render();
