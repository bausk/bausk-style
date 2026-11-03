"""Build a PowerPoint template (.potx) and a sample deck (.pptx) for a look.

    uv run --with python-pptx python build/pptx/make_template.py <look> <out-dir>

Reads dist/json/<look>.json, so run `node build/build.mjs` first. Sizes follow the
1920x1080 slide tokens: one design pixel = 0.5 pt = 6350 EMU on a 13.333 x 7.5 in slide.
"""
from __future__ import annotations

import copy
import json
import sys
import zipfile
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE, PP_PLACEHOLDER
from pptx.opc.constants import RELATIONSHIP_TYPE as RT
from pptx.util import Emu, Pt

ROOT = Path(__file__).resolve().parents[2]
NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main", "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
A = "{%s}" % NS["a"]
P = "{%s}" % NS["p"]
PX = 6350  # EMU per design pixel


def px(v: float) -> Emu:
    return Emu(int(round(v * PX)))


def hexv(c: str) -> str:
    return c.lstrip("#").upper()


def load(look_id: str) -> dict:
    return json.loads((ROOT / "dist" / "json" / f"{look_id}.json").read_text("utf-8"))


# ---- theme ---------------------------------------------------------------
def set_theme(prs, look) -> None:
    c, office = look["color"]["light"], look["desktop"]["office"]
    part = prs.slide_master.part.part_related_by(RT.THEME)
    root = etree.fromstring(part.blob)
    root.set("name", f"bausk-style {look['id']}")
    scheme = root.find(".//a:clrScheme", NS)
    scheme.set("name", f"bausk-style {look['id']}")
    slots = {
        "dk1": c["fg"], "lt1": c["bg"], "dk2": c["fg-muted"], "lt2": c["bg-subtle"],
        "accent1": c["viz-1"], "accent2": c["viz-2"], "accent3": c["viz-3"], "accent4": c["viz-4"],
        "accent5": c["viz-5"], "accent6": c["viz-6"], "hlink": c["accent"], "folHlink": c["accent-strong"],
    }
    for name, value in slots.items():
        el = scheme.find(f"a:{name}", NS)
        for child in list(el):
            el.remove(child)
        etree.SubElement(el, A + "srgbClr", val=hexv(value))
    fonts = root.find(".//a:fontScheme", NS)
    fonts.set("name", f"bausk-style {look['id']}")
    fonts.find("a:majorFont/a:latin", NS).set("typeface", office["major"])
    fonts.find("a:minorFont/a:latin", NS).set("typeface", office["minor"])
    # No shadows or gradients in the theme's effect and fill styles.
    for eff in root.findall(".//a:effectStyle", NS):
        for child in list(eff):
            eff.remove(child)
        etree.SubElement(eff, A + "effectLst")
    part._blob = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


# ---- helpers -------------------------------------------------------------
def rect(shapes, x, y, w, h, color: str, name: str):
    """Plain filled rectangle, written as XML (python-pptx cannot add shapes to masters or layouts)."""
    tree = shapes._spTree
    ids = [int(e.get("id")) for e in tree.iter(f"{P}cNvPr")]
    sp = etree.SubElement(tree, P + "sp")
    nv = etree.SubElement(sp, P + "nvSpPr")
    etree.SubElement(nv, P + "cNvPr", id=str(max(ids + [1]) + 1), name=name)
    etree.SubElement(etree.SubElement(nv, P + "cNvSpPr"), A + "spLocks", noGrp="1")
    etree.SubElement(nv, P + "nvPr")
    spPr = etree.SubElement(sp, P + "spPr")
    xfrm = etree.SubElement(spPr, A + "xfrm")
    etree.SubElement(xfrm, A + "off", x=str(px(x)), y=str(px(y)))
    etree.SubElement(xfrm, A + "ext", cx=str(px(w)), cy=str(px(h)))
    etree.SubElement(etree.SubElement(spPr, A + "prstGeom", prst="rect"), A + "avLst")
    etree.SubElement(etree.SubElement(spPr, A + "solidFill"), A + "srgbClr", val=hexv(color))
    etree.SubElement(etree.SubElement(spPr, A + "ln"), A + "noFill")
    return sp


