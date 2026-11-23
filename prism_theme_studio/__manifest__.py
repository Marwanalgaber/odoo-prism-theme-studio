{
    'name': 'Prism Theme Studio',
    'version': '19.0.1.0.2',
    'category': 'Themes/Backend',
    'summary': 'Backend theme with 10 original animated backgrounds, accent colour, fonts, density and live preview, '
               'chosen by every user for himself',
    'description': """
Written from scratch for Odoo 19 (Community and Enterprise).

* 10 styles, each with its own background drawn in CSS (no image files): Aurora, Mesh Bloom, Desert Dunes,
  Midnight Sky, Glass Ocean, Paper Studio, Emerald Arabesque, Sunset Horizon, Graphite, Neon Grid, and
  "Follow the sun": dawn, day, sunset, evening and night styles by the time of day.
* A soft spotlight in the accent colour follows the mouse; cards lift on hover; buttons get a light sheen.
* Forms, lists and kanban float as cards on the background; frosted-glass top bar and control panel.
* Accent colour (swatches or any colour), five fonts, comfortable or compact spacing, animation on or off
  (also off when the system asks for reduced motion).
* Live preview: a palette icon in the top bar opens the studio; every change shows at once and is saved for the user.
* Per user: the theme is off until a user switches it on for himself, so it can be installed without changing the
  screens of anybody else.
""",
    'author': 'Marwan Algaber',
    'maintainer': 'Marwan Algaber',
    'license': 'LGPL-3',
    'depends': ['web'],
    'data': [],
    'assets': {
        'web.assets_backend': [
            'prism_theme_studio/static/src/scss/prism_presets.scss',
            'prism_theme_studio/static/src/scss/prism_ui.scss',
            'prism_theme_studio/static/src/js/prism_theme.js',
            'prism_theme_studio/static/src/xml/prism_theme.xml',
        ],
    },
    'images': ['static/description/banner.png'],
    'installable': True,
    'application': False,
}
