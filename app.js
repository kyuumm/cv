import { resumeProjects, resumeTags } from "./resume.data.js";

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
let searchTerm = "";
let menuOpen = false;
let activeProjectId = "";
let workObserver;
const activeTags = new Set();

function currentRoute() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  return routes.includes(path) ? path : "/";
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const escapeHtml = escapeAttribute;

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

// function footer() {
//   return `<footer class="site-footer">
//     <div class="shell">
//     <div class="footer-inner">
//       <div class="footer-about">计算机科学与技术本科生<br>对产品与设计感兴趣。</div>
//       <div class="footer-links">
//         <a href="/work" data-link>项目</a>
//         <a href="/interests" data-link>兴趣</a>
//         <a href="mailto:planktooon@outlook.com">邮件</a>
//       </div>
//     </div>
//     <div class="copyright"> ${new Date().getFullYear()} 十九</div>
//     </div>
//   </footer>`;
// }

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

function normalizeText(value) {
  return String(value ?? "").toLocaleLowerCase();
}

function projectSearchText(project) {
  return [project.title, project.role, project.period, project.summary, project.techStack?.join(" "), project.link].join(" ");
}

function blockSearchText(block) {
  return [block.title, block.description, block.tags.join(" ")].join(" ");
}

function getVisibleResumeProjects() {
  const query = normalizeText(searchTerm.trim());

  return resumeProjects.flatMap((project) => {
    const metadataMatches = !query || normalizeText(projectSearchText(project)).includes(query);

    if (project.inProgress) {
      return !activeTags.size && metadataMatches ? [{ ...project, visibleBlocks: [] }] : [];
    }

    const visibleBlocks = project.blocks.filter((block) => {
      const matchesSearch = !query || metadataMatches || normalizeText(blockSearchText(block)).includes(query);
      const matchesTags = !activeTags.size || block.tags.some((tag) => activeTags.has(tag));
      return matchesSearch && matchesTags;
    });

    return visibleBlocks.length ? [{ ...project, visibleBlocks }] : [];
  });
}

function renderAbilityTags(tags) {
  return tags.map((tag) => `<button class="ability-tag ${activeTags.has(tag) ? "active" : ""}" type="button" data-tag="${escapeAttribute(tag)}" aria-pressed="${activeTags.has(tag)}">${escapeHtml(tag)}</button>`).join("");
}

function resumeBlock(block) {
  return `<article class="ability-card">
    <div class="ability-card-head">
      <h3 class="ability-title"><span class="ability-bullet" aria-hidden="true">·</span> ${escapeHtml(block.title)}</h3>
      <div class="ability-tags" aria-label="能力标签">${renderAbilityTags(block.tags)}</div>
    </div>
    <p class="ability-description">${escapeHtml(block.description)}</p>
  </article>`;
}