def place(ph, x, y, w, h):
    ph.left, ph.top, ph.width, ph.height = px(x), px(y), px(w), px(h)


def text_props(ph, *, size=None, color=None, font=None, bold=None, caps=False, anchor=None, align=None, bullet=True):
    """Default run properties for every level of a placeholder (its lstStyle)."""
    txBody = ph._element.find(f"{P}txBody")
    bodyPr = txBody.find(f"{A}bodyPr")
    bodyPr.set("lIns", "0"); bodyPr.set("rIns", "0"); bodyPr.set("tIns", "0"); bodyPr.set("bIns", "0")
    if anchor:
        bodyPr.set("anchor", anchor)
    lst = txBody.find(f"{A}lstStyle")
    if lst is None:
        lst = etree.SubElement(txBody, A + "lstStyle")
        txBody.remove(lst); txBody.insert(1, lst)
    for child in list(lst):
        lst.remove(child)
    pPr = etree.SubElement(lst, A + "lvl1pPr")
    if align:
        pPr.set("algn", align)
    if not bullet:
        pPr.set("marL", "0"); pPr.set("indent", "0")
        etree.SubElement(pPr, A + "buNone")
    rPr = etree.SubElement(pPr, A + "defRPr")
    if size:
        rPr.set("sz", str(int(size * 100)))
    if bold is not None:
        rPr.set("b", "1" if bold else "0")
    if caps:
        rPr.set("cap", "all")
    if color:
        fill = etree.SubElement(rPr, A + "solidFill")
        etree.SubElement(fill, A + "srgbClr", val=hexv(color))
    if font:
        etree.SubElement(rPr, A + "latin", typeface=font)


def by_type(container, t):
    return [ph for ph in container.placeholders if ph.placeholder_format.type == t]


def remove_layout(prs, layout):
    lst = prs.slide_master._element.find(f"{P}sldLayoutIdLst")
    for sid in list(lst):
        if prs.slide_master.part.related_part(sid.get("{%s}id" % NS["r"])) is layout.part:
            prs.slide_master.part.drop_rel(sid.get("{%s}id" % NS["r"]))
            lst.remove(sid)


def background(container, color: str):
    cSld = container._element.find(f"{P}cSld")
    old = cSld.find(f"{P}bg")
    if old is not None:
        cSld.remove(old)
    bg = etree.Element(P + "bg")
    bgPr = etree.SubElement(bg, P + "bgPr")
    fill = etree.SubElement(bgPr, A + "solidFill")
    etree.SubElement(fill, A + "srgbClr", val=hexv(color))
    etree.SubElement(bgPr, A + "effectLst")
    cSld.insert(0, bg)


