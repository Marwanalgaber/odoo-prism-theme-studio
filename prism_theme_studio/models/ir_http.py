from odoo import models


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        """The user's theme settings travel with the session, so the theme is drawn before the first screen."""
        result = super().session_info()
        user = self.env.user
        if user and not user.share:
            result['prism_theme'] = dict(user._prism_settings(), site_scheme=super().color_scheme())
        return result

    def color_scheme(self):
        """With the theme on (by the user or by the company), the style decides light or dark screens (Odoo's dark
        bundle); otherwise the site decides as before."""
        user = self.env.user
        if user and not user.share and user._prism_look()[0]['enabled']:
            return user._prism_scheme()
        return super().color_scheme()
