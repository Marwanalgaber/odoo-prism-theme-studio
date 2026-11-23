import { Component, onWillDestroy, onWillUnmount, useState } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { user } from "@web/core/user";
import { useService } from "@web/core/utils/hooks";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { OCCASIONS, getCurrent, occasionFor, onPrismChange, usePrism } from "./prism_core";

const OPEN_KEY = "prism_sidebar_open";

function readOpen() {
    try {
        return window.localStorage.getItem(OPEN_KEY) !== "0";
    } catch {
        return true;
    }
}

/** An app as the menu service gives it, ready to draw: image or coloured icon. */
function appView(app) {
    return {
        id: app.id, name: app.name, app,
        image: app.webIconData || false,
        icon: app.webIcon ? app.webIcon : false,
    };
}

/** Pin / unpin an app (saved on the user, so the pins follow him to any computer). */
async function togglePin(orm, id) {
    const pins = new Set(getCurrent().pins || []);
    if (pins.has(id)) {
        pins.delete(id);
    } else {
        pins.add(id);
    }
    const list = [...pins];
    usePrism({ ...getCurrent(), pins: list });
    await orm.write("res.users", [user.userId], { prism_pins: list.join(",") });
}

/** The vertical app menu (layout "Sidebar"): pinned apps first, then all apps; collapsible. */
export class PrismSidebar extends Component {
    static template = "prism_theme_studio.Sidebar";
    static props = {};

    setup() {
        this.menu = useService("menu");
        this.orm = useService("orm");
        this.action = useService("action");
        const settings = getCurrent();
        this.state = useState({
            shown: settings.enabled && settings.layout === "sidebar",
            pins: settings.pins || [],
            open: readOpen(),
            search: "",
        });
        this._applyOpen();
        const off = onPrismChange((s) => {
            this.state.shown = s.enabled && s.layout === "sidebar";
            this.state.pins = s.pins || [];
            this._applyOpen();
        });
        onWillUnmount(off);
        onWillDestroy(off);
    }

    _applyOpen() {
        document.body.classList.toggle("o_prism_sidebar_open", this.state.shown && this.state.open);
    }

    get apps() {
        const search = this.state.search.trim().toLowerCase();
        return this.menu.getApps().map(appView).filter((a) => !search || a.name.toLowerCase().includes(search));
    }

    get pinned() {
        const byId = new Map(this.apps.map((a) => [a.id, a]));
        return this.state.pins.map((id) => byId.get(id)).filter(Boolean);
    }

    get others() {
        const pins = new Set(this.state.pins);
        return this.apps.filter((a) => !pins.has(a.id));
    }

    get currentId() {
        return this.menu.getCurrentApp()?.id;
    }

    toggle() {
        this.state.open = !this.state.open;
        try {
            window.localStorage.setItem(OPEN_KEY, this.state.open ? "1" : "0");
        } catch {
            // private mode: only for this page
        }
        this._applyOpen();
    }

    open(app) {
        this.menu.selectMenu(app.app);
    }

    async pin(ev, app) {
        ev.stopPropagation();
        await togglePin(this.orm, app.id);
    }

    async home() {
        await this.action.doAction("prism_theme_studio.action_prism_home", { clearBreadcrumbs: true });
    }
}

registry.category("main_components").add("prism_theme_studio.Sidebar", { Component: PrismSidebar });

/** "My home": greeting, clock, Gregorian and Hijri date, today's occasion, pinned apps and all apps. */
export class PrismHome extends Component {
    static template = "prism_theme_studio.Home";
    static props = { ...standardActionServiceProps };

    setup() {
        this.menu = useService("menu");
        this.orm = useService("orm");
        this.state = useState({ now: new Date(), search: "", pins: getCurrent().pins || [] });
        this.userName = user.name;
        const timer = setInterval(() => (this.state.now = new Date()), 1000);
        const off = onPrismChange((s) => (this.state.pins = s.pins || []));
        onWillUnmount(() => {
            clearInterval(timer);
            off();
        });
    }

    get greeting() {
        const hour = this.state.now.getHours();
        if (hour >= 5 && hour < 12) {
            return _t("Good morning");
        }
        if (hour >= 12 && hour < 17) {
            return _t("Good afternoon");
        }
        if (hour >= 17 && hour < 22) {
            return _t("Good evening");
        }
        return _t("Good night");
    }

    get firstName() {
        return (this.userName || "").split(" ")[0];
    }

    get time() {
        return this.state.now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    get date() {
        return this.state.now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }

    get hijri() {
        try {
            return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(this.state.now);
        } catch {
            return "";
        }
    }

    get occasion() {
        const meta = OCCASIONS.find((o) => o.id === occasionFor(this.state.now));
        return meta ? meta.greeting : "";
    }

    get apps() {
        const search = this.state.search.trim().toLowerCase();
        return this.menu.getApps().map(appView).filter((a) => !search || a.name.toLowerCase().includes(search));
    }

    get pinned() {
        const byId = new Map(this.apps.map((a) => [a.id, a]));
        return this.state.pins.map((id) => byId.get(id)).filter(Boolean);
    }

    open(app) {
        this.menu.selectMenu(app.app);
    }

    onSearchKey(ev) {
        if (ev.key === "Enter" && this.apps.length) {
            this.open(this.apps[0]);
        }
    }

    async pin(ev, app) {
        ev.stopPropagation();
        await togglePin(this.orm, app.id);
    }
}

registry.category("actions").add("prism_theme_studio.home", PrismHome);
