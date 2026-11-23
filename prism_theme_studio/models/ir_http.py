from odoo import models


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        """The user's theme settings travel with the session, so the theme is drawn before the first screen."""
        result = super().session_info()
        user = self.env.user
        if user and not user.share:
            result['prism_theme'] = user._prism_settings()
        return result
