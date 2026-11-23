import os
import re

from odoo.exceptions import AccessError, ValidationError
from odoo.tests import TransactionCase, new_test_user, tagged

from ..models.res_users import FONTS, PRESETS

STATIC = os.path.join(os.path.dirname(__file__), '..', 'static', 'src')


@tagged('post_install', '-at_install', 'prism_theme_studio')
class TestPrism(TransactionCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.alice = new_test_user(cls.env, login='prism_alice', groups='base.group_user')
        cls.bob = new_test_user(cls.env, login='prism_bob', groups='base.group_user')

    def test_off_by_default(self):
        self.assertFalse(self.alice.prism_enabled)
        self.assertEqual(self.alice._prism_settings()['preset'], 'aurora')

    def test_a_user_sets_his_own_theme(self):
        """What the studio panel writes, as the user himself (no admin rights needed)."""
        values = {'prism_enabled': True, 'prism_preset': 'arabesque', 'prism_accent': '#B7791F',
                  'prism_font': 'serif', 'prism_density': 'compact', 'prism_motion': False}
        self.alice.with_user(self.alice).write(values)
        self.assertEqual(self.alice._prism_settings(), {
            'enabled': True, 'preset': 'arabesque', 'accent': '#B7791F', 'font': 'serif', 'density': 'compact',
            'motion': False})
        self.assertFalse(self.bob.prism_enabled)            # nobody else changes
        with self.assertRaises(AccessError):
            self.bob.with_user(self.alice).write({'prism_enabled': True})

    def test_accent_must_be_a_colour(self):
        with self.assertRaises(ValidationError):
            self.alice.with_user(self.alice).write({'prism_accent': 'red; background: url(x)'})
        self.alice.with_user(self.alice).write({'prism_accent': False})     # empty = colour of the style

    def test_settings_travel_with_the_session(self):
        settings = self.alice._prism_settings()
        self.assertEqual(set(settings), {'enabled', 'preset', 'accent', 'font', 'density', 'motion'})

    def test_styles_are_defined_everywhere(self):
        """Every style of the Python list has its CSS and its card in the studio, and the fonts have their CSS."""
        scss = open(os.path.join(STATIC, 'scss', 'prism_presets.scss'), encoding='utf-8').read()
        ui = open(os.path.join(STATIC, 'scss', 'prism_ui.scss'), encoding='utf-8').read()
        js = open(os.path.join(STATIC, 'js', 'prism_theme.js'), encoding='utf-8').read()
        js_presets = re.findall(r'\{ id: "([a-z]+)", name: _t\("[^"]+"\), accent', js)
        self.assertEqual(js_presets, [key for key, _label in PRESETS])
        for key, _label in PRESETS:
            if key == 'auto':
                self.assertIn('[22, "midnight"]', js)       # every hour picks a real style
                continue
            self.assertIn('&.o_prism_p_%s {' % key, scss, key)
        for key, _label in FONTS:
            self.assertIn('{ id: "%s"' % key, js, key)
            if key != 'system':
                self.assertIn('&.o_prism_f_%s {' % key, ui, key)
