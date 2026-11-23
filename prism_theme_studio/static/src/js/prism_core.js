import { _t } from "@web/core/l10n/translation";
import { session } from "@web/session";

/** The styles: id (same as the Python selection), name, preview of the card and the default accent. */
export const PRESETS = [
    { id: "auto", name: _t("Follow the sun"), accent: "#f59e0b",
      thumb: "linear-gradient(110deg, #fbcfe8 0%, #efb877 25%, #f97316 45%, #7e22ce 62%, #0b1033 82%, #050816 100%)" },
    { id: "aurora", name: _t("Aurora"), accent: "#14b8a6",
      thumb: "radial-gradient(60% 60% at 20% 20%, #14b8a6, transparent 70%), radial-gradient(60% 60% at 85% 30%, #7c3aed, transparent 70%), #04131d" },
    { id: "mesh", name: _t("Mesh Bloom"), accent: "#c026d3",
      thumb: "radial-gradient(60% 60% at 15% 20%, #f9a8d4, transparent 70%), radial-gradient(60% 60% at 85% 20%, #93c5fd, transparent 70%), radial-gradient(60% 60% at 70% 90%, #fdba74, transparent 70%), #fdf4ff" },
    { id: "dunes", name: _t("Desert Dunes"), accent: "#c2410c",
      thumb: "radial-gradient(18% 30% at 78% 28%, #fff7d6, transparent 75%), linear-gradient(170deg, transparent 55%, #d4874a 56%, #b8682f), linear-gradient(180deg, #fbe3bd, #efb877)" },
    { id: "midnight", name: _t("Midnight Sky"), accent: "#818cf8",
      thumb: "radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 70% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 45% 70%, #fff, transparent), radial-gradient(60% 60% at 70% 0%, #4f46e5, transparent 70%), #050816" },
    { id: "glass", name: _t("Glass Ocean"), accent: "#0284c7",
      thumb: "radial-gradient(20% 30% at 25% 35%, rgba(255,255,255,.45), transparent 70%), linear-gradient(135deg, #0ea5e9, #1d4ed8 60%, #1e1b4b)" },
    { id: "paper", name: _t("Paper Studio"), accent: "#2563eb",
      thumb: "linear-gradient(rgba(37,99,235,.18) 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, rgba(37,99,235,.18) 1px, transparent 1px) 0 0 / 12px 12px, #f8f6f1" },
    { id: "arabesque", name: _t("Emerald Arabesque"), accent: "#b7791f",
      thumb: "radial-gradient(50% 50% at 50% 0%, rgba(212,160,23,.5), transparent 70%), repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, rgba(255,255,255,.08) 0 2px, transparent 2px 12px), #064e3b" },
    { id: "sunset", name: _t("Sunset Horizon"), accent: "#ea580c",
      thumb: "radial-gradient(25% 35% at 50% 80%, #fef08a, transparent 75%), linear-gradient(180deg, #312e81, #7e22ce 35%, #db2777 65%, #f97316)" },
    { id: "graphite", name: _t("Graphite"), accent: "#f59e0b",
      thumb: "radial-gradient(60% 60% at 80% 0%, #52525b, transparent 70%), linear-gradient(180deg, #27272a, #111113)" },
    { id: "neon", name: _t("Neon Grid"), accent: "#e879f9",
      thumb: "repeating-linear-gradient(90deg, rgba(232,121,249,.5) 0 1px, transparent 1px 14px) 0 60% / 100% 40% no-repeat, radial-gradient(70% 30% at 50% 58%, #ec4899, transparent 70%), linear-gradient(180deg, #0b0221, #2a0845 58%, #0b0221)" },
    { id: "photo", name: _t("My photo"), accent: "#64748b",
      thumb: "repeating-conic-gradient(rgba(255,255,255,.12) 0 25%, transparent 0 50%) 0 0 / 14px 14px, linear-gradient(135deg, #334155, #0f172a)" },
];
export const FONTS = [
    { id: "system", name: _t("System") },
    { id: "humanist", name: _t("Humanist sans") },
    { id: "rounded", name: _t("Rounded") },
    { id: "serif", name: _t("Editorial serif") },
    { id: "mono", name: _t("Technical mono") },
    { id: "arabic_modern", name: _t("Arabic modern") },
    { id: "arabic_classic", name: _t("Arabic classic") },
];
export const SWATCHES = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#65a30d", "#d97706", "#dc2626", "#db2777", "#475569"];
export const DEFAULTS = {
    enabled: false, preset: "aurora", accent: false, font: "system", density: "comfortable", motion: true,
    inside: "style", effects: "auto", occasions: true, layout: "top", pins: [], photo: false, photo_dark: false,
    has_own_photo: false, source: "user",
};