# ---- master and layouts --------------------------------------------------
def build(look) -> Presentation:
    c, s, office = look["color"]["light"], look["media"]["slide"], look["desktop"]["office"]
    L = s["margin"] + 60          # content left edge (after the red bar)
    R = 1920 - s["margin"]        # content right edge
    W = R - L
    RULE_Y, FOOT_Y = 980, 994

    prs = Presentation()
    prs.slide_width, prs.slide_height = px(1920), px(1080)
    set_theme(prs, look)
    master = prs.slide_master
    background(master, c["bg"])

    # Master text styles: caps display titles, Arsenal body, red square bullets.
    tx = master._element.find(f"{P}txStyles")
    title = tx.find(f"{P}titleStyle/{A}lvl1pPr")
    title.set("algn", "l")
    title_r = title.find(f"{A}defRPr")
    title_r.set("sz", str(int(s["title"] * 0.72 / 2 * 100))); title_r.set("cap", "all"); title_r.set("b", "0")
    title_r.set("spc", "-100")
    lnSpc = etree.Element(A + "lnSpc"); etree.SubElement(lnSpc, A + "spcPct", val="92000"); title.insert(0, lnSpc)
    for i, size in enumerate([s["body"] / 2, s["body"] / 2 * 0.9, s["small"] / 2], start=1):
        lvl = tx.find(f"{P}bodyStyle/{A}lvl{i}pPr")
        if lvl is None:
            continue
        lvl.set("marL", str(px(30 + 40 * (i - 1)))); lvl.set("indent", str(-px(30)))
        for tag in ("buFont", "buChar", "buClr", "buSzPct", "spcBef"):
            for el in lvl.findall(f"{A}{tag}"):
                lvl.remove(el)
        r = lvl.find(f"{A}defRPr")
        r.set("sz", str(int(size * 100)))
        insert_at = list(lvl).index(r)
        spc = etree.Element(A + "spcBef"); etree.SubElement(spc, A + "spcPts", val="900")
        buClr = etree.Element(A + "buClr"); etree.SubElement(buClr, A + "srgbClr", val=hexv(c["accent"]))
        buSz = etree.Element(A + "buSzPct", val="70000")
        buFont = etree.Element(A + "buFont", typeface="Arial")
        buChar = etree.Element(A + "buChar", char="■")
        for k, el in enumerate([spc, buClr, buSz, buFont, buChar]):
            lvl.insert(insert_at + k, el)

    # Master shapes: red bar, footer rule, slide number (a field, so it counts on every slide).
    for ph in by_type(master, PP_PLACEHOLDER.DATE):
        ph._element.getparent().remove(ph._element)
    for ph in by_type(master, PP_PLACEHOLDER.TITLE):
        place(ph, L, s["margin"], W, 230); text_props(ph, anchor="t", caps=True, color=c["fg"], font="+mj-lt")
    for ph in by_type(master, PP_PLACEHOLDER.BODY):
        place(ph, L, 360, W, 560)
    for ph in by_type(master, PP_PLACEHOLDER.FOOTER):
        place(ph, L, FOOT_Y, W - 200, 40); text_props(ph, size=s["foot"] / 2, color=c["fg"], font=office["uiBold"], bold=True, caps=True, anchor="t", align="l")
    for ph in by_type(master, PP_PLACEHOLDER.SLIDE_NUMBER):
        place(ph, R - 200, FOOT_Y, 200, 40); text_props(ph, size=s["foot"] / 2, color=c["fg"], font=office["uiBold"], bold=True, anchor="t", align="r")
    bar = rect(master.shapes, 0, 0, 40, 1080, c["accent"], "bausk red bar")
    rule = rect(master.shapes, L, RULE_Y, W, 6, c["fg"], "bausk footer rule")
    tree = master.shapes._spTree
    for shp in (bar, rule):  # behind the placeholders
        tree.remove(shp); tree.insert(2, shp)
    hf = master._element.find(f"{P}hf")
    if hf is None:
        hf = etree.SubElement(master._element, P + "hf")
    hf.set("dt", "0"); hf.set("hdr", "0")

    layouts = list(prs.slide_layouts)
    names = ["Title Slide", "Title and Content", "Section Header", "Two Content", "Comparison", "Title Only", "Blank", "Content with Caption", "Picture with Caption"]
    by_name = dict(zip(names, layouts))
    for n in ("Comparison", "Content with Caption"):
        remove_layout(prs, by_name.pop(n))

    def fit(layout, *, body=None):
        for ph in layout.placeholders:
            t = ph.placeholder_format.type
            if t == PP_PLACEHOLDER.DATE:
                ph._element.getparent().remove(ph._element)
            elif t == PP_PLACEHOLDER.FOOTER:
                place(ph, L, FOOT_Y, W - 200, 40)
            elif t == PP_PLACEHOLDER.SLIDE_NUMBER:
                place(ph, R - 200, FOOT_Y, 200, 40)
            elif t in (PP_PLACEHOLDER.TITLE, PP_PLACEHOLDER.CENTER_TITLE):
                place(ph, L, s["margin"], W, 230)
            elif t in (PP_PLACEHOLDER.BODY, PP_PLACEHOLDER.OBJECT):
                lst = ph._element.find(f"{P}txBody/{A}lstStyle")  # drop the default template's size overrides
                if lst is not None:
                    for child in list(lst):
                        lst.remove(child)
        return layout

    # Title slide
    ly = fit(by_name["Title Slide"]); ly.name = "Title"
    for ph in ly.placeholders:
        t = ph.placeholder_format.type
        if t == PP_PLACEHOLDER.CENTER_TITLE:
            place(ph, L, s["margin"], W * 0.9, 330); text_props(ph, size=s["title"] / 2, caps=True, anchor="t", align="l", font="+mj-lt", color=c["fg"])
        elif t == PP_PLACEHOLDER.SUBTITLE:
            place(ph, L, 470, W * 0.7, 160); text_props(ph, size=s["lead"] / 2, color=c["fg-muted"], anchor="t", align="l", font="+mn-lt", bullet=False)

    # Content
    ly = fit(by_name["Title and Content"]); ly.name = "Title and Content"
    for ph in by_type(ly, PP_PLACEHOLDER.OBJECT) + by_type(ly, PP_PLACEHOLDER.BODY):
        place(ph, L, 360, W, 560)

    # Section: all red, black bar, paper text
    ly = fit(by_name["Section Header"]); ly.name = "Section"
    background(ly, c["accent"])
    ly._element.set("showMasterSp", "0")
    rect(ly.shapes, 0, 0, 40, 1080, c["fg"], "bausk black bar")
    rect(ly.shapes, L, RULE_Y, W, 6, c["on-accent"], "bausk footer rule")
    for ph in ly.placeholders:
        t = ph.placeholder_format.type
        if t == PP_PLACEHOLDER.TITLE:
            place(ph, L, s["margin"], W * 0.9, 330); text_props(ph, size=s["title"] / 2, caps=True, color=c["on-accent"], anchor="t", align="l", font="+mj-lt")
        elif t == PP_PLACEHOLDER.BODY:
            place(ph, L, 470, W * 0.7, 160); text_props(ph, size=s["lead"] / 2, color=c["on-accent"], anchor="t", align="l", font="+mn-lt", bullet=False)
        elif t in (PP_PLACEHOLDER.FOOTER, PP_PLACEHOLDER.SLIDE_NUMBER):
            text_props(ph, size=s["foot"] / 2, color=c["on-accent"], font=office["uiBold"], bold=True, caps=True, anchor="t",
                       align="r" if t == PP_PLACEHOLDER.SLIDE_NUMBER else "l")

    # Two content
    ly = fit(by_name["Two Content"]); ly.name = "Two Content"
    bodies = by_type(ly, PP_PLACEHOLDER.OBJECT) + by_type(ly, PP_PLACEHOLDER.BODY)
    gap = 72
    for i, ph in enumerate(bodies[:2]):
        place(ph, L + i * (W + gap) / 2, 360, (W - gap) / 2, 560)

    fit(by_name["Title Only"]).name = "Title Only"
    by_name["Blank"].name = "Blank"
    fit(by_name["Blank"])

    ly = fit(by_name["Picture with Caption"]); ly.name = "Figure"
    for ph in ly.placeholders:
        t = ph.placeholder_format.type
        if t == PP_PLACEHOLDER.TITLE:
            place(ph, L, s["margin"], W, 120); text_props(ph, size=s["title"] * 0.5 / 2, caps=True, anchor="t", font="+mj-lt", color=c["fg"])
        elif t == PP_PLACEHOLDER.PICTURE:
            place(ph, L, 250, W, 600)
        elif t == PP_PLACEHOLDER.BODY:
            place(ph, L, 870, W, 80); text_props(ph, size=s["small"] / 2, color=c["fg-subtle"], font=office["ui"], anchor="t", bullet=False)
    return prs


