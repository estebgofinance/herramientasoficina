# Arma zentrack/master.html: base_v2.4.html + el CSS y el JS de cada capa (v2.6 en adelante), y pone la versión.
# Uso:  cd zentrack/capas && python armar.py        (después: cd .. && python build.py)
# Cada versión nueva es un archivo más en v27/ (vX.js y, si hace falta, vX.css), agregado al final de JS/CSS.
import os, sys
D = os.path.dirname(os.path.abspath(__file__))
VER = 'v2.13.2'
CSS = ['v26/v26.css', 'v27/v27.css', 'v27/v28.css', 'v27/v29.css', 'v27/v210.css', 'v27/v211.css', 'v27/v212.css', 'v27/v213.css']
JS = ['v26/v26.js', 'v26/v261.js', 'v27/v27.js', 'v27/v271.js', 'v27/v28.js', 'v27/v281.js', 'v27/v29.js', 'v27/v291.js', 'v27/v293.js',
      'v27/v210.js', 'v27/v211.js', 'v27/v212.js', 'v27/v213.js', 'v27/v2131.js', 'v27/v2132.js']
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, '..', 'master.html')
rd = lambda p: open(os.path.join(D, p), encoding='utf-8').read()
m = rd('base_v2.4.html')
css = '\n'.join(rd(p).rstrip('\n') for p in CSS) + '\n'
js = '\n'.join(rd(p).rstrip('\n') for p in JS) + '\n'
a = '\n</style>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/'
assert m.count(a) == 1; m = m.replace(a, css.rstrip('\n') + a, 1)
b = '</script>\n</body>'; i = m.rfind(b); assert i > 0; m = m[:i] + js.rstrip('\n') + '\n' + m[i:]
assert m.count('id="verTag">v2.4<') == 1; m = m.replace('id="verTag">v2.4<', 'id="verTag">' + VER + '<')
open(OUT, 'w', encoding='utf-8', newline='').write(m); print('master', VER, 'armado', len(m), OUT)
