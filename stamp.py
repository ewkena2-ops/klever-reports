# -*- coding: utf-8 -*-
"""Re-stamp the asset links. Run this before any push that changes css or js.

    python stamp.py

Every href and src in the four pages gets ?v=<hash of that file>, so a browser
that has yesterday's stylesheet asks for today's instead of deciding it already
has it. GitHub Pages sends max-age=600 and phones hold on longer than that;
without this, a person can be looking at an hour-old deploy while being told it
is current.
"""
import io, hashlib, re, os

ASSETS = ['css/style.css', 'js/app.js', 'js/i18n.js', 'js/forms.js', 'js/auth.js',
          'js/save.js', 'js/channels.js', 'js/firebase-config.js', 'js/chat.js',
          'js/chairman.js', 'js/fb.js', 'js/media.js']
PAGES = ['index.html', 'form.html', 'chat.html', 'chairman.html']

v = {a: hashlib.sha1(io.open(a, 'rb').read()).hexdigest()[:8]
     for a in ASSETS if os.path.exists(a)}

for p in PAGES:
    s = io.open(p, encoding='utf-8').read()
    for a, h in v.items():
        s = re.sub(r'(["\'])' + re.escape(a) + r'(\?v=[0-9a-f]+)?\1',
                   lambda m, a=a, h=h: m.group(1) + a + '?v=' + h + m.group(1), s)
    io.open(p, 'w', encoding='utf-8').write(s)

if os.path.exists('js/chat.js') and 'js/media.js' in v:
    s = io.open('js/chat.js', encoding='utf-8').read()
    s = re.sub(r"from '\./media\.js(\?v=[0-9a-f]+)?'",
               "from './media.js?v=" + v['js/media.js'] + "'", s)
    io.open('js/chat.js', 'w', encoding='utf-8').write(s)

print('stamped %d assets across %d pages' % (len(v), len(PAGES)))