# ---- sample deck -----------------------------------------------------------
def add_footer(slide, text: str):
    """python-pptx does not copy footer placeholders onto slides; do what PowerPoint's Header & Footer does."""
    for ph in slide.slide_layout.placeholders:
        t = ph.placeholder_format.type
        if t not in (PP_PLACEHOLDER.FOOTER, PP_PLACEHOLDER.SLIDE_NUMBER):
            continue
        el = copy.deepcopy(ph._element)
        slide.shapes._spTree.append(el)
        new = slide.placeholders[ph.placeholder_format.idx]
        txBody = new._element.find(f"{P}txBody")
        for p_ in txBody.findall(f"{A}p"):
            txBody.remove(p_)
        p_ = etree.SubElement(txBody, A + "p")
        if t == PP_PLACEHOLDER.FOOTER:
            r = etree.SubElement(p_, A + "r"); etree.SubElement(r, A + "rPr", lang="uk-UA"); etree.SubElement(r, A + "t").text = text
        else:
            fld = etree.SubElement(p_, A + "fld", id="{B6F15528-21DE-4FAA-801E-634DDDAF4B2B}", type="slidenum")
            etree.SubElement(fld, A + "rPr", lang="uk-UA"); etree.SubElement(fld, A + "t").text = "‹#›"


