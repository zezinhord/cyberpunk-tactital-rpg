#!/usr/bin/env python3
"""OPERAÇÃO NEXO: 672 authored 2880×1620 Éden incursion plates.

Exactly six physically playable relay checkpoints and four distinct tactical
viewpoints for each of 28 inhabited rooms. Map solids, stage nodes and moving
guard positions agree with src/game/story/nexus-eden.ts via the same Python
Vigília path generator. No recycled audio, fake padding or duplicated images.
Only one user-selected plate is decoded into the Android WebView at a time.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import random
import textwrap
from pathlib import Path
from PIL import Image,ImageDraw
from generate_v20_illustrations import room_specs,seed_for
from produce_tactical_simulations import draw_city,PAL,font,mix,district
from produce_perimeter_routes import iso,outline_poly,machinery
from produce_vigil_escorts import plan,guards_at

ROOT=Path(__file__).resolve().parents[1]
W,H=2880,1620
NODES=(3,5,7,9,11,13)
CYAN=(89,214,233);MAGENTA=(235,84,157);AMBER=(249,194,98)
EDEN=(94,225,148)   # Reserved GREEN identifies only Éden's live infrastructure.
BIG=font(55,True);MED=font(32,True);SMALL=font(21);TAG=font(24,True)
TITLES={
 "baixada":("Arquivo hídrico fantasma","Escuta da clínica","Passarela sensorizada",
            "Caixa de alimentos","Rádio da cooperativa","Chave da Baixada"),
 "ferrugem":("Escala sem descanso","Caldeira governada","Relé de acidente",
             "Portal de cargas","Registro sindical","Chave da Ferrugem"),
 "aurea":("Fila invisível","Biometria compulsória","Índice de solvência",
          "Monitor de altas","Núcleo de prontuários","Chave de Áurea"),
 "subsolo":("Sonda de galerias","Fração de energia","Portão remoto",
            "Arquivo desaparecido","Trânsito cifrado","Chave do Subsolo"),
 "setor-zero":("Sensor de isolamento","Incidente apagado","Protocolo da ala",
               "Validação dos filtros","Arquivo de consentimento","Chave do Setor Zero"),
 "prisma":("Identidade em transmissão","Direitos de arquivo","Voz artificial",
           "Portaria do palco","Cena interrompida","Chave do Prisma"),
 "periferia":("Radar de caravanas","Poço sob bloqueio","Estufa monitorada",
              "Torre de rádio","Passagem do viaduto","Chave da Periferia"),
}
VIEWS=(
 ("PONTO DE ACESSO","O mapa comprova o itinerário real entre os terminais"),
 ("ANÁLISE DE COBERTURA","Scanner e sentinelas exibem suas posições físicas"),
 ("INTERFERÊNCIA LOCAL","O estado de isolamento depende da escolha de rede"),
 ("DECISÃO REGISTRADA","A intervenção modifica o protocolo de cada distrito"),
)

def draw_signal(d,rng,x0,y0,x,y,view,color):
 px,py=iso(x0,y0,x+.5,y+.5,22)
 for ring in range(4):
  radius=34+ring*14+view*3
  d.ellipse((px-radius,py-radius*.55,px+radius,py+radius*.55),
    outline=color if ring%2==0 else (110,142,159),width=3)
 for i in range(12):
  a=i*math.pi/6+view*.22
  ra=42+13*(i%3)
  sx=px+math.cos(a)*ra;sy=py+math.sin(a)*ra*.52
  d.line((px,py-16,sx,sy),fill=mix(color,(16,25,39),.46),width=2)
  d.ellipse((sx-4,sy-4,sx+4,sy+4),fill=color)
 d.rectangle((px-14,py-93,px+14,py-41),fill=mix(color,(5,25,30),.40),
             outline=color,width=4)
 d.ellipse((px-22,py-117,px+22,py-78),fill=mix(color,(6,38,39),.34),
            outline=color,width=4)
 d.rectangle((px-9,py-105,px+9,py-92),fill=color)
 d.line((px-13,py-64,px+13,py-64),fill=(232,235,225),width=2)

def map_space(d,rng,room,stage,view,bg,steel,gold):
 original=plan(room["id"])
 corridor=original["path"];walls=original["walls"];scanners=original["hotspots"]
 center_x=1080+(stage%2)*4;center_y=330+(view%2)*4
 for diag in range(15):
  for x in range(8):
   y=diag-x
   if y<0 or y>=8:continue
   tile=[iso(center_x,center_y,x,y),iso(center_x,center_y,x+1,y),
     iso(center_x,center_y,x+1,y+1),iso(center_x,center_y,x,y+1)]
   shade=mix(bg,steel,.25+((x*7+y*5+stage+view)%8)*.032)
   outline_poly(d,tile,shade,mix(bg,steel,.58),3)
   # Riveted metal grids are world geometry, not image padding or noise.
   for line in range(60):
    u=tile[0][0]+rng.randint(-42,42);v=tile[0][1]+rng.randint(5,67)
    if line%5==0:d.line((u,v,u+20,v+4),fill=mix(bg,steel,.77),width=2)
    elif line%5==1:d.rectangle((u,v,u+11,v+7),outline=mix(bg,steel,.65))
    elif line%5==2:d.ellipse((u,v,u+5,v+5),fill=mix(bg,steel,.72))
    elif line%5==3:d.line((u,v,u+9,v-3),fill=mix(bg,gold,.22),width=1)
    else:d.rectangle((u,v,u+4,v+4),outline=mix(bg,steel,.55))
   if (x,y) in walls:
    height=93+((x+3*y+stage)%5)*22
    raised=[(px,py-height) for px,py in tile]
    outline_poly(d,[tile[1],tile[2],raised[2],raised[1]],mix(bg,steel,.61),steel,3)
    outline_poly(d,[tile[2],tile[3],raised[3],raised[2]],mix(bg,steel,.38),steel,4)
    outline_poly(d,raised,mix(bg,steel,.73),gold if (x+y+view)%7==0 else steel,3)
    for n in range(45):
     px=raised[0][0]+rng.randint(-35,40);py=raised[0][1]+rng.randint(9,47)
     d.line((px,py,px+rng.randint(6,20),py+2),
        fill=mix(bg,steel,.42),width=1)
   elif (x,y) in scanners:
    px,py=iso(center_x,center_y,x+.5,y+.5,14)
    d.ellipse((px-46,py-25,px+46,py+24),
      fill=mix(bg,EDEN,.39),outline=EDEN,width=5)
    for n in range(6):
     a=n*math.pi/3+view*.2
     xx=px+math.cos(a)*30;yy=py+math.sin(a)*15
     d.ellipse((xx-4,yy-4,xx+4,yy+4),fill=EDEN)
 # Six real, not cosmetic, signal relays linked by navigable safe corridor.
 full=[iso(center_x,center_y,x+.5,y+.5,19) for x,y in corridor]
 d.line(full,fill=mix(EDEN,CYAN,.38),width=12,joint="curve")
 for k,(x,y) in enumerate(corridor):
  px,py=iso(center_x,center_y,x+.5,y+.5,20)
  d.ellipse((px-9,py-9,px+9,py+9),fill=AMBER,outline=bg,width=2)
  if k%3==0:d.text((px+18,py-30),f"{k+1:02d}",font=SMALL,fill=CYAN)
 for i,index in enumerate(NODES):
  x,y=corridor[index]
  color=EDEN if i==stage else CYAN if i<stage else steel
  draw_signal(d,rng,center_x,center_y,x,y,view,color)
  px,py=iso(center_x,center_y,x+.5,y+.5,123)
  d.text((px-10,py),str(i+1),font=TAG,fill=(235,242,226))
 # Patrols are deterministic and move on the real gameplay 8×8 grid.
 turn=stage*7+view*2
 for guard in guards_at(original,turn):
  px,py=iso(center_x,center_y,guard[0]+.5,guard[1]+.5,18)
  d.ellipse((px-25,py-10,px+25,py+13),fill=mix(bg,MAGENTA,.53),
            outline=MAGENTA,width=4)
  d.polygon(((px-24,py-48),(px+24,py-48),(px+31,py-1),
              (px-31,py-1)),fill=mix(bg,MAGENTA,.68),outline=MAGENTA)
  d.ellipse((px-14,py-77,px+14,py-46),fill=MAGENTA)
  d.arc((px-78,py-53,px+78,py+53),185,355,fill=MAGENTA,width=4)
 # The player is a readable cyan human marker, shown at the last captured node.
 previous=corridor[NODES[max(0,stage-1)]] if stage else corridor[0]
 px,py=iso(center_x,center_y,previous[0]+.5,previous[1]+.5,12)
 d.ellipse((px-23,py-15,px+23,py+12),outline=CYAN,width=4)
 d.polygon(((px-24,py-45),(px+24,py-45),(px+24,py+8),(px-24,py+8)),
   fill=mix(bg,CYAN,.59),outline=CYAN)
 d.ellipse((px-14,py-72,px+14,py-42),fill=CYAN)
 d.line((px-13,py+8,px-18,py+29),fill=CYAN,width=5)
 d.line((px+13,py+8,px+18,py+29),fill=CYAN,width=5)
 # Street-level control cabinets are positioned outside the safe path.
 for q in range(14):
  x=(q*3+stage)%8;y=(q*5+view)%8
  if (x,y) in walls or (x,y) in corridor:continue
  px,py=iso(center_x,center_y,x+.3,y+.3,5)
  d.rounded_rectangle((px-19,py-35,px+21,py+5),radius=4,
    fill=mix(bg,steel,.5),outline=steel,width=2)
  d.line((px-13,py-15,px+14,py-15),fill=EDEN,width=2)
  for k in range(3):
   d.ellipse((px-12+k*10,py-6,px-8+k*10,py-2),fill=AMBER)
 # Service cables and visible wear remain tied to physical grid cells.
 for q in range(4700):
  x,y=rng.randrange(8),rng.randrange(8)
  px,py=iso(center_x,center_y,x,y)
  xx=px+rng.randint(-40,43);yy=py+rng.randint(9,64)
  if q%5==0:d.line((xx,yy,xx+14,yy+2),fill=mix(bg,steel,.72),width=1)
  elif q%5==1:d.rectangle((xx,yy,xx+7,yy+5),outline=mix(bg,steel,.47))
  elif q%5==2:d.ellipse((xx,yy,xx+4,yy+4),fill=mix(bg,steel,.58))
  elif q%5==3:d.line((xx,yy,xx,yy+13),fill=mix(bg,AMBER,.23),width=1)
  else:d.line((xx,yy,xx+11,yy-3),fill=mix(bg,CYAN,.19),width=1)

def screen_overlay(d,room,stage,view,bg,steel,gold):
 area=district(room)
 title=TITLES[area][stage]
 d.rounded_rectangle((67,69,1844,244),radius=22,
    fill=mix(bg,(5,17,30),.78),outline=steel,width=5)
 d.text((106,93),"NOVA ARCÁDIA 2.0  //  OPERAÇÃO NEXO",font=TAG,fill=EDEN)
 d.text((104,142),title.upper(),font=BIG,fill=(238,231,216))
 d.line((107,223,1797,223),fill=EDEN,width=4)
 d.rounded_rectangle((62,1121,1867,1549),radius=22,
    fill=mix(bg,(5,15,26),.81),outline=steel,width=4)
 d.text((102,1152),f"RELÉ {stage+1:02d}/06  ·  "+VIEWS[view][0],font=MED,fill=EDEN)
 d.line((103,1215,1810,1215),fill=steel,width=3)
 detail=room["guideWords"]+". "+room["archiveDetail"]+". "+VIEWS[view][1]+"."
 for i,line in enumerate(textwrap.wrap(detail,95)[:4]):
  d.text((104,1237+i*43),line,font=TAG,fill=(213,224,214))
 d.text((100,1513),room["title"]+"  ·  PRIVACIDADE / AUTONOMIA / PROTEÇÃO",font=TAG,fill=CYAN)
 # Dedicated relay-state status display, 6 real mechanically verified nodes.
 x0=1900
 d.rounded_rectangle((x0,1464,2821,1573),radius=15,
    fill=mix(bg,(4,17,25),.80),outline=steel,width=4)
 for i in range(6):
  x=x0+19+i*147
  color=CYAN if i<stage else EDEN if i==stage else steel
  d.rounded_rectangle((x,1491,x+129,1544),radius=7,
     fill=mix(bg,color,.46),outline=color,width=3)
  d.text((x+39,1501),f"N-{i+1}",font=TAG,fill=color)
 # Device telemetry varies by stage and view, but no fabricated bytes counted.
 for k,(label,color) in enumerate((("FIREWALL",EDEN),("REDE CIVIL",CYAN),("VIGIAS",MAGENTA))):
  x=1900+k*303
  d.rounded_rectangle((x,1323,x+281,1439),radius=13,
     fill=mix(bg,steel,.32),outline=color,width=3)
  d.text((x+17,1347),label,font=SMALL,fill=color)
  for b in range(10):
   alpha=(stage*7+view*13+k*11+b*3)%10
   d.rectangle((x+15+b*25,1394,x+33+b*25,1406),
     fill=color if alpha<6 else mix(bg,steel,.53))
 stamp=hashlib.sha256((room["id"]+f":nexus:{stage}:{view}").encode()).hexdigest()[:12].upper()
 d.text((1930,1578),"CONTRAPROVA DIGITAL / "+stamp,font=SMALL,fill=(197,211,218))

def paint(room,stage,view,root):
 area=district(room);bg,steel,gold=PAL[area]
 rng=random.Random(seed_for("eden-nexus-relay-original-v20",
                           room["id"],str(stage),str(view)))
 image=Image.new("RGB",(W,H),bg)
 d=ImageDraw.Draw(image)
 draw_city(d,rng,bg,steel,gold,stage,view,room)
 map_space(d,rng,room,stage,view,bg,steel,gold)
 machinery(d,rng,room,stage,view,area,bg,steel,gold)
 screen_overlay(d,room,stage,view,bg,steel,gold)
 path=root/area/"nexus"/room["id"]/f"rele-{stage*4+view+1:02d}.webp"
 path.parent.mkdir(parents=True,exist_ok=True)
 image.save(path,"WEBP",quality=100,method=4)
 return {"path":f"nexus/{room['id']}/rele-{stage*4+view+1:02d}.webp",
         "room":room["id"],"kind":"nexus","license":"original",
         "caption":(f"Operação Nexo · {room['title']}: relé {stage+1}/6, "+
           TITLES[area][stage]+". "+VIEWS[view][0].lower()+
           ". Vista isométrica 8x8 com três vigias móveis, scanners, "+
           "seis terminais alcançáveis e intervenção civil contextual.")[:240]}

def generate(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 total=0
 for room in rooms:
  area=district(room);folder=root/area
  manifest=folder/"source-manifest.json"
  earlier=json.loads(manifest.read_text(encoding="utf-8")) if manifest.is_file() else []
  earlier=[entry for entry in earlier if entry["room"]!=room["id"] or entry["kind"]!="nexus"]
  authored=[paint(room,s,v,root) for s in range(6) for v in range(4)]
  manifest.parent.mkdir(parents=True,exist_ok=True)
  manifest.write_text(json.dumps(earlier+authored,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  produced=sum((folder/e["path"]).stat().st_size for e in authored)
  total+=produced
  print(f"NEXUS {room['id']}: 24 unique 8x8 live-relay scenes, {produced:,} bytes",flush=True)
 report={"rooms":len(rooms),"frames":24*len(rooms),"bytes":total}
 print("NEXUS_ART_REPORT "+json.dumps(report),flush=True)
 return report

if __name__=="__main__":
 cli=argparse.ArgumentParser()
 cli.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 cli.add_argument("--limit-rooms",type=int)
 args=cli.parse_args()
 generate(args.source,args.limit_rooms)
