from odoo import http
from odoo.http import request


class PrismController(http.Controller):

    @http.route('/prism_theme_studio/login_background', type='http', auth='public', readonly=True)
    def login_background(self, **kwargs):
        """The company photo for the login page (before sign-in nobody can read the company). Only served when the
        company shows Prism on its login page."""
        company = request.env.company.sudo()
        if not (company.prism_login and company.prism_background):
            return request.not_found()
        return request.env['ir.binary']._get_image_stream_from(company, 'prism_background').get_response()
