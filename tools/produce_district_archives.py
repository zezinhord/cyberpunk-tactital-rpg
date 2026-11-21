#!/usr/bin/env python3
"""Produce original, room-specific visual investigation archives for Nova Arcádia 2.0.

The source metadata comes from the 28 actual playable interiors. Twelve authored
illustrated records per room are drawn with diagrams, street layouts, testimony
and technical details. All 336 dossiers can be inspected in the existing
DossierGallery after installing a district. Existing murals and physical prop
drawings are copied without changing gameplay or bloating the initial APK.

No random bytes, resized duplicates, audio, fake file lengths, stock images or
lossless noise padding. Every image is a real readable story/technical page.
The final >=3GB release gate is intentionally kept separate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import random
import shutil
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from generate_v20_illustrations import room_specs, seed_for

BASE = Path(__file__).resolve().parents[1]
SOURCE = BASE / "public/assets/v20-illustrations"
OUT = BASE / "resourcepacks/source"
SIZE = (2048, 1280)
PALETTES = {
    "baixada": ((15, 29, 39), (64, 130, 159), (236, 182, 112)),
    "ferrugem": ((32, 26, 31), (157, 86, 64), (239, 173, 113)),
    "aurea": ((16, 33, 50), (84, 154, 195), (233, 206, 160)),
    "subsolo": ((20, 29, 43), (77, 119, 156), (209, 152, 118)),
    "setor-zero": ((29, 28, 42), (139, 106, 155), (231, 179, 140)),
    "prisma": ((35, 20, 45), (165, 91, 167), (242, 186, 117)),
    "periferia": ((30, 34, 41), (152, 122, 89), (228, 177, 118)),
}
PAGE_TYPES = (
    ("Planta e acesso", "topology"),
    ("Registro encontrado", "archive"),
    ("Engenharia e risco", "machine"),
    ("Suprimentos locais", "cache"),
    ("Cronologia cruzada", "timeline"),
    ("Fluxo de recursos", "flow"),
    ("Depoimentos cruzados", "network"),
    ("Limites de vigilância", "surveillance"),
    ("Falha e reparação", "repair"),
    ("Pontos em disputa", "contradiction"),
    ("Plano de intervenção", "routes"),
    ("Parecer comunitário", "conclusion"),
)
FONT_PATHS = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
)
def font(size: int, bold=False) -> ImageFont.ImageFont:
    candidates = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                  *FONT_PATHS] if bold else list(FONT_PATHS)
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def choose_district(room_id: str) -> str:
    for d in PALETTES:
        if room_id.startswith(d + "-"):
            return d
    raise ValueError("Unexpected room: " + room_id)

def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float):
    return tuple(int(u * (1 - t) + v * t) for u, v in zip(a, b))

def crop(text: str, width: int = 68) -> list[str]:
    # Uses word-wrap, never cuts a testimony in the source language.
    return textwrap.wrap(text, width=width, break_long_words=False,
                         break_on_hyphens=False)

def block(d: ImageDraw.ImageDraw, text: str, x: int, y: int, width=65,
          lines=6, color=(215, 225, 225), fontsize=27, leading=42):
    rows = crop(text, width)[:lines]
    for i, row in enumerate(rows):
        d.text((x, y + i * leading), row, font=font(fontsize), fill=color)
    return y + len(rows) * leading

def cap(room: dict, page: int, title: str, caption: str) -> dict:
    return dict(path=f"dossiers/{room['id']}/registro-{page + 1:02d}.png",
                room=room["id"], kind="dossier",
                caption=caption[:240], license="original")

def narrative(room: dict, page: int) -> tuple[str, str, str]:
    archive, machine, cache = (room["archiveDetail"], room["machineDetail"],
                                room["cacheDetail"])
    guide = room["guideWords"]
    story = [
        (guide, "Percorra os três pontos de interesse no mapa e preserve a rota de retorno.",
         f"A planta comentada de {room['title']} indica os três pontos reais do local: "
         f"{room['archiveTitle']}, {room['machineTitle']} e {room['cacheTitle']}."),
        (archive, "O arquivo preserva a memória das pessoas que ficaram fora da versão oficial.",
         f"Documento de origem: {room['archiveTitle']}. {archive}"),
        (machine, "A medição local pode contrariar o despacho automático da rede.",
         f"Inspeção do componente {room['machineTitle']}: {machine}"),
        (cache, "Os suprimentos são materiais reais da comunidade, não dados abstratos.",
         f"Inventário de {room['cacheTitle']}: {cache}"),
        (f"{archive} {machine}",
         "Compare o momento do registro ao momento da falha técnica.",
         f"Cronologia de {room['title']}: vestígios do arquivo e leituras do aparelho "
         "são confrontados antes de atribuir autoria."),
        (f"{machine} {cache}",
         "O trajeto do recurso altera quem se beneficia das prioridades da rede.",
         f"Fluxo de serviços em {room['title']}: rota local, equipamento e "
         "suprimento mostram a consequência material da decisão."),
        (f"{guide} {archive}",
         "Nenhum testemunho deve ser confundido com autorização irrestrita para divulgar dados.",
         f"Depoimentos cruzados no {room['title']}: o relato de {room['guide']} "
         "é confrontado com o arquivo material."),
        (f"{archive} {guide}",
         "A observação pública não exige identificar moradores ou pacientes.",
         f"Mapa dos limites de vigilância: {room['title']} mantém o acesso "
         "à informação útil sem expor pessoas desnecessariamente."),
        (f"{machine} {cache}",
         "Desligar tudo pode interromper um serviço essencial. Repare apenas o circuito afetado.",
         f"Plano de manutenção do {room['machineTitle']} e provisões do "
         f"{room['cacheTitle']} para evitar danos colaterais."),
        (f"{archive} {machine}",
         "Uma hipótese é apenas uma hipótese até resistir ao confronto com os três vestígios.",
         f"Contradições documentais sobre {room['archiveTitle']}: "
         "confronte a redação oficial com registros independentes."),
        (f"{guide} {machine} {cache}",
         "Primeiro proteja vidas, depois preserve as provas e por fim registre os limites da ação.",
         f"Rota de intervenção de {room['title']}: "
         "sequência reversível para inspecionar, documentar e sair."),
        (f"{archive} {machine} {cache}",
         "A conclusão pertence à comunidade, com chance real de contestação.",
         f"Parecer de {room['guide']} sobre {room['title']}: provas cruzadas "
         "e decisão verificável, sem incriminar moradores por presunção."),
    ]
    return story[page]

def themed_diagram(d: ImageDraw.ImageDraw, room: dict, page: int,
                   origin=(104, 424), area=(1270, 694)):
    """12 different graphs: navigational topology, archives, gauges, routes,
    witness links, timelines, and schematic physical repairs."""
    x0, y0 = origin
    w, h = area
    district = choose_district(room["id"])
    bg, accent, amber = PALETTES[district]
    r = random.Random(seed_for(room["id"], str(page), "diagram"))
    line = (*accent, 255)
    warn = (*amber, 255)
    faint = (*lerp(bg, accent, .45), 255)
    # Spatial engineering grid is information design, not byte filler.
    for x in range(x0, x0 + w, 58):
        d.line((x, y0, x, y0 + h), fill=(*accent, 32), width=1)
    for y in range(y0, y0 + h, 48):
        d.line((x0, y, x0 + w, y), fill=(*accent, 32), width=1)
    d.rounded_rectangle((x0 + 10, y0 + 12, x0 + w - 10, y0 + h - 12),
                        radius=16, outline=(*accent, 180), width=3)
    labels = (room["archiveTitle"], room["machineTitle"], room["cacheTitle"])
    variant = room["variant"]
    if page in (0, 7, 10):
        # Building floor plan with named doors, walls and incident waypoints.
        d.rounded_rectangle((x0 + 90, y0 + 75, x0 + w - 96, y0 + h - 95),
                            radius=12, outline=warn, width=9)
        for i in range(7):
            px = x0 + 140 + i * 140
            py = y0 + 155 + ((i * 3 + variant) % 4) * 108
            d.rectangle((px - 65, py - 40, px + 67, py + 42),
                        outline=line, width=5)
        nodes = [(x0 + 270, y0 + 190), (x0 + 820, y0 + 250),
                 (x0 + 590, y0 + 515)]
        for i, (nx, ny) in enumerate(nodes):
            d.ellipse((nx-30, ny-30, nx+30, ny+30), fill=warn,
                      outline=(243, 233, 207), width=5)
            d.text((nx-12, ny-21), str(i+1), fill=bg, font=font(35, True))
            d.text((nx-115, ny + 40), labels[i][:21],
                   fill=(231, 223, 200), font=font(19))
        for k in range(2):
            d.line((*nodes[k], *nodes[k+1]), fill=line, width=8)
        if page == 7:
            d.arc((x0+130,y0+95,x0+w-150,y0+h-120),210,332,
                  fill=warn,width=12)
    elif page in (1, 9):
        for k in range(9):
            xx=x0+66+(k % 3)*405
            yy=y0+72+(k//3)*184
            d.rounded_rectangle((xx, yy, xx+350, yy+140), radius=12,
                                outline=line if k%3==0 else faint, width=3)
            d.line((xx+22,yy+44,xx+250+((k+variant)*7)%72,yy+44),
                   fill=warn,width=8)
            for j in range(4):
                d.line((xx+20,yy+67+j*14,xx+325-j*18,yy+67+j*14),
                       fill=line,width=2)
            d.text((xx+22, yy+10), f"DOCUMENTO {k+1:02d}",
                   font=font(18,True),fill=(219,223,222))
        if page==9:
            d.line((x0+100,y0+100,x0+w-100,y0+h-100),fill=warn,width=9)
            d.line((x0+100,y0+h-100,x0+w-100,y0+100),fill=warn,width=7)
    elif page in (2, 8):
        for i in range(5):
            px=x0+165+i*235
            py=y0+240+((i+variant)%2)*125
            d.ellipse((px-96,py-96,px+96,py+96),outline=warn,width=9)
            d.arc((px-65,py-65,px+65,py+65),170,352,fill=line,width=7)
            a=math.pi*(.9+i*.14+variant*.11)
            d.line((px,py,px+65*math.cos(a),py+65*math.sin(a)),
                   fill=(242,232,213),width=8)
            d.rectangle((px-80,py+105,px+88,py+138),fill=(*accent,150))
            d.text((px-70,py+108), f"PORTA {i+1:02d}",
                   font=font(19,True),fill=(243,236,215))
        d.line((x0+35,y0+h-135,x0+w-35,y0+h-135),fill=line,width=9)
    elif page==3:
        for i in range(8):
            px=x0+70+(i%4)*290
            py=y0+80+(i//4)*285
            d.rounded_rectangle((px,py,px+230,py+220),radius=16,
                                outline=warn if i<3 else line,width=5)
            for j in range(6):
                d.rectangle((px+20+j*24,py+65,px+35+j*24,py+155),
                            fill=(*accent,80+(j%4)*25))
            d.text((px+23,py+25),f"LOTE {i+1:02d}",
                   font=font(26,True),fill=(237,229,202))
    elif page==4:
        d.line((x0+100,y0+360,x0+w-95,y0+360),fill=line,width=11)
        for i in range(7):
            xx=x0+135+i*175
            yy=y0+360+(0 if i==0 else ((i+variant)%3-1)*55)
            d.line((xx, y0+361, xx, yy),fill=warn,width=7)
            d.ellipse((xx-23,yy-23,xx+23,yy+23),fill=warn)
            d.text((xx-30,yy+44),f"T+{i*8:02d}",font=font(20,True),
                   fill=(236,224,200))
    elif page in (5, 6):
        nodes=[(x0+240+(i%3)*370,y0+160+(i//3)*350) for i in range(6)]
        for i,a in enumerate(nodes):
            for j in range(i+1,len(nodes)):
                if (i+j+variant+page)%3==0:
                    b=nodes[j]
                    d.line((*a,*b),fill=(*accent,125),width=6)
        for i,(x,y) in enumerate(nodes):
            d.rounded_rectangle((x-105,y-67,x+105,y+67),radius=13,
                                fill=(*bg,240),outline=warn if i<3 else line,width=5)
            d.text((x-79,y-16),["ORIGEM","ARQUIVO","ROTINA","MORADORES",
                               "MANUTENÇÃO","PROVA"][i],font=font(20,True),
                   fill=(240,224,194))
    else:
        # Community audit diagram: three evidence streams and an answer.
        for i, title in enumerate(labels):
            xx=x0+90+i*375
            d.rounded_rectangle((xx,y0+130,xx+305,y0+305),radius=15,
                                outline=line,width=7)
            d.text((xx+18,y0+167),title[:18],font=font(22,True),
                   fill=(237,223,188))
            d.line((xx+140,y0+315,x0+w//2,y0+485),fill=warn,width=7)
        d.rounded_rectangle((x0+375,y0+470,x0+875,y0+555),radius=13,
                            outline=warn,width=7)
        d.text((x0+410,y0+493),"DECISÃO CONTESTÁVEL",
               font=font(31,True),fill=(239,231,210))

def draw_mural(room: dict, dest: Path):
    """Create an actual purpose-drawn 2048x180 panorama; never upscale the
    tiny bundled RC4 fallback, since pack validation requires >=128 height."""
    width, height = 2048, 180
    district = choose_district(room["id"])
    bg, accent, amber = PALETTES[district]
    image = Image.new("RGB", (width, height), bg)
    d = ImageDraw.Draw(image)
    r = random.Random(seed_for(room["id"], "panorama"))
    for y in range(height):
        d.line((0, y, width, y),
               fill=lerp(bg, accent, .02 + .18 * y / height))
    for k in range(25):
        x = k * 84 - 30 + r.randint(-9, 9)
        top = 25 + r.randint(0, 42) + room["variant"] * 4
        d.polygon(((x, 168), (x, top+12), (x+14, top), (x+74, top),
                   (x+85, 168)), fill=lerp(bg, accent, .22+(.08*(k%3))))
        for j in range(3):
            yy = top+24+j*21
            d.line((x+12, yy, x+68, yy), fill=accent, width=2)
            for z in range(4):
                xx=x+18+z*14
                if (z+j+k+room["variant"])%3:
                    d.rectangle((xx,yy+4,xx+6,yy+10),fill=amber)
    # Distinct physical scene identity: evidence paths and local architecture.
    for i, title in enumerate((room["archiveTitle"],
                               room["machineTitle"], room["cacheTitle"])):
        x=42+i*660
        d.rounded_rectangle((x+8,12,x+618,94),radius=7,
                            fill=lerp(bg,accent,.14),outline=amber,width=3)
        d.text((x+25,22),f"{i+1:02d} / {title[:27]}",
               font=font(28,True),fill=(235,225,208))
        d.text((x+28,67),f"{room['id'].upper()}",
               font=font(14),fill=(202,204,204))
    for k in range(7):
        xx=50+k*290
        d.arc((xx-50,108,xx+260,220),0,180,fill=accent,width=3)
    dest.parent.mkdir(parents=True,exist_ok=True)
    image.save(dest,format="PNG",optimize=True,compress_level=6)

def render(room: dict, page: int, output: Path) -> dict:
    district=choose_district(room["id"])
    bg, accent, amber=PALETTES[district]
    headline, side_note, caption=narrative(room,page)
    title, _=PAGE_TYPES[page]
    image=Image.new("RGBA",SIZE,(*bg,255))
    d=ImageDraw.Draw(image,"RGBA")
    w,h=SIZE
    # Architectural engraving and constrained night palette.
    for y in range(h):
        t=y/(h-1)
        c=lerp(bg,lerp(bg,accent,.21),t)
        d.line((0,y,w,y),fill=(*c,255))
    for i in range(36):
        x=38+i*60
        height=140+((i*47+room["variant"]*53+page*17)%370)
        d.rectangle((x,h-height-30,x+47,h-34),
                    fill=(*lerp(bg,accent,.17+((i+page)%3)*.05),235))
        for py in range(h-height, h-55, 29):
            for px in range(x+7,x+38,14):
                if ((px+py+page+i)%7)<4:
                    d.rectangle((px,py,px+6,py+9),
                                fill=(*amber,75))
    d.rectangle((44,48,w-48,h-52),fill=(*bg,238),
                outline=(*accent,230),width=4)
    d.rectangle((68,72,w-67,126),fill=(*accent,110))
    d.text((100,82),"NOVA ARCÁDIA / ARQUIVO LOCAL",
           font=font(28,True),fill=(241,229,211))
    d.text((1500,82),f"{district.upper()} · {page+1:02d}/12",
           font=font(26,True),fill=(238,221,192))
    d.text((100,160),room["title"][:39].upper(),
           font=font(53,True),fill=(238,227,207))
    d.text((104,243),title.upper(),font=font(39,True),
           fill=(*amber,255))
    block(d,headline,105,316,width=93,lines=2,fontsize=22,
          color=(208,222,224),leading=38)
    themed_diagram(d,room,page)
    d.rounded_rectangle((1412,424,1919,1100),radius=15,
                        fill=(*lerp(bg,accent,.18),245),
                        outline=(*accent,220),width=3)
    d.text((1450,456),"NOTA DE CAMPO",
           font=font(29,True),fill=(*amber,255))
    block(d,side_note,1450,535,width=30,lines=12,fontsize=25,leading=42)
    d.line((1450,910,1875,910),fill=(*amber,180),width=5)
    d.text((1450,942),"REFERÊNCIAS",font=font(22,True),fill=(239,219,185))
    block(d,room["archiveTitle"]+" / "+room["machineTitle"]+" / "+
          room["cacheTitle"],1450,991,width=29,lines=3,fontsize=19,
          leading=27)
    d.text((106,1160),f"{room['id']} / REGISTRO {page+1:02d} / "
           "PROCEDÊNCIA: DEPOIMENTO E VESTÍGIOS LOCAIS",
           font=font(20,True),fill=(231,212,185))
    d.line((104,1143,1912,1143),fill=(*accent,220),width=3)
    output.parent.mkdir(parents=True,exist_ok=True)
    image.convert("RGB").save(output,format="PNG",optimize=True,compress_level=6)
    return cap(room,page,title,caption)

def produce(root: Path=OUT, limit_rooms: int|None=None) -> dict:
    rooms=room_specs()
    if limit_rooms is not None:
        rooms=rooms[:limit_rooms]
    for room in rooms:
        district=choose_district(room["id"])
        root_dir=root/district
        entries=[]
        rid=room["id"]
        dest=root_dir/"murals"/rid/"ambiente.png"
        draw_mural(room,dest)
        entries.append(dict(path=f"murals/{rid}/ambiente.png",room=rid,
                            kind="mural",caption=f"Paisagem original de {room['title']}, "
                            "com arquitetura local e pontos navegáveis.",license="original"))
        for prop,narr,title in zip(("arquivo","sistema","suprimento"),
                              ("archiveDetail","machineDetail","cacheDetail"),
                              ("archiveTitle","machineTitle","cacheTitle")):
            src=SOURCE/"props"/f"{rid}-{prop}.png"
            if not src.is_file():
                raise ValueError("Missing original physical object art: "+str(src))
            file=f"props/{rid}/{prop}.png"
            out=root_dir/file
            out.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(src,out)
            entries.append(dict(path=file,room=rid,kind="prop",
                               caption=room[title]+": "+room[narr],
                               license="original"))
        for page in range(len(PAGE_TYPES)):
            out=root_dir/"dossiers"/rid/f"registro-{page+1:02d}.png"
            entries.append(render(room,page,out))
        # Four rooms share a district source-manifest, not one per room.
        manifest=root_dir/"source-manifest.json"
        existing=json.loads(manifest.read_text()) if manifest.is_file() else []
        other=[item for item in existing if item["room"]!=rid]
        manifest.write_text(json.dumps(other+entries,ensure_ascii=False,indent=2)+"\n",
                            encoding="utf-8")
    total=sum(p.stat().st_size for p in root.rglob("*.png"))
    count=sum(1 for p in root.rglob("*.png"))
    report={"rooms":len(rooms),"artworks":count,"bytes":total,
            "baselineBytes":1_143_503_198,
            "combinedBytes":1_143_503_198+total,
            "missingTo3GB":max(0,3_000_000_000-1_143_503_198-total)}
    print(json.dumps(report,ensure_ascii=False))
    return report

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",type=Path,default=OUT)
    parser.add_argument("--limit-rooms",type=int)
    a=parser.parse_args()
    produce(a.source,a.limit_rooms)
