import re

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

# The styles. The visual definition of each is in static/src/scss/prism_presets.scss and static/src/js/prism_theme.js
# (a test checks the three lists match). 'auto' is not a style of its own: the browser picks one by the time of day.
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
]
FONTS = [
    ('system', 'System'),
    ('humanist', 'Humanist sans'),
    ('rounded', 'Rounded'),
    ('serif', 'Editorial serif'),
    ('mono', 'Technical mono'),
]
DENSITY = [('comfortable', 'Comfortable'), ('compact', 'Compact')]
PRISM_FIELDS = ['prism_enabled', 'prism_preset', 'prism_accent', 'prism_font', 'prism_density', 'prism_motion']
HEX = re.compile(r'^#[0-9a-fA-F]{6}$')


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

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + PRISM_FIELDS

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + PRISM_FIELDS

    @api.constrains('prism_accent')
    def _check_prism_accent(self):
        for user in self:
            if user.prism_accent and not HEX.match(user.prism_accent):
                raise ValidationError(_('The accent colour must look like #1A2B3C.'))

    def _prism_settings(self):
        """What the browser needs to draw the theme for this user (sent with the session)."""
        self.ensure_one()
        return {
            'enabled': self.prism_enabled,
            'preset': self.prism_preset,
            'accent': self.prism_accent or False,
            'font': self.prism_font,
            'density': self.prism_density,
            'motion': self.prism_motion,
        }