function resumeProject(project) {
  const meta = [project.role, project.period].filter(Boolean).map(escapeHtml).join(" · ");
  if (project.inProgress) {
    return `<article class="resume-project in-progress-card" id="project-${escapeAttribute(project.id)}" data-resume-project="${escapeAttribute(project.id)}">
      <h2 data-project-heading="${escapeAttribute(project.id)}">${escapeHtml(project.title)}</h2>
      <p class="project-role">${meta}</p>
      <p class="project-summary">${escapeHtml(project.summary)}</p>
    </article>`;
  }

  return `<article class="resume-project" id="project-${escapeAttribute(project.id)}" data-resume-project="${escapeAttribute(project.id)}">
    <header class="resume-project-head">
      <div>
        <h2 data-project-heading="${escapeAttribute(project.id)}">${escapeHtml(project.title)}</h2>
        <p class="project-role">${meta}</p>
      </div>
      ${project.link ? `<a class="project-link" href="${escapeAttribute(project.link)}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ""}
    </header>
    <p class="project-summary">${escapeHtml(project.summary)}</p>
    <div class="ability-list">${project.visibleBlocks.map(resumeBlock).join("")}</div>
    ${project.techStack?.length ? `<p class="project-tech"><span>技术栈</span>${project.techStack.map(escapeHtml).join(" · ")}</p>` : ""}
  </article>`;
}

function work() {
  const visibleProjects = getVisibleResumeProjects();
  const visibleBlockCount = visibleProjects.reduce((count, project) => count + project.visibleBlocks.length, 0);
  if (!visibleProjects.some((project) => project.id === activeProjectId)) activeProjectId = visibleProjects[0]?.id ?? "";

  return `<main class="page shell work-page">
    <h1 class="sr-only">求职经历</h1>
    <div class="work-layout">
      <aside class="work-sidebar" aria-label="经历筛选与目录">
        <div class="work-sidebar-art" aria-label="求职">
          <img class="work-art-job" src="${asset("job/JobCn.png")}" alt="求职">
        </div>
        <section class="filters" aria-label="经历筛选">
         
          <p class="filter-heading">标签筛选</p>
          <div class="tag-filter-list">${resumeTags.map((tag) => `<button class="tag-filter ${activeTags.has(tag) ? "active" : ""}" type="button" data-tag="${escapeAttribute(tag)}" aria-pressed="${activeTags.has(tag)}">${escapeHtml(tag)}</button>`).join("")}</div>
          <div class="filter-status"><span class="result-count" aria-live="polite">共 ${visibleBlockCount} 个经历块</span><button class="clear-button" type="button" data-clear ${!searchTerm && !activeTags.size ? "disabled" : ""}>清除筛选</button></div>
        </section>
        ${visibleProjects.length ? `<nav class="experience-menu" aria-label="经历目录">

          <div class="experience-menu-list">${visibleProjects.map((project) => `<button class="experience-menu-item ${project.id === activeProjectId ? "active" : ""}" type="button" data-project-target="${escapeAttribute(project.id)}">${escapeHtml(project.navTitle)}</button>`).join("")}</div>
        </nav>` : ""}
      </aside>
      <section class="work-content" aria-label="项目经历">
        ${visibleProjects.length ? `<div class="resume-project-list">${visibleProjects.map(resumeProject).join("")}</div>` : `<div class="empty-state"><p>没有找到匹配的经历块。</p><button type="button" data-clear>清除筛选</button></div>`}
      </section>
    </div>
  </main>`;
}

function interests() {
  return `<main class="page shell interests-page">
    <div class="interest-intro">
      <h1 class="interest-title"><span class="sr-only">兴趣</span><img src="${asset("interest/interestCn.png")}" alt=""></h1>
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
  workObserver?.disconnect();
  workObserver = undefined;
  const route = currentRoute();
  const page = route === "/work" ? work() : route === "/interests" ? interests() : route === "/contact" ? contact() : home();
  const scrim = menuOpen ? `<button class="menu-scrim" type="button" aria-label="关闭导航菜单"></button>` : "";
  app.innerHTML = `${header(route)}${scrim}${page}`;
  bind();
  if (route === "/work") setupWorkObserver();
}

function navigate(path) {
  history.pushState({}, "", path);
  menuOpen = false;
  render();
  window.scrollTo(0, 0);
}

function setActiveProject(projectId) {
  const changed = activeProjectId !== projectId;
  activeProjectId = projectId;
  const title = resumeProjects.find((project) => project.id === projectId)?.navTitle ?? "";
  app.querySelector("[data-current-project]")?.replaceChildren(title);
  app.querySelectorAll("[data-project-target]").forEach((item) => {
    item.classList.toggle("active", item.dataset.projectTarget === projectId);
  });

  if (changed) {
    const item = app.querySelector(`[data-project-target="${projectId}"]`);
    const menu = item?.closest(".experience-menu-list");
    if (item && menu) {
      const itemRect = item.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const isOutsideMenu = itemRect.top < menuRect.top || itemRect.bottom > menuRect.bottom;
      if (isOutsideMenu) {
        menu.scrollTo({
          top: menu.scrollTop + itemRect.top - menuRect.top - (menu.clientHeight - itemRect.height) / 2,
          behavior: "smooth",
        });
      }
    }
  }
}

function setupWorkObserver() {
  const headings = [...app.querySelectorAll("[data-project-heading]")];
  if (!headings.length) return;
  if (!("IntersectionObserver" in window)) {
    headings.forEach((heading) => heading.classList.add("is-visible"));
    return;
  }
  const visibleHeadings = new Set();

  workObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        visibleHeadings.add(entry.target);
      } else visibleHeadings.delete(entry.target);
    });
    const firstVisibleHeading = headings.find((heading) => visibleHeadings.has(heading));
    if (firstVisibleHeading) setActiveProject(firstVisibleHeading.dataset.projectHeading);
  }, {
    root: null,
    rootMargin: "-84px 0px 0px 0px",
    threshold: 0,
  });

  headings.forEach((heading) => workObserver.observe(heading));
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
  app.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", () => {
    const { tag } = button.dataset;
    if (activeTags.has(tag)) activeTags.delete(tag);
    else activeTags.add(tag);
    render();
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
    activeTags.clear();
    searchTerm = "";
    render();
  }));
  app.querySelectorAll("[data-project-target]").forEach((button) => button.addEventListener("click", () => {
    const target = document.querySelector(`#project-${button.dataset.projectTarget}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveProject(button.dataset.projectTarget);
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
