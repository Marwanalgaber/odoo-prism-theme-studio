import { Component, useState } from "@odoo/owl";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

/** The ten styles: id (same as the Python selection), name, preview of the card and the default accent. */
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
];
export const FONTS = [
    { id: "system", name: _t("System") },
    { id: "humanist", name: _t("Humanist sans") },
    { id: "rounded", name: _t("Rounded") },
    { id: "serif", name: _t("Editorial serif") },
    { id: "mono", name: _t("Technical mono") },
];
/** "Follow the sun": the style for the hour of the day. */
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
const SWATCHES = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#65a30d", "#d97706", "#dc2626", "#db2777", "#475569"];
const DEFAULTS = { enabled: false, preset: "aurora", accent: false, font: "system", density: "comfortable", motion: true };

/** Put the user's settings on <body>: one class per choice and the accent as a CSS variable. */
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
    body.style.removeProperty("--prism-user-accent");
    if (!settings.enabled) {
        return;
    }
    const preset = settings.preset === "auto" ? sunPreset() : settings.preset;
    body.classList.add("o_prism", `o_prism_p_${preset}`, `o_prism_f_${settings.font}`);
    if (settings.density === "compact") {
        body.classList.add("o_prism_compact");
    }
    if (settings.motion) {
        body.classList.add("o_prism_motion");
    }
    if (settings.accent) {
        body.style.setProperty("--prism-user-accent", settings.accent);
    }
}

let current = null;
/** Remember the settings, draw them, and keep "Follow the sun" and the spotlight running. */
function usePrism(settings) {
    current = settings;
    applyPrism(settings);
}
// "Follow the sun" moves on by itself
setInterval(() => current && current.enabled && current.preset === "auto" && applyPrism(current), 10 * 60 * 1000);
// the spotlight: a soft light in the accent colour that follows the mouse (one update per frame at most)
let frame = null;
window.addEventListener("pointermove", (ev) => {
    if (frame || !document.body.classList.contains("o_prism_motion")) {
        return;
    }
    frame = requestAnimationFrame(() => {
        document.body.style.setProperty("--prism-mx", `${ev.clientX}px`);
        document.body.style.setProperty("--prism-my", `${ev.clientY}px`);
        frame = null;
    });
}, { passive: true });

const initial = { ...DEFAULTS, ...(session.prism_theme || {}) };
if (document.body) {
    usePrism(initial);
} else {
    document.addEventListener("DOMContentLoaded", () => usePrism(initial));
}

/** The palette icon in the top bar and the studio panel it opens. Every change is shown at once and saved. */
export class PrismStudio extends Component {
    static template = "prism_theme_studio.Studio";
    static components = { Dropdown };
    static props = {};

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.presets = PRESETS;
        this.fonts = FONTS;
        this.swatches = SWATCHES;
        this.labels = { on: _t("On"), off: _t("Off"), moving: _t("Moving"), still: _t("Still") };
        this.state = useState({ ...initial });
        this._timer = null;
    }

    get preset() {
        return PRESETS.find((p) => p.id === this.state.preset) || PRESETS[0];
    }

    get pick() {
        return this.state.accent || this.preset.accent;
    }

    get sunNow() {
        const now = PRESETS.find((p) => p.id === sunPreset());
        return now ? now.name : "";
    }

    set(values) {
        Object.assign(this.state, values);
        usePrism({ ...this.state });
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.save(), 400);       // a quick series of clicks is saved once
    }

    async save() {
        const { enabled, preset, accent, font, density, motion } = this.state;
        try {
            await this.orm.write("res.users", [user.userId], {
                prism_enabled: enabled, prism_preset: preset, prism_accent: accent || false,
                prism_font: font, prism_density: density, prism_motion: motion,
            });
            session.prism_theme = { enabled, preset, accent, font, density, motion };
        } catch (error) {
            this.notification.add(error?.data?.message || _t("Your theme could not be saved."), { type: "danger" });
        }
    }

    onColorInput(ev) {
        this.set({ accent: ev.target.value });
    }

    reset() {
        this.set({ ...DEFAULTS, enabled: this.state.enabled });
    }
}

registry.category("systray").add("prism_theme_studio.Studio", { Component: PrismStudio }, { sequence: 2 });
