// ============================================================================
// StudyHub — Shared navigation bar
// Renders into <div id="navbar"></div>, present on every page.
// ============================================================================

import { logout } from "./auth.js";
import { initials } from "./utils.js";

const STUDENT_LINKS = [
  { href: "/dashboard.html", label: "Dashboard", key: "dashboard" },
  { href: "/notes.html", label: "Notes", key: "notes" },
  { href: "/quizzes.html", label: "Quizzes", key: "quizzes" },
  { href: "/profile.html", label: "Profile", key: "profile" },
];

const ADMIN_LINKS = [
  { href: "/admin/dashboard.html", label: "Dashboard", key: "dashboard" },
  { href: "/admin/notes.html", label: "Notes", key: "notes" },
  { href: "/admin/quizzes.html", label: "Quizzes", key: "quizzes" },
  { href: "/admin/students.html", label: "Students", key: "students" },
];

/**
 * Renders the app navbar.
 * @param {Object} opts
 * @param {"guest"|"student"|"admin"} opts.role
 * @param {string} opts.active - key of the current page's nav link
 * @param {{name?:string}} [opts.profile]
 */
export function renderNav({ role = "guest", active = "", profile = {} } = {}) {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const links = role === "admin" ? ADMIN_LINKS : role === "student" ? STUDENT_LINKS : [];

  const linkHtml = (link, mobile = false) =>
    `<a href="${link.href}" class="${active === link.key ? "active" : ""}">${link.label}</a>`;

  const rightSide =
    role === "guest"
      ? `<a href="/login.html" class="btn btn-outline btn-sm">Log in</a>
         <a href="/register.html" class="btn btn-primary btn-sm">Sign up</a>`
      : `<div class="nav-user">
           <span class="text-grey" style="font-size:0.85rem; display:none" id="nav-name-desktop">${profile.name || ""}</span>
           <div class="nav-avatar" title="${profile.name || ""}">${initials(profile.name)}</div>
           <button class="btn btn-ghost btn-sm" id="nav-logout-btn">Log out</button>
         </div>`;

  mount.innerHTML = `
    <div class="nav-inner">
      <div class="container">
        <div class="nav-row">
          <a href="${role === "admin" ? "/admin/dashboard.html" : "/index.html"}" class="nav-brand">
            <span class="mark">S</span> StudyHub
          </a>
          <div class="nav-links">${links.map((l) => linkHtml(l)).join("")}</div>
          <div class="flex items-center gap-12">
            ${rightSide}
            <button class="nav-burger" id="nav-burger" aria-label="Menu">☰</button>
          </div>
        </div>
        <div class="mobile-menu" id="mobile-menu">
          ${links.map((l) => linkHtml(l)).join("")}
          ${role === "guest" ? `<a href="/login.html">Log in</a><a href="/register.html">Sign up</a>` : ""}
        </div>
      </div>
    </div>
  `;

  const burger = document.getElementById("nav-burger");
  const menu = document.getElementById("mobile-menu");
  burger?.addEventListener("click", () => menu.classList.toggle("open"));

  document.getElementById("nav-logout-btn")?.addEventListener("click", async () => {
    await logout();
  });
}
