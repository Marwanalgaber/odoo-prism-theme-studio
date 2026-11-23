import re
from datetime import datetime

import pytz

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

# The styles. The visual definition of each is in static/src/scss/prism_presets.scss and static/src/js/prism_core.js
# (a test checks the lists match). 'auto' picks a style by the time of day; 'photo' is the user's (or the company's)
# own picture.
PRESETS = [
    ('auto', 'Follow the sun'),
    ('aurora', 'Aurora'),
    ('mesh', 'Mesh Bloom'),
    ('dunes', 'Desert Dunes'),
    ('midnight', 'Midnight Sky'),
    ('glass', 'Glass Ocean'),
    ('paper', 'Paper Studio'),
    ('arabesque', 'Emerald Arabesque'),
    ('sunset', 'Sunset Horizon'),
    ('graphite', 'Graphite'),
    ('neon', 'Neon Grid'),
    ('photo', 'My photo'),
]
FONTS = [
    ('system', 'System'),
    ('humanist', 'Humanist sans'),
    ('rounded', 'Rounded'),
    ('serif', 'Editorial serif'),
    ('mono', 'Technical mono'),
    ('arabic_modern', 'Arabic modern'),
    ('arabic_classic', 'Arabic classic'),
]
DENSITY = [('comfortable', 'Comfortable'), ('compact', 'Compact')]
INSIDE = [('style', 'Follow the style'), ('light', 'Always light'), ('dark', 'Always dark')]
EFFECTS = [('auto', 'Automatic'), ('full', 'Full'), ('lite', 'Light (fast)')]
LAYOUT = [('top', 'Top menu'), ('sidebar', 'Sidebar')]
# styles whose screens are dark inside (Odoo's dark mode), and the style of each hour for 'Follow the sun'
DARK_PRESETS = {'aurora', 'midnight', 'graphite', 'neon', 'arabesque'}
SUN = [(5, 'mesh'), (8, 'dunes'), (16, 'sunset'), (19, 'aurora'), (22, 'midnight')]
# what a user can choose in the studio (all can be read and written by the user himself)
PRISM_FIELDS = ['prism_enabled', 'prism_preset', 'prism_accent', 'prism_font', 'prism_density', 'prism_motion',
                'prism_inside', 'prism_effects', 'prism_occasions', 'prism_layout', 'prism_pins', 'prism_background',
                'prism_photo_dark', 'prism_customized']
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')
PINS = re.compile(r'^[0-9,]*$')


def sun_preset(hour):
    preset = 'midnight'
    for start, key in SUN:
        if hour >= start:
            preset = key
    return preset


class ResUsers(models.Model):
    _inherit = 'res.users'

    prism_enabled = fields.Boolean(string='Prism theme', default=False,
                                   help='Use the Prism theme for this user. Every user decides for himself.')
    prism_preset = fields.Selection(PRESETS, string='Theme style', default='aurora', required=True)
    prism_accent = fields.Char(string='Accent colour', size=7,
                               help='#RRGGBB. Empty: the accent colour of the style.')
    prism_font = fields.Selection(FONTS, string='Theme font', default='system', required=True)
    prism_density = fields.Selection(DENSITY, string='Spacing', default='comfortable', required=True)
    prism_motion = fields.Boolean(string='Animated background', default=True)
    prism_inside = fields.Selection(INSIDE, string='Screens inside', default='style', required=True,
                                    help='Dark styles show the screens in dark mode; or always light / always dark.')
    prism_effects = fields.Selection(EFFECTS, string='Effects', default='auto', required=True,
                                     help='Automatic: glass and animation are turned down on a slow computer.')
    prism_occasions = fields.Boolean(string='Occasions', default=True,
                                     help='Decorations for Ramadan, the Eids, Founding Day, National Day and winter.')
    prism_layout = fields.Selection(LAYOUT, string='Menu', default='top', required=True)
    prism_pins = fields.Char(string='Pinned apps', help='Technical: ids of the menus pinned in the sidebar.')
    prism_background = fields.Image(string='My background photo', max_width=1920, max_height=1920)
    prism_photo_dark = fields.Boolean(string='Photo is dark', help='Technical: set when the photo is uploaded.')
    prism_customized = fields.Boolean(string='Own look', help='The user chose his own look (company defaults no longer '
                                                            'apply to him, unless the company locks the look).')

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + PRISM_FIELDS

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + PRISM_FIELDS

    @api.constrains('prism_accent', 'prism_pins')
    def _check_prism_values(self):
        for user in self:
            if user.prism_accent and not HEX.match(user.prism_accent):
                raise ValidationError(_('The accent colour must look like #1A2B3C.'))
            if user.prism_pins and not PINS.match(user.prism_pins):
                raise ValidationError(_('Pinned apps must be a list of menu ids.'))

    def _prism_look(self):
        """The look in force for this user: the company's when it locks it, or when the user has not chosen his own
        and the company gives a default; otherwise the user's own. Returns (look, source)."""
        self.ensure_one()
        company = self.company_id
        own = {'enabled': self.prism_enabled, 'preset': self.prism_preset, 'accent': self.prism_accent or False,
               'font': self.prism_font, 'density': self.prism_density, 'motion': self.prism_motion,
               'inside': self.prism_inside}
        if company.prism_lock or (company.prism_default_enabled and not self.prism_customized):
            look = dict(own, enabled=True, preset=company.prism_default_preset,
                        accent=company.prism_default_accent or False)
            return look, 'locked' if company.prism_lock else 'company'
        return own, 'user'

    def _prism_photo(self):
        """URL and darkness of the photo used by the 'photo' style: the user's own, else the company's."""
        self.ensure_one()
        if self.prism_background:
            stamp = int(self.write_date.timestamp()) if self.write_date else 0
            return '/web/image/res.users/%s/prism_background?unique=%s' % (self.id, stamp), self.prism_photo_dark
        company = self.company_id
        if company.prism_background:
            stamp = int(company.write_date.timestamp()) if company.write_date else 0
            return '/web/image/res.company/%s/prism_background?unique=%s' % (company.id, stamp), company.prism_photo_dark
        return False, False

    def _prism_settings(self):
        """What the browser needs to draw the theme for this user (sent with the session)."""
        self.ensure_one()
        look, source = self._prism_look()
        photo, photo_dark = self._prism_photo()
        return dict(look, source=source, scheme=self._prism_scheme(), photo=photo, photo_dark=photo_dark,
                    has_own_photo=bool(self.prism_background), effects=self.prism_effects,
                    occasions=self.prism_occasions, layout=self.prism_layout,
                    pins=[int(pin) for pin in (self.prism_pins or '').split(',') if pin])

    def _prism_scheme(self, hour=None):
        """'dark' or 'light': which Odoo bundle this user's screens use while the theme is on."""
        self.ensure_one()
        look, _source = self._prism_look()
        if look['inside'] != 'style':
            return look['inside']
        preset = look['preset']
        if preset == 'auto':
            if hour is None:
                tz = pytz.timezone(self.tz or 'UTC')
                hour = datetime.now(tz).hour
            preset = sun_preset(hour)
        if preset == 'photo':
            return 'dark' if self._prism_photo()[1] else 'light'
        return 'dark' if preset in DARK_PRESETS else 'light'
