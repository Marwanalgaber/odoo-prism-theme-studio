from odoo import _, api, fields, models
from odoo.exceptions import ValidationError

from .res_users import HEX, PRESETS


class ResCompany(models.Model):
    _inherit = 'res.company'

    prism_default_enabled = fields.Boolean(
        string='Company look for all users',
        help='Users who have not chosen their own look get this one. They can still change it, unless it is locked.')
    prism_default_preset = fields.Selection(PRESETS, string='Company style', default='aurora', required=True)
    prism_default_accent = fields.Char(string='Company accent colour', size=7, help='#RRGGBB, e.g. from the logo.')
    prism_lock = fields.Boolean(string='Lock the look',
                                help='Every user of the company has the company look and cannot change it.')
    prism_background = fields.Image(string='Company background photo', max_width=1920, max_height=1920)
    prism_photo_dark = fields.Boolean(string='Company photo is dark')
    prism_login = fields.Boolean(string='Prism on the login page', help='The login page shows the company style.')

    @api.constrains('prism_default_accent')
    def _check_prism_default_accent(self):
        for company in self:
            if company.prism_default_accent and not HEX.match(company.prism_default_accent):
                raise ValidationError(_('The accent colour must look like #1A2B3C.'))
