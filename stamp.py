# -*- coding: utf-8 -*-
"""Re-stamp the asset links. Run this before any push that changes css or js.

    python stamp.py

Every href and src in the pages gets ?v=<hash of that file>, so a browser
that has yesterday's stylesheet asks for today's instead of deciding it already
has it. GitHub Pages sends max-age=600 and phones hold on longer than that;
without this, a person can be looking at an hour-old deploy while being told it
is current.

Two modules import another file of ours by name; those imports are stamped
first, so the hash of the file that imports already includes the new stamp.
"""
import io, hashlib, re, os

ASSETS = ['css/style.css', 'js/app.js', 'js/i18n.js', 'js/forms.js', 'js/auth.js',
          'js/save.js', 'js/channels.js', 'js/firebase-config.js', 'js/chat.js',
          'js/chairman.js', 'js/fb.js', 'js/media.js', 'js/orbit.js', 'js/agents.js', 'js/orbit3d.js',
          'js/space3d.js', 'js/universe3d.js', 'js/universe.js']
PAGES = ['index.html', 'form.html', 'chat.html', 'chairman.html', 'agents.html', 'universe.html']
IMPORTS = [('js/chat.js', 'media.js'), ('js/universe3d.js', 'space3d.js')]

def sha(a):
    return hashlib.sha1(io.open(a, 'rb').read()).hexdigest()[:8]

for f, dep in IMPORTS:
    if os.path.exists(f) and os.path.exists('js/' + dep):
        s = io.open(f, encoding='utf-8').read()
        s = re.sub(r"from '\./" + re.escape(dep) + r"(\?v=[0-9a-f]+)?'",
                   "from './" + dep + "?v=" + sha('js/' + dep) + "'", s)
        io.open(f, 'w', encoding='utf-8').write(s)

v = {a: sha(a) for a in ASSETS if os.path.exists(a)}

for p in PAGES:
    s = io.open(p, encoding='utf-8').read()
    for a, h in v.items():
        s = re.sub(r'(["\'])' + re.escape(a) + r'(\?v=[0-9a-f]+)?\1',
                   lambda m, a=a, h=h: m.group(1) + a + '?v=' + h + m.group(1), s)
    io.open(p, 'w', encoding='utf-8').write(s)

print('stamped %d assets across %d pages' % (len(v), len(PAGES)))
