# ============================================================
#  NUTRICENSE — Uji akun demo pada situs yang sudah tayang
#  Membuka aplikasi, masuk untuk tiap peran lewat tombol
#  "Isi & masuk", lalu memastikan dasbor peran itu benar muncul.
#
#  python verify_demo.py [--url https://nutricense.web.app]
# ============================================================

import os
import sys
from playwright.sync_api import sync_playwright

URL = 'https://nutricense.web.app'
if '--url' in sys.argv:
    URL = sys.argv[sys.argv.index('--url') + 1]

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, 'shots')
os.makedirs(SHOTS, exist_ok=True)

ROLES = [
    ('sekolah',    '/sekolah',    'Dashboard sekolah'),
    ('sppg',       '/sppg',       'Dashboard SPPG'),
    ('pemerintah', '/pemerintah', 'Dashboard nasional'),
    ('murid',      '/murid',      'Dashboard murid'),
]

fails = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    for role, home, label in ROLES:
        ctx = browser.new_context(viewport={'width': 430, 'height': 932},
                                  device_scale_factor=2, locale='id-ID')
        page = ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append('console.' + m.type + ': ' + m.text)
                if m.type == 'error' else None)

        page.goto(URL + '/app.html#/login/' + role, wait_until='networkidle')
        page.wait_for_selector('[data-act="isi-demo"]', timeout=15000)
        page.click('[data-act="isi-demo"]')

        ok = False
        try:
            page.wait_for_function(
                "h => location.hash.startsWith('#' + h)", arg=home, timeout=20000)
            page.wait_for_timeout(1500)
            ok = True
        except Exception as e:
            errors.append('tidak sampai ke ' + home + ': ' + str(e)[:120])

        page.screenshot(path=os.path.join(SHOTS, 'login_%s.png' % role))
        status = 'OK ' if ok else 'GAGAL'
        print('%-11s %-6s hash=%s' % (role, status, page.evaluate('location.hash')))
        for e in errors[:4]:
            print('            ! %s' % e[:150])
        if not ok:
            fails.append(role)
        ctx.close()
    browser.close()

print()
print('Hasil: %d dari %d peran berhasil masuk.' % (len(ROLES) - len(fails), len(ROLES)))
sys.exit(1 if fails else 0)
