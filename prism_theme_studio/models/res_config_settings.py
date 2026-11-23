from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    prism_default_enabled = fields.Boolean(related='company_id.prism_default_enabled', readonly=False)
    prism_default_preset = fields.Selection(related='company_id.prism_default_preset', readonly=False)
    prism_default_accent = fields.Char(related='company_id.prism_default_accent', readonly=False)
    prism_lock = fields.Boolean(related='company_id.prism_lock', readonly=False)
    prism_background = fields.Image(related='company_id.prism_background', readonly=False)
    prism_photo_dark = fields.Boolean(related='company_id.prism_photo_dark', readonly=False)
    prism_login = fields.Boolean(related='company_id.prism_login', readonly=False)