/** "Follow the sun": the style for the hour of the day (same table as SUN in Python). */
const SUN = [[5, "mesh"], [8, "dunes"], [16, "sunset"], [19, "aurora"], [22, "midnight"]];
export function sunPreset(date = new Date()) {
    const hour = date.getHours();
    let preset = "midnight";
    for (const [from, id] of SUN) {
        if (hour >= from) {
            preset = id;
        }
    }
    return preset;
}
/** Styles whose screens are dark inside (same list as DARK_PRESETS in Python). */
const DARK = new Set(["aurora", "midnight", "graphite", "neon", "arabesque"]);
export function resolvedPreset(settings) {
    if (settings.preset === "auto") {
        return sunPreset();
    }
    if (settings.preset === "photo" && !settings.photo) {
        return "graphite";      // no photo yet
    }
    return settings.preset;
}
/** "dark" or "light": the Odoo bundle these settings need (the server decides the same way). */
export function wantedScheme(settings) {
    if (!settings.enabled) {
        return null;        // the site decides
    }
    if (settings.inside !== "style") {
        return settings.inside;
    }
    const preset = resolvedPreset(settings);
    if (preset === "photo") {
        return settings.photo_dark ? "dark" : "light";
    }
    return DARK.has(preset) ? "dark" : "light";
}

// ---------------------------------------------------------------- occasions (Hijri dates from the browser's calendar)
export const OCCASIONS = [
    { id: "ramadan", name: _t("Ramadan"), greeting: _t("Ramadan Kareem") },
    { id: "eid", name: _t("Eid"), greeting: _t("Eid Mubarak") },
    { id: "founding", name: _t("Founding Day"), greeting: _t("Happy Founding Day") },
    { id: "national", name: _t("National Day"), greeting: _t("Happy National Day") },
    { id: "winter", name: _t("Winter"), greeting: _t("Warm winter days") },
];
function hijri(date) {
    try {
        const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric" }).formatToParts(date);
        return { month: Number(parts.find((p) => p.type === "month").value), day: Number(parts.find((p) => p.type === "day").value) };
    } catch {
        return { month: 0, day: 0 };
    }
}
/** The occasion of a day, or null: Ramadan, Eid al-Fitr (1-3 Shawwal), Eid al-Adha (9-13 Dhu al-Hijjah), Founding
 *  Day (20-23 February), National Day (21-24 September), winter (December, January). */
