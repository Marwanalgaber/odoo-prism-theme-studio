import { Component, useState } from "@odoo/owl";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";
import {
    DEFAULTS, FONTS, OCCASIONS, PRESETS, SWATCHES, analyseImage, initial, occasionFor, reloadForScheme,
    setOccasionPreview, sunPreset, syncScheme, usePrism, wantedScheme,
} from "./prism_core";

const MAX_PHOTO = 1920;

/** The colourful brush in the top bar and the studio it opens. Every change is shown at once and saved. */
export class PrismStudio extends Component {
    static template = "prism_theme_studio.Studio";
    static components = { Dropdown };
    static props = {};

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.action = useService("action");
        this.presets = PRESETS;
        this.fonts = FONTS;
        this.swatches = SWATCHES;
        this.occasions = OCCASIONS;
        this.labels = { on: _t("On"), off: _t("Off"), moving: _t("Moving"), still: _t("Still") };
        this.insideOptions = [{ id: "style", name: _t("Style") }, { id: "light", name: _t("Light") }, { id: "dark", name: _t("Dark") }];
        this.effectOptions = [{ id: "auto", name: _t("Auto") }, { id: "full", name: _t("Full") }, { id: "lite", name: _t("Fast") }];
        this.layoutOptions = [{ id: "top", name: _t("Top menu") }, { id: "sidebar", name: _t("Sidebar") }];
        this.reloading = false;
        this.state = useState({ ...initial, preview: "", uploading: false });
        this._timer = null;
        this._dirtyLook = false;
    }

    get locked() {
        return this.state.source === "locked";
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

    get occasionToday() {
        const id = occasionFor();
        const meta = OCCASIONS.find((o) => o.id === id);
        return meta ? meta.name : _t("none today");
    }

    get sourceNote() {
        if (this.state.source === "locked") {
            return _t("Your company sets the style and colour for everybody. You can still change the font, spacing, effects and menu.");
        }
        if (this.state.source === "company") {
            return _t("You are using your company's look. Change anything to make it your own.");
        }
        return "";
    }

    set(values, { look = true } = {}) {
        if (look && this.locked && ["enabled", "preset", "accent"].some((key) => key in values)) {
            return;
        }
        Object.assign(this.state, values);
        if (look) {
            this._dirtyLook = true;
        }
        usePrism({ ...this.state });
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.save(), 400);       // a quick series of clicks is saved once
    }

    async save() {
        const s = this.state;
        const values = {
            prism_font: s.font, prism_density: s.density, prism_motion: s.motion, prism_inside: s.inside,
            prism_effects: s.effects, prism_occasions: s.occasions, prism_layout: s.layout,
            prism_pins: (s.pins || []).join(","),
        };
        if (!this.locked && this._dirtyLook) {
            Object.assign(values, {
                prism_enabled: s.enabled, prism_preset: s.preset, prism_accent: s.accent || false, prism_customized: true,
            });
            if (s.source === "company") {
                this.state.source = "user";
            }
        }
        try {
            await this.orm.write("res.users", [user.userId], values);
            session.prism_theme = { ...session.prism_theme, ...this.plain() };
            if (syncScheme(this.state) && !this.reloading && reloadForScheme(700)) {
                this.reloading = true;
                this.notification.add(wantedScheme(this.state) === "dark" ? _t("Switching the screens to dark…") : _t("Switching the screens to light…"),
                    { type: "info" });
            }
        } catch (error) {
            this.notification.add(error?.data?.message || _t("Your theme could not be saved."), { type: "danger" });
        }
    }

    plain() {
        const { preview, uploading, ...rest } = this.state;
        return { ...rest, pins: [...(rest.pins || [])] };
    }

    onColorInput(ev) {
        this.set({ accent: ev.target.value });
    }

    onPreview(ev) {
        this.state.preview = ev.target.value;
        setOccasionPreview(ev.target.value);
    }

    reset() {
        const keep = { enabled: this.state.enabled, photo: this.state.photo, photo_dark: this.state.photo_dark,
                       has_own_photo: this.state.has_own_photo, pins: this.state.pins, source: this.state.source };
        this.set({ ...DEFAULTS, ...keep, preset: this.locked ? this.state.preset : DEFAULTS.preset,
                   accent: this.locked ? this.state.accent : false });
    }

    /** Pick a photo: shrunk in the browser (max 1920 px, JPEG), its darkness measured, then saved on the user. */
    async onPhoto(ev) {
        const file = ev.target.files && ev.target.files[0];
        ev.target.value = "";
        if (!file) {
            return;
        }
        if (!file.type.startsWith("image/")) {
            this.notification.add(_t("Choose a picture (JPEG, PNG or WebP)."), { type: "warning" });
            return;
        }
        this.state.uploading = true;
        try {
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = URL.createObjectURL(file);
            });
            const ratio = Math.min(1, MAX_PHOTO / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            const info = analyseImage(img);
            const data = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
            await this.orm.write("res.users", [user.userId], {
                prism_background: data, prism_photo_dark: info.dark, prism_preset: "photo", prism_enabled: true,
                prism_customized: true,
            });
            this.set({
                photo: `/web/image/res.users/${user.userId}/prism_background?unique=${Date.now()}`,
                photo_dark: info.dark, has_own_photo: true, preset: "photo", enabled: true,
            });
        } catch {
            this.notification.add(_t("This picture could not be used."), { type: "danger" });
        } finally {
            this.state.uploading = false;
        }
    }

    async removePhoto() {
        // the company photo (if any) comes back with the next page load
        await this.orm.write("res.users", [user.userId], { prism_background: false, prism_photo_dark: false });
        this.set({ photo: false, photo_dark: false, has_own_photo: false, preset: this.state.preset === "photo" ? "aurora" : this.state.preset });
    }

    async openHome() {
        await this.action.doAction("prism_theme_studio.action_prism_home");
    }
}

registry.category("systray").add("prism_theme_studio.Studio", { Component: PrismStudio }, { sequence: 2 });
