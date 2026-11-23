import base64
import io
import os
import re

from PIL import Image

from odoo.exceptions import AccessError, ValidationError
from odoo.tests import HttpCase, TransactionCase, new_test_user, tagged

from ..models.res_users import DARK_PRESETS, FONTS, PRESETS, SUN

STATIC = os.path.join(os.path.dirname(__file__), '..', 'static', 'src')


def read(*parts):
    return open(os.path.join(STATIC, *parts), encoding='utf-8').read()


def picture(colour):
    buf = io.BytesIO()
    Image.new('RGB', (40, 30), colour).save(buf, 'JPEG')
    return base64.b64encode(buf.getvalue())


@tagged('post_install', '-at_install', 'prism_theme_studio')
class TestPrism(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.alice = new_test_user(cls.env, login='prism_alice', groups='base.group_user')
        cls.bob = new_test_user(cls.env, login='prism_bob', groups='base.group_user')
        # after the users: on sites that create an employee for every new user, writing the company first fails
        cls.company = cls.alice.company_id
        cls.company.write({'prism_default_enabled': False, 'prism_lock': False, 'prism_background': False})

    def test_off_by_default(self):
        self.assertFalse(self.alice.prism_enabled)
        settings = self.alice._prism_settings()
        self.assertEqual((settings['enabled'], settings['preset'], settings['source']), (False, 'aurora', 'user'))

    def test_a_user_sets_his_own_theme(self):
        """What the studio panel writes, as the user himself (no admin rights needed)."""
        values = {'prism_enabled': True, 'prism_preset': 'arabesque', 'prism_accent': '#B7791F',
                  'prism_font': 'arabic_modern', 'prism_density': 'compact', 'prism_motion': False,
                  'prism_effects': 'lite', 'prism_occasions': False, 'prism_layout': 'sidebar', 'prism_pins': '5,9'}
        self.alice.with_user(self.alice).write(values)
        settings = self.alice._prism_settings()
        self.assertEqual({k: settings[k] for k in ('enabled', 'preset', 'accent', 'font', 'density', 'motion', 'effects',
                                                   'occasions', 'layout', 'pins', 'scheme')},
                         {'enabled': True, 'preset': 'arabesque', 'accent': '#B7791F', 'font': 'arabic_modern',
                          'density': 'compact', 'motion': False, 'effects': 'lite', 'occasions': False,
                          'layout': 'sidebar', 'pins': [5, 9], 'scheme': 'dark'})
        self.assertFalse(self.bob.prism_enabled)            # nobody else changes
        with self.assertRaises(AccessError):
            self.bob.with_user(self.alice).write({'prism_enabled': True})

    def test_values_are_checked(self):
        with self.assertRaises(ValidationError):
            self.alice.with_user(self.alice).write({'prism_accent': 'red; background: url(x)'})
        with self.assertRaises(ValidationError):
            self.alice.with_user(self.alice).write({'prism_pins': '1,2);alert(1'})
        with self.assertRaises(ValidationError):
            self.company.write({'prism_default_accent': 'blue'})
        self.alice.with_user(self.alice).write({'prism_accent': False})     # empty = colour of the style

    def test_dark_styles_make_dark_screens(self):
        alice = self.alice.with_user(self.alice)
        alice.write({'prism_enabled': True, 'prism_preset': 'neon'})
        self.assertEqual(self.alice._prism_scheme(), 'dark')
        alice.write({'prism_preset': 'paper'})
        self.assertEqual(self.alice._prism_scheme(), 'light')
        alice.write({'prism_inside': 'dark'})
        self.assertEqual(self.alice._prism_scheme(), 'dark')          # the user's own choice wins
        alice.write({'prism_inside': 'style', 'prism_preset': 'auto'})
        self.assertEqual(self.alice._prism_scheme(hour=23), 'dark')   # night
        self.assertEqual(self.alice._prism_scheme(hour=10), 'light')  # day
        self.assertEqual(self.env['ir.http'].with_user(self.alice).color_scheme(), self.alice._prism_scheme())
        alice.write({'prism_enabled': False})
        self.assertEqual(self.env['ir.http'].with_user(self.alice).color_scheme(),
                         self.env['ir.http'].with_user(self.bob).color_scheme())   # theme off: the site decides

    def test_company_look(self):
        """A company default applies to users who have not chosen their own look; a lock applies to everybody but
        only for the style and the colour."""
        self.company.write({'prism_default_enabled': True, 'prism_default_preset': 'glass', 'prism_default_accent': '#0F766E'})
        settings = self.alice._prism_settings()
        self.assertEqual((settings['enabled'], settings['preset'], settings['accent'], settings['source']),
                         (True, 'glass', '#0F766E', 'company'))
        self.assertEqual(self.env['ir.http'].with_user(self.alice).color_scheme(), 'light')
        # the user makes it his own: the default no longer applies to him
        self.alice.with_user(self.alice).write({'prism_enabled': True, 'prism_preset': 'neon', 'prism_customized': True})
        self.assertEqual(self.alice._prism_settings()['preset'], 'neon')
        # locked: style and colour of the company for everybody; the font stays his own
        self.alice.with_user(self.alice).write({'prism_font': 'serif'})
        self.company.prism_lock = True
        settings = self.alice._prism_settings()
        self.assertEqual((settings['preset'], settings['accent'], settings['font'], settings['source']),
                         ('glass', '#0F766E', 'serif', 'locked'))

    def test_photo_style(self):
        alice = self.alice.with_user(self.alice)
        alice.write({'prism_enabled': True, 'prism_preset': 'photo'})
        self.assertFalse(self.alice._prism_settings()['photo'])                  # no picture anywhere yet
        self.company.write({'prism_background': picture('white'), 'prism_photo_dark': False})
        self.assertIn('/web/image/res.company/', self.alice._prism_settings()['photo'])
        self.assertEqual(self.alice._prism_scheme(), 'light')
        alice.write({'prism_background': picture('black'), 'prism_photo_dark': True})   # his own wins
        settings = self.alice._prism_settings()
        self.assertIn('/web/image/res.users/%s/prism_background' % self.alice.id, settings['photo'])
        self.assertTrue(settings['has_own_photo'])
        self.assertEqual(self.alice._prism_scheme(), 'dark')

    def test_lists_match_everywhere(self):
        """Python, SCSS and JS describe the same styles, fonts, dark styles and sun hours."""
        presets_scss = read('scss', 'prism_presets.scss')
        fonts_scss = read('scss', 'prism_ui.scss') + read('scss', 'prism_extras.scss')
        js = read('js', 'prism_core.js')
        js_presets = re.findall(r'\{ id: "([a-z]+)", name: _t\("[^"]+"\), accent', js)
        self.assertEqual(js_presets, [key for key, _label in PRESETS])
        for key, _label in PRESETS:
            if key != 'auto':
                self.assertIn('&.o_prism_p_%s {' % key, presets_scss, key)
        for key, _label in FONTS:
            self.assertIn('{ id: "%s"' % key, js, key)
            if key != 'system':
                self.assertIn('&.o_prism_f_%s {' % key, fonts_scss, key)
        self.assertIn('new Set([%s])' % ', '.join('"%s"' % k for k in
                                                   ['aurora', 'midnight', 'graphite', 'neon', 'arabesque']), js)
        self.assertEqual(DARK_PRESETS, {'aurora', 'midnight', 'graphite', 'neon', 'arabesque'})
        js_sun = re.search(r'const SUN = (\[.*?\]);', js).group(1)
        self.assertEqual(js_sun, '[%s]' % ', '.join('[%d, "%s"]' % pair for pair in SUN))

    def test_screens_exist(self):
        self.assertEqual(self.env.ref('prism_theme_studio.action_prism_home').tag, 'prism_theme_studio.home')
        self.env['res.config.settings'].get_view(view_type='form')     # the settings page builds


@tagged('post_install', '-at_install', 'prism_theme_studio')
class TestPrismLogin(HttpCase):

    def test_login_background_only_when_asked(self):
        company = self.env.company
        company.write({'prism_login': False, 'prism_background': picture('blue')})
        self.assertEqual(self.url_open('/prism_theme_studio/login_background').status_code, 404)
        company.prism_login = True
        response = self.url_open('/prism_theme_studio/login_background')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.headers.get('Content-Type', '').startswith('image/'))
        page = self.url_open('/web/login').text
        self.assertIn('o_prism_login', page)