export function occasionFor(date = new Date()) {
    const h = hijri(date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (h.month === 9) {
        return "ramadan";
    }
    if ((h.month === 10 && h.day <= 3) || (h.month === 12 && h.day >= 9 && h.day <= 13)) {
        return "eid";
    }
    if (month === 2 && day >= 20 && day <= 23) {
        return "founding";
    }
    if (month === 9 && day >= 21 && day <= 24) {
        return "national";
    }
    if (month === 12 || month === 1) {
        return "winter";
    }
    return null;
}
const LANTERN = (x, len, scale) => `
    <g transform="translate(${x} 0) scale(${scale})">
        <line x1="0" y1="0" x2="0" y2="${len}" stroke="currentColor" stroke-width="1.2" opacity=".7"/>
        <g transform="translate(0 ${len})" class="o_prism_swing">
            <path d="M-7 0 h14 l4 8 h-22z" fill="#d4a017"/>
            <path d="M-11 8 h22 l-3 30 h-16z" fill="#f59e0b" opacity=".92"/>
            <path d="M-6 12 h12 l-2 22 h-8z" fill="#fff7d6" class="o_prism_glow"/>
            <path d="M-8 38 h16 l-4 6 h-8z" fill="#d4a017"/>
            <circle cx="0" cy="48" r="2.5" fill="#d4a017"/>
        </g>
    </g>`;
const DECOR = {
    ramadan: `<svg class="o_prism_occ_art" viewBox="0 0 260 150" aria-hidden="true">
        <path d="M20 2 Q 110 26 200 2" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".6"/>
        ${LANTERN(40, 30, 1)}${LANTERN(110, 60, 0.85)}${LANTERN(175, 20, 1.1)}
        <path d="M236 22 a22 22 0 1 0 14 40 a17 17 0 1 1 -14 -40z" fill="#fde68a"/>
        <circle cx="214" cy="20" r="2" fill="#fff"/><circle cx="226" cy="74" r="1.5" fill="#fff"/></svg>`,
    eid: `<svg class="o_prism_occ_art" viewBox="0 0 260 150" aria-hidden="true">
        ${[[30, 30, 9], [80, 70, 6], [140, 26, 11], [200, 64, 7], [236, 24, 5], [110, 110, 5], [180, 118, 8]].map(([x, y, r], i) =>
            `<path class="o_prism_twinkle" style="animation-delay:${i * 0.35}s" transform="translate(${x} ${y})" d="M0 ${-r} L${r * 0.3} ${-r * 0.3} L${r} 0 L${r * 0.3} ${r * 0.3} L0 ${r} L${-r * 0.3} ${r * 0.3} L${-r} 0 L${-r * 0.3} ${-r * 0.3}Z" fill="${["#fde68a", "#f9a8d4", "#a7f3d0", "#bfdbfe"][i % 4]}"/>`).join("")}
        </svg>`,
    founding: `<svg class="o_prism_occ_art" viewBox="0 0 260 60" preserveAspectRatio="none" aria-hidden="true">
        <rect width="260" height="60" fill="#5b3a1a"/>
        ${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 20} 60 l10 -22 l10 22z" fill="${i % 2 ? "#c8a165" : "#8b5e2b"}"/><path d="M${i * 20 + 5} 0 l5 14 l5 -14z" fill="#e7c98f"/>`).join("")}
        <rect y="28" width="260" height="3" fill="#e7c98f"/></svg>`,
    national: `<svg class="o_prism_occ_art" viewBox="0 0 260 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30 C 60 0 120 60 180 30 S 240 10 260 25 V55 C 240 40 200 70 150 55 S 60 30 0 60Z" fill="#006c35"/>
        <path d="M0 52 C 60 26 120 80 180 52 S 240 34 260 47 V58 C 240 46 200 74 150 62 S 60 40 0 66Z" fill="#ffffff" opacity=".85"/></svg>`,
    winter: "",
};
function snow() {
    return Array.from({ length: 28 }, (_, i) =>
        `<i class="o_prism_flake" style="left:${(i * 37) % 100}%; animation-delay:${(i % 9) * 1.3}s; animation-duration:${9 + (i % 5) * 2}s; opacity:${0.35 + (i % 4) * 0.15};"></i>`).join("");
}
let occasionPreview = null;
export function setOccasionPreview(id) {
    occasionPreview = id || null;
    drawOccasion(current || {});
}
function drawOccasion(settings) {
    document.querySelector(".o_prism_occasion")?.remove();
    const id = occasionPreview || (settings.enabled && settings.occasions ? occasionFor() : null);
    if (!id || !settings.enabled || !document.body) {
        return;
    }
    const meta = OCCASIONS.find((o) => o.id === id);
    const el = document.createElement("div");
    el.className = `o_prism_occasion o_prism_o_${id}`;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `${DECOR[id] || ""}${id === "winter" ? snow() : ""}<span class="o_prism_occ_chip">${meta ? meta.greeting : ""}</span>`;
    document.body.appendChild(el);
}

// ---------------------------------------------------------------- photo style: colours taken from the picture
const photoCache = new Map();
/** Average colour, a lively accent and darkness of an image (sampled on a tiny canvas). */
export function analyseImage(img) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 24, 24);
    const data = ctx.getImageData(0, 0, 24, 24).data;
    let r = 0, g = 0, b = 0, best = null, bestScore = -1;
    for (let i = 0; i < data.length; i += 4) {
        const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]];
        r += pr; g += pg; b += pb;
        const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
        const score = (max - min) * (1 - Math.abs(max - 140) / 140);     // saturated and mid-bright
        if (score > bestScore) {
            bestScore = score;
            best = [pr, pg, pb];
        }
    }
    const n = data.length / 4;
    const avg = [r / n, g / n, b / n];
    const luminance = (0.2126 * avg[0] + 0.7152 * avg[1] + 0.0722 * avg[2]) / 255;
    const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    return { average: hex(avg), accent: hex(best || avg), dark: luminance < 0.45 };
}
function applyPhoto(settings) {
    const body = document.body;
    if (!settings.photo) {
        return;
    }
    body.style.setProperty("--prism-photo", `url("${settings.photo}")`);
    const known = photoCache.get(settings.photo);
    const use = (info) => {
        body.style.setProperty("--prism-photo-tint", info.average);
        if (!settings.accent) {
            body.style.setProperty("--prism-user-accent", info.accent);
        }
    };
    if (known) {
        use(known);
        return;
    }
    const img = new Image();
    img.onload = () => {
        try {
            const info = analyseImage(img);
            photoCache.set(settings.photo, info);
            if (current && current.photo === settings.photo && resolvedPreset(current) === "photo") {
                use(info);
            }
        } catch {
            // tainted or broken image: keep the default colours
        }
    };
    img.src = settings.photo;
}

// ---------------------------------------------------------------- slow computers
const LITE_KEY = "prism_lite_auto_v2";
function storage(kind) {
    try {
        return window[kind];
    } catch {
        return null;
    }
}
let measured = false;
/** Effects "automatic": once the page is idle and visible, count frames for 2 s; under 24 per second the glass and
 *  animation are turned down (remembered for a day in this browser). A hidden tab or one that is hidden while
 *  counting is not judged (browsers slow those down on purpose). */
function measureSpeed() {
    const local = storage("localStorage");
    const saved = local?.getItem(LITE_KEY);
    if (saved && Date.now() - Number(saved.split(":")[1] || 0) < 86400000) {
        return saved.startsWith("1");
    }
    if (!measured) {
        measured = true;
        setTimeout(function count() {
            if (document.visibilityState !== "visible") {
                measured = false;        // try again on a later page
                return;
            }
            let frames = 0;
            let spoiled = false;
            const onHide = () => (spoiled = true);
            document.addEventListener("visibilitychange", onHide, { once: true });
            const start = performance.now();
            const tick = (now) => {
                frames++;
                if (now - start < 2000) {
                    requestAnimationFrame(tick);
                    return;
                }
                document.removeEventListener("visibilitychange", onHide);
                if (spoiled) {
                    measured = false;
                    return;
                }
                const slow = frames / ((now - start) / 1000) < 24;
                local?.setItem(LITE_KEY, `${slow ? 1 : 0}:${Date.now()}`);
                if (slow && current && current.effects === "auto") {
                    document.body.classList.add("o_prism_lite");
                }
            };
            requestAnimationFrame(tick);
        }, 3000);
    }
    return false;
}

// ---------------------------------------------------------------- applying a look
/** Put the settings on <body>: one class per choice, the accent and the photo as CSS variables. */
export function applyPrism(settings) {
    const body = document.body;
    if (!body) {
        return;
    }
    for (const cls of [...body.classList]) {
        if (cls === "o_prism" || cls.startsWith("o_prism_")) {
            body.classList.remove(cls);
        }
    }
    for (const prop of ["--prism-user-accent", "--prism-photo", "--prism-photo-tint"]) {
        body.style.removeProperty(prop);
    }
    if (settings.enabled) {
        const preset = resolvedPreset(settings);
        body.classList.add("o_prism", `o_prism_p_${preset}`, `o_prism_f_${settings.font}`);
        if (settings.density === "compact") {
            body.classList.add("o_prism_compact");
        }
        if (settings.motion) {
            body.classList.add("o_prism_motion");
        }
        if (settings.layout === "sidebar") {
            body.classList.add("o_prism_sidebar");
        }
        if (settings.effects === "lite" || (settings.effects === "auto" && measureSpeed())) {
            body.classList.add("o_prism_lite");
        }
        if (settings.accent) {
            body.style.setProperty("--prism-user-accent", settings.accent);
        }
        if (preset === "photo") {
            applyPhoto(settings);
        }
    }
    drawOccasion(settings);
}

let current = null;
/** The settings drawn now (a function: Odoo's modules do not pass a changed exported variable on). */
export function getCurrent() {
    return current || initial;
}
const listeners = new Set();
/** Remember the settings, draw them and tell the sidebar / home screen. */
export function usePrism(settings) {
    current = { ...settings };
    applyPrism(current);
    for (const listener of listeners) {
        listener(current);
    }
}
export function onPrismChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
// "Follow the sun" and the occasion move on by themselves
setInterval(() => current && current.enabled && applyPrism(current), 10 * 60 * 1000);
// the spotlight: a soft light in the accent colour that follows the mouse (one update per frame at most)
let frame = null;
window.addEventListener("pointermove", (ev) => {
    if (frame || !document.body.classList.contains("o_prism_motion") || document.body.classList.contains("o_prism_lite")) {
        return;
    }
    frame = requestAnimationFrame(() => {
        document.body.style.setProperty("--prism-mx", `${ev.clientX}px`);
        document.body.style.setProperty("--prism-my", `${ev.clientY}px`);
        frame = null;
    });
}, { passive: true });

export const initial = { ...DEFAULTS, ...(session.prism_theme || {}) };

// ---------------------------------------------------------------- light / dark screens
// Odoo serves its dark bundle when ir.http.color_scheme() says "dark". Our override decides from the user's settings,
// but Odoo Enterprise (and some themes) decide first from the cookie "color_scheme", so the cookie is kept in step
// too. The value it had before the theme was switched on is kept and put back when the theme is switched off.
const PREV_KEY = "prism_prev_color_scheme";
const RELOAD_KEY = "prism_scheme_reload_at";
const loadedScheme = () => (document.querySelector("link[href*='assets_web_dark']") ? "dark" : "light");
function readCookie() {
    const match = document.cookie.match(/(?:^|; )color_scheme=([^;]*)/);
    return match ? match[1] : "";
}
function writeCookie(value) {
    document.cookie = value
        ? `color_scheme=${value}; path=/; max-age=31536000; SameSite=Lax`
        : "color_scheme=; path=/; max-age=0; SameSite=Lax";
}
/** Make the cookie match the settings. Returns true when the page shows the other bundle and must be reloaded. */
export function syncScheme(settings) {
    const local = storage("localStorage");
    const wanted = wantedScheme(settings);
    if (wanted) {
        if (local && local.getItem(PREV_KEY) === null) {
            local.setItem(PREV_KEY, readCookie());
        }
        if (readCookie() !== wanted) {
            writeCookie(wanted);
        }
        return loadedScheme() !== wanted;
    }
    if (local && local.getItem(PREV_KEY) !== null) {     // theme switched off: give the cookie back
        const previous = local.getItem(PREV_KEY);
        local.removeItem(PREV_KEY);
        writeCookie(previous);
        return loadedScheme() !== (previous === "dark" ? "dark" : (initial.site_scheme || "light"));
    }
    return false;
}
/** Reload to get the right bundle, but never twice within 15 seconds (no loop if something else fights the cookie). */
export function reloadForScheme(delay = 0) {
    const tab = storage("sessionStorage");
    const last = Number(tab?.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 15000) {
        return false;
    }
    tab?.setItem(RELOAD_KEY, String(Date.now()));
    setTimeout(() => window.location.reload(), delay);
    return true;
}
if (syncScheme(initial)) {
    reloadForScheme();
}
if (document.body) {
    usePrism(initial);
} else {
    document.addEventListener("DOMContentLoaded", () => usePrism(initial));
}
