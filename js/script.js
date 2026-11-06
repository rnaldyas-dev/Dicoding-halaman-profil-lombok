"use strict";

/* Penyimpanan aman: tidak error walau localStorage diblokir browser */
const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* abaikan */
    }
  },
};

const root = document.documentElement;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ---------- 1. Tema terang / gelap ---------- */
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap",
  );
}

applyTheme(root.getAttribute("data-theme") || "light");

themeToggle.addEventListener("click", () => {
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  store.set("theme", next);
});

/* ---------- 2. Menu aktif sesuai bagian yang sedang dilihat ---------- */
const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function setActiveLink(id) {
  navLinks.forEach((link) => {
    const active = id !== null && link.getAttribute("href") === "#" + id;
    link.classList.toggle("active", active);
    if (active) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
      });
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );
  sections.forEach((section) => spy.observe(section));
}

/* ---------- 3. Progress scroll + tombol kembali ke atas ---------- */
const progressBar = document.getElementById("progress");
const backToTop = document.getElementById("back-to-top");
let ticking = false;

function onScroll() {
  const y = window.scrollY;
  const max = root.scrollHeight - window.innerHeight;

  progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  backToTop.classList.toggle("show", y > 400);

  // Kembali ke bagian paling atas: hapus penanda menu aktif
  if (y < 150) setActiveLink(null);

  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
});

onScroll();

/* ---------- 4. Animasi muncul saat di-scroll ---------- */
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );

  document.querySelectorAll(".card, #wisata section").forEach((el) => {
    el.classList.add("reveal");
    revealObserver.observe(el);
  });
}

/* ---------- 5. Pratinjau gambar (klik gambar untuk memperbesar) ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");

function openLightbox(img) {
  lightboxImg.src = img.currentSrc || img.src;
  lightboxImg.alt = img.alt;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("#content .featured-image").forEach((img) => {
  img.tabIndex = 0;
  img.setAttribute("role", "button");
  img.addEventListener("click", () => openLightbox(img));
  img.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(img);
    }
  });
});

lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
});
