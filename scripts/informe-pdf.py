#!/usr/bin/env python3
"""Markdown -> HTML (estilo academico) para imprimir a PDF. Uso: informe-pdf.py entrada.md salida.html"""
import html, re, sys
from pathlib import Path
import markdown

def front_matter(texto):
    m = re.match(r"\A---\s*\n(.*?)\n---\s*\n", texto, re.S)
    if not m:
        return {}, texto
    datos, clave = {}, None
    for linea in m.group(1).splitlines():
        if re.match(r"^\s+-\s+", linea) and clave:
            datos[clave].append(linea.split("-", 1)[1].strip().strip("\"'"))
        elif ":" in linea:
            clave, _, v = linea.partition(":")
            clave, v = clave.strip().lower(), v.strip().strip("\"'")
            datos[clave] = v if v else []
    return datos, texto[m.end():]

def main():
    entrada, salida = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    css = (Path(__file__).resolve().parent.parent / "docs/informes/estilo.css").read_text(encoding="utf-8")
    fm, cuerpo = front_matter(entrada.read_text(encoding="utf-8"))
    cuerpo = re.sub(r"^```mermaid\s*\n(.*?)^```", lambda m: '<div class="mermaid">\n%s\n</div>' % html.escape(m.group(1)), cuerpo, flags=re.S | re.M)
    cuerpo_html = markdown.markdown(cuerpo, extensions=["tables", "fenced_code", "sane_lists", "attr_list"])
    # rutas de imagen relativas al .md
    base = entrada.parent.as_uri() + "/"
    cuerpo_html = re.sub(r'(<img [^>]*src=")(?![a-z]+:|/)([^"]+)"', lambda m: m.group(1) + base + m.group(2) + '"', cuerpo_html)
    portada = ""
    if fm.get("title"):
        e = html.escape
        autores = fm.get("autores", [])
        if isinstance(autores, str):
            autores = [autores]
        portada = '<div class="portada"><h1>%s</h1>' % e(fm["title"])
        if fm.get("subtitle"): portada += '<p class="sub">%s</p>' % e(fm["subtitle"])
        if autores: portada += '<p class="meta">%s</p>' % e(", ".join(autores))
        extra = " · ".join(e(fm[k]) for k in ("curso", "fecha") if fm.get(k))
        if extra: portada += '<p class="meta">%s</p>' % extra
        portada += "</div>"
    mer = ""
    if 'class="mermaid"' in cuerpo_html:
        mer = ('<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>'
               '<script>mermaid.initialize({startOnLoad:true,theme:"neutral"});</script>')
    titulo = html.escape(fm.get("title", entrada.stem))
    salida.write_text('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>%s</title><style>%s</style></head><body>%s%s%s</body></html>'
                      % (titulo, css, portada, cuerpo_html, mer), encoding="utf-8")

main()
