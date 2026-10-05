#!/usr/bin/env python3
"""
build.py — parte master.html en los archivos que pide Apps Script.

master.html es la única fuente de verdad: se edita ahí y se corre esto.
Apps Script no deja pegar 320 KB de una sola vez sin que la pegada se
corte, y si el corte cae dentro del <style> la página sale EN BLANCO.
Partido, ningún archivo pasa del límite y cada uno se pega sin drama.

Los cortes del JS caen SIEMPRE en una frontera de sección de primer nivel
(los comentarios /* ==== TÍTULO ==== */), nunca a mitad de una función.
"""
import re, sys, os

LIMITE = 62 * 1024          # ningún archivo generado pasa de esto
SALIDA = 'appsscript'

def bloques(b):
    """Escaneo secuencial: un <style> escrito dentro de una plantilla de JS
       no se confunde con un bloque real porque el cursor ya lo dejó atrás."""
    out, cur = [], 0
    pat = re.compile(r'<(script|style)\b([^>]*)>')
    while True:
        m = pat.search(b, cur)
        if not m: break
        t = m.group(1); cierre = '</%s>' % t
        fin = b.find(cierre, m.end())
        if fin < 0: raise SystemExit('bloque <%s> sin cerrar' % t)
        out.append(dict(t=t, attrs=m.group(2), a=m.start(), ini=m.end(), fin=fin, b=fin+len(cierre)))
        cur = fin + len(cierre)
    return out

def cortes_js(js):
    """Fronteras permitidas: el inicio de cada sección de primer nivel."""
    return [m.start() for m in re.finditer(r'\n/\* =+', js)]

def cortes_css(css):
    """Fronteras permitidas: cualquier salto de línea fuera de una regla."""
    out, d = [], 0
    for i, ch in enumerate(css):
        if ch == '{': d += 1
        elif ch == '}': d -= 1
        elif ch == '\n' and d == 0: out.append(i)
    return out

def partir(texto, marcas, limite):
    """Llena cada trozo hasta donde quepa, cortando solo en las fronteras dadas."""
    marcas = sorted(set([0] + [m for m in marcas if 0 < m < len(texto)] + [len(texto)]))
    partes, ini, i = [], 0, 0
    while i < len(marcas) - 1:
        j = i
        while j + 1 < len(marcas) and marcas[j + 1] - ini <= limite:
            j += 1
        if j == i:
            j = i + 1                      # una sección sola ya se pasa: va entera
        partes.append(texto[ini:marcas[j]])
        ini = marcas[j]
        i = j
    if ini < len(texto):
        partes.append(texto[ini:])
    return [p for p in partes if p.strip()]

def main():
    b = open('master.html', encoding='utf-8').read()
    bs = bloques(b)
    css = [x for x in bs if x['t'] == 'style']
    ext = [x for x in bs if x['t'] == 'script' and 'src=' in x['attrs']]
    scr = [x for x in bs if x['t'] == 'script' and 'src=' not in x['attrs']]
    if not css or len(scr) < 2: raise SystemExit('master.html no tiene la forma esperada')

    head  = b[:css[0]['a']]
    CSS   = '\n'.join(b[x['ini']:x['fin']] for x in css)
    exts  = ''.join(b[x['a']:x['b']] for x in ext)
    mini  = b[scr[0]['a']:scr[0]['b']]
    body  = b[b.index('<body>'):scr[1]['a']]
    JS    = '\n'.join(b[x['ini']:x['fin']] for x in scr[1:])
    cola  = b[scr[-1]['b']:]

    partes  = partir(JS,  cortes_js(JS),  LIMITE)
    cssPart = partir(CSS, cortes_css(CSS), LIMITE)
    nombres = ['Motor%d' % (i+1) for i in range(len(partes))]
    nomCSS  = ['Estilos'] if len(cssPart) == 1 else ['Estilos%d' % (i+1) for i in range(len(cssPart))]

    os.makedirs(SALIDA, exist_ok=True)
    for f in os.listdir(SALIDA):
        if re.match(r'(Index|Estilos\d*|Motor\d+)\.html$', f): os.remove(os.path.join(SALIDA, f))

    def esc(s):
        """Apps Script interpreta <? ?> como código: si apareciera, lo partimos."""
        return s.replace('<?', '<" + "?')

    index = (head
             + '\n'.join("<?!= include('%s'); ?>" % n for n in nomCSS) + '\n'
             + exts + '\n' + mini + '\n'
             + body
             + '\n'.join("<?!= include('%s'); ?>" % n for n in nombres)
             + '\n' + cola)

    def guardar(nombre, txt):
        ruta = os.path.join(SALIDA, nombre + '.html')
        open(ruta, 'wb').write(txt.replace('\r\n', '\n').replace('\n', '\r\n').encode('utf-8'))
        kb = os.path.getsize(ruta) / 1024
        marca = '  ⚠ PASADO DEL LÍMITE' if kb * 1024 > LIMITE * 1.15 else ''
        print('  %-10s %6.1f KB%s' % (nombre, kb, marca))

    print('Archivos para Apps Script:')
    guardar('Index', index)
    for n, c in zip(nomCSS, cssPart):
        guardar(n, '<style>\n' + c + '\n</style>')
    for n, p in zip(nombres, partes):
        guardar(n, '<script>\n' + p + '\n</script>')

    for z in ['<?' in CSS, any('<?' in p for p in partes)]:
        if z: print('  ⚠ hay una secuencia <? en el contenido: Apps Script la interpretaría')
    print('\nOrden para pegar: %s, Index de ÚLTIMO.' % ', '.join(nomCSS + nombres))

main()

def verificar():
    """Rearma lo generado como lo hace include() y comprueba que sea el master."""
    import difflib
    idx = open(os.path.join(SALIDA, 'Index.html'), encoding='utf-8').read()
    asm = re.sub(r"<\?!= include\('([^']+)'\); \?>",
                 lambda m: open(os.path.join(SALIDA, m.group(1) + '.html'), encoding='utf-8').read(),
                 idx)
    def n(s):
        s = s.replace('\r\n', '\n')
        # las costuras del corte son inocuas: cerrar y reabrir el mismo bloque
        s = re.sub(r'</style>\s*<style>', '', s)
        s = re.sub(r'</script>\s*<script>', '', s)
        return re.sub(r'\s+', ' ', s).strip()
    a, c = n(open('master.html', encoding='utf-8').read()), n(asm)
    if a == c:
        print('\n✓ el ensamblado reproduce master.html exactamente')
    else:
        print('\n✗ el ensamblado NO coincide con master.html')
        for ln in list(difflib.unified_diff(a.split(' '), c.split(' '), lineterm='', n=2))[:20]:
            print('   ', ln[:140])
        sys.exit(1)

if '--verify' in sys.argv or True:
    verificar()