def sample(prs, look):
    lay = {l.name: l for l in prs.slide_layouts}
    foot = "Програмування ШІ для ігор · Лекція 3"

    s = prs.slides.add_slide(lay["Title"])
    s.shapes.title.text = "Пошук шляху: алгоритм A*"
    s.placeholders[1].text = "Евристики, допустимість і чому A* знаходить найкоротший шлях"
    box = s.shapes.add_textbox(px(156), px(820), px(1100), px(120))
    tf = box.text_frame
    tf.text = "Олександр Бауск"
    tf.paragraphs[0].runs[0].font.bold = True
    p2 = tf.add_paragraph(); p2.text = "Кафедра програмного забезпечення, Львівська політехніка"
    for p_ in tf.paragraphs:
        for r in p_.runs:
            r.font.size = Pt(14); r.font.name = look["desktop"]["office"]["ui"]
    add_footer(s, foot)

    s = prs.slides.add_slide(lay["Title and Content"])
    s.shapes.title.text = "Задача: знайти найкоротший шлях на сітці"
    body = s.placeholders[1].text_frame
    body.text = "Сітка 24 × 14 клітинок, частина з них — стіни"
    for line in ["Рух лише по горизонталі та вертикалі, вартість кроку 1", "Потрібен шлях від старту до цілі мінімальної довжини"]:
        body.add_paragraph().text = line
    add_footer(s, foot)

    s = prs.slides.add_slide(lay["Section"])
    s.shapes.title.text = "Частина 2. Евристики"
    s.placeholders[1].text = "Манхеттенська, евклідова, октильна"
    add_footer(s, foot)

    s = prs.slides.add_slide(lay["Two Content"])
    s.shapes.title.text = "Як A* обирає наступну клітинку"
    left = s.placeholders[1].text_frame
    left.text = "f(n) = g(n) + h(n)"
    for line in ["g — вартість шляху від старту", "h — оцінка відстані до цілі", "Допустима h ніколи не переоцінює"]:
        left.add_paragraph().text = line
    right = s.placeholders[2].text_frame
    right.text = "def h(p, goal):\n    return abs(p.x - goal.x) + abs(p.y - goal.y)"
    for p_ in right.paragraphs:
        for r in p_.runs:
            r.font.name = look["desktop"]["office"]["mono"]; r.font.size = Pt(14)
        pPr = p_._p.get_or_add_pPr(); pPr.set("marL", "0"); pPr.set("indent", "0")
        etree.SubElement(pPr, A + "buNone")
    add_footer(s, foot)


def save_potx(pptx_path: Path, potx_path: Path) -> None:
    """A .potx is a .pptx whose main part has the template content type."""
    with zipfile.ZipFile(pptx_path) as zin, zipfile.ZipFile(potx_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "[Content_Types].xml":
                data = data.replace(b"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
                                    b"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml")
            zout.writestr(item, data)


def main():
    look_id, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    look = load(look_id)
    prs = build(look)
    tmp = out / f"bausk-{look_id}.pptx"
    prs.core_properties.title = f"bausk-style {look_id} template"
    prs.core_properties.author = "Oleksandr Bausk"
    prs.save(tmp)
    save_potx(tmp, out / f"bausk-{look_id}.potx")
    tmp.unlink()
    deck = build(look)
    sample(deck, look)
    deck.core_properties.author = "Oleksandr Bausk"
    deck.save(out / f"bausk-{look_id}-sample.pptx")
    print(f"wrote {out}/bausk-{look_id}.potx and bausk-{look_id}-sample.pptx")


if __name__ == "__main__":
    main()
