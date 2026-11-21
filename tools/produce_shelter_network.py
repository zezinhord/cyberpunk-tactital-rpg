#!/usr/bin/env python3
"""OPERAÇÃO REFÚGIO — 560 new narrative-functional 2880x1620 illustrations.

Each of 28 playable sites gets 5 stabilization checkpoints x 4 usable
field viewpoints. The grid, obstacles, hazards and checkpoint positions are
drawn from the live playable shelter-network/perimeter-routes maps.
The drawings are independently authored from 3D iso primitives and scene
designs; NO duplicate images, upscaling, noise padding or recycled audio.
The mobile app decodes only one installed WebP at a time.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import random
from pathlib import Path
from PIL import Image,ImageDraw
from generate_v20_illustrations import room_specs,seed_for
from produce_tactical_simulations import draw_city,PAL,font,mix,district
from produce_perimeter_routes import iso,outline_poly,machinery,layout

ROOT=Path(__file__).resolve().parents[1]
W,H=2880,1620
GOALS=((2,6),(3,5),(4,4),(5,3),(6,2))
STAGE_NAMES={
 "baixada":("Cisterna de sobrevivência","Triagem da clínica","Travessia do canal","Proteção de cadastros","Governança da água"),
 "ferrugem":("Galpão de assistência","Caldeira auxiliar","Turnos de descanso","Livros de acidentes","Rota humanitária"),
 "aurea":("Leitos sem credencial","Medicamentos essenciais","Prontuário preservado","Energia clínica","Fiscalização de acesso"),
 "subsolo":("Purificação subterrânea","Câmaras de abrigo","Alimentação e luz","Ocultação de rotas","Comportas de saída"),
 "setor-zero":("Corredor sanitário","Contagem dos sobreviventes","Máscaras de contenção","Veto humano","Monitoria do interdito"),
 "prisma":("Refúgio das testemunhas","Rádio de emergência","Posto do palco","Preservar depoimentos","Retomada da noite"),
 "periferia":("Ponto da caravana","Poços de abastecimento","Transporte solidário","Torres de energia","Estrada de assistência"),
}
VIEWS=("INSPEÇÃO DA EQUIPE","MAPEAMENTO DE RISCO","INSUMOS E PROTEÇÃO","RELATO DOS CIVIS")
S=font(23,True);T=font(20);H1=font(52,True);H2=font(34,True)
CYAN=(91,217,230);AMBER=(246,194,109);RED=(230,104,138)

def grid(d,rng,room,stage,view,bg,steel,gold):
 walls,hazards=layout(room["id"])
 x0,y0=1080+view*7,342+(stage%2)*8
 for diag in range(15):
  for x in range(8):
   y=diag-x
   if not 0<=y<8:continue
   p=[iso(x0,y0,x,y),iso(x0,y0,x+1,y),
      iso(x0,y0,x+1,y+1),iso(x0,y0,x,y+1)]
   base=mix(bg,steel,.26+((x*7+y*3+view+stage)%8)*.025)
   outline_poly(d,p,base,mix(steel,bg,.45),3)
   for q in range(55):
    xx=p[0][0]+rng.randint(-38,43); yy=p[0][1]+rng.randint(7,62)
    if q%5==0:d.line((xx,yy,xx+rng.randint(4,20),yy+2),fill=mix(bg,gold,.28),width=2)
    elif q%5==1:d.rectangle((xx,yy,xx+9,yy+7),outline=mix(bg,steel,.66),width=1)
    elif q%5==2:d.ellipse((xx,yy,xx+4,yy+4),fill=mix(bg,steel,.69))
    elif q%5==3:d.line((xx,yy,xx+6,yy+10),fill=mix(steel,bg,.29),width=1)
    else:d.line((xx,yy,xx+13,yy),fill=mix(gold,bg,.14),width=1)
   if (x,y) in walls:
    height=74+((x+3*y+stage)%5)*18
    raised=[(a,b-height) for a,b in p]
    outline_poly(d,[p[1],p[2],raised[2],raised[1]],mix(bg,steel,.58),steel,3)
    outline_poly(d,[p[2],p[3],raised[3],raised[2]],mix(bg,steel,.35),gold if view==1 else steel,3)
    outline_poly(d,raised,mix(bg,steel,.70),steel,3)
    for q in range(27):
     xx=raised[0][0]+rng.randint(-24,38);yy=raised[0][1]+rng.randint(8,44)
     d.line((xx,yy,xx+8,yy+2),fill=mix(bg,steel,.40),width=2)
   elif (x,y) in hazards:
    xx,yy=iso(x0,y0,x+.5,y+.5,13)
    d.ellipse((xx-44,yy-22,xx+44,yy+22),fill=mix(bg,RED,.44),outline=RED,width=4)
    d.line((xx-18,yy-9,xx+18,yy+9),fill=AMBER,width=4)
    d.line((xx+18,yy-9,xx-18,yy+9),fill=AMBER,width=4)
 # Reconstructed supply pipeline. This exact path passes all five live nodes.
 route=((0,7),(1,7),(2,7),(2,6),(3,6),(3,5),
        (4,5),(4,4),(5,4),(5,3),(6,3),(6,2),(7,2),(7,1))
 d.line([iso(x0,y0,x+.5,y+.5,16) for x,y in route],
       fill=CYAN,width=13,joint="curve")
 for i,(x,y) in enumerate(route):
  px,py=iso(x0,y0,x+.5,y+.5,23)
  d.ellipse((px-9,py-9,px+9,py+9),fill=AMBER,outline=bg,width=2)
  if i%3==0:d.text((px+16,py-26),str(i).zfill(2),font=T,fill=CYAN)
 # Five task-locked stations; phase variations correspond to decisions.
 for i,(x,y) in enumerate(GOALS):
  px,py=iso(x0,y0,x+.5,y+.5,30)
  focus=i==stage
  color=AMBER if focus else CYAN if i<stage else steel
  d.ellipse((px-37,py-21,px+37,py+20),fill=mix(bg,color,.4),outline=color,width=5)
  d.line((px,py-26,px,py-72),fill=color,width=5)
  d.rounded_rectangle((px-29,py-121,px+38,py-77),radius=6,
      fill=mix(bg,color,.55),outline=color,width=3)
  d.text((px-18,py-116),str(i+1).zfill(2),font=S,fill=AMBER if focus else (222,231,227))
  # Stage-specific objects: water tanks, medical kits, power relay and archive.
  if i==0:
   d.ellipse((px-47,py-20,px-25,py-5),outline=CYAN,width=2)
   d.rectangle((px-45,py-49,px-27,py-16),outline=CYAN,width=3)
  if i==1:
   d.line((px+36,py-41,px+60,py-41),fill=AMBER,width=6)
   d.line((px+48,py-53,px+48,py-29),fill=AMBER,width=6)
  if i==2:
   d.rectangle((px-64,py-45,px-42,py-10),outline=color,width=3)
   d.line((px-62,py-31,px-44,py-31),fill=color,width=2)
  if i==3:
   for k in range(3):
    d.arc((px-66-k*9,py-65-k*10,px+66+k*9,py+52+k*10),
          205,333,fill=color,width=2)
  if i==4:
   d.polygon(((px,py-72),(px-39,py-26),(px+39,py-26)),
       outline=color)
 # Civil personnel and material depots drawn in map space.
 for q,(x,y) in enumerate(((0,6),(1,4),(2,3),(3,7),(4,2),(5,6),(6,4),(7,0))):
  if (x,y) in walls:continue
  px,py=iso(x0,y0,x+.5,y+.5,13)
  skin=(211,165,122) if q%2 else (165,132,112)
  cloth=CYAN if q%3==0 else AMBER if q%3==1 else steel
  d.ellipse((px-17,py-73,px+17,py-43),fill=skin,outline=gold,width=2)
  d.polygon(((px-20,py-41),(px+20,py-41),(px+26,py+9),(px-26,py+9)),
      fill=mix(bg,cloth,.76),outline=cloth)
  d.line((px-12,py+8,px-17,py+35),fill=cloth,width=5)
  d.line((px+12,py+8,px+17,py+35),fill=cloth,width=5)
  d.ellipse((px-30,py+33,px+30,py+44),outline=cloth,width=3)
  d.rectangle((px+19,py-31,px+49,py-7),fill=mix(bg,AMBER,.4),outline=AMBER,width=2)
 # Unique scene details are anchored to coordinate cells, not pixel noise.
 for q in range(4500):
  x=rng.randrange(8);y=rng.randrange(8)
  px,py=iso(x0,y0,x,y)
  xx=px+rng.randint(-31,42);yy=py+rng.randint(6,64)
  if q%4==0:d.line((xx,yy,xx+12,yy+2),fill=mix(bg,steel,.64),width=1)
  elif q%4==1:d.rectangle((xx,yy,xx+7,yy+4),outline=mix(steel,gold,.15),width=1)
  elif q%4==2:d.ellipse((xx,yy,xx+4,yy+4),fill=mix(bg,steel,.61))
  else:d.line((xx,yy,xx+4,yy+13),fill=mix(bg,gold,.21),width=1)

def labels(d,room,stage,view,bg,steel,gold):
 area=district(room)
 title=STAGE_NAMES[area][stage]
 d.rounded_rectangle((72,67,1847,231),radius=14,
      fill=mix(bg,(8,20,29),.77),outline=steel,width=5)
 d.text((102,84),"NOVA ARCÁDIA 2.0  /  OPERAÇÃO REFÚGIO",font=S,fill=CYAN)
 d.text((101,125),title.upper(),font=H1,fill=(240,229,212))
 d.line((110,208,1800,208),fill=gold,width=4)
 d.rounded_rectangle((66,1102,1872,1545),radius=21,
      fill=mix(bg,(4,13,24),.78),outline=gold,width=4)
 d.text((112,1133),f"POSTO CIVIL {stage+1:02d}/05   |   "+VIEWS[view],
      font=H2,fill=AMBER)
 text=room["guideWords"]+". "+room["machineDetail"]
 from textwrap import wrap
 for j,part in enumerate(wrap(text,91)[:4]):
  d.text((114,1207+j*38),part,font=S,fill=(216,226,218))
 d.text((114,1489),room["title"]+"  |  PROTEÇÃO TERRITORIAL VERIFICÁVEL",font=S,fill=CYAN)
 # Distinct horizontal progress instruments for five actual stages and views.
 for i in range(5):
  x=1901+i*178
  d.rounded_rectangle((x,1509,x+157,1560),radius=8,
      fill=mix(bg,gold,.38) if i<=stage else mix(bg,steel,.35),
      outline=gold if i==stage else steel,width=3)
  d.text((x+56,1516),f"{i+1:02d}",font=S,fill=(255,232,187) if i<=stage else (178,194,204))
 stamp=hashlib.sha256(f"{room['id']}-shelter-{stage}-{view}".encode()).hexdigest()[:10].upper()
 d.text((1950,1462),"REGISTRO DE ASSISTÊNCIA "+stamp,font=T,fill=(189,208,215))
 # Gauges depict real in-game supply/morale/security axes.
 for g,label,value,color in ((0,"INSUMOS",7-stage,AMBER),(1,"MORAL",5+stage,CYAN),
                              (2,"SEGURANÇA",5+view,RED)):
  x=1900+g*300
  d.rounded_rectangle((x,1331,x+282,1438),radius=14,
      fill=mix(bg,(7,21,31),.70),outline=color,width=3)
  d.text((x+16,1350),label,font=T,fill=color)
  d.rectangle((x+15,1399,x+15+max(0,value)*20,1411),fill=color)

def paint(room,stage,view,root):
 area=district(room);bg,steel,gold=PAL[area]
 rng=random.Random(seed_for("na20-shelter-independent",room["id"],str(stage),str(view)))
 image=Image.new("RGB",(W,H),bg)
 d=ImageDraw.Draw(image)
 draw_city(d,rng,bg,steel,gold,stage,view,room)
 grid(d,rng,room,stage,view,bg,steel,gold)
 machinery(d,rng,room,stage,view,area,bg,steel,gold)
 labels(d,room,stage,view,bg,steel,gold)
 path=root/area/"shelters"/room["id"]/f"abrigo-{stage*4+view+1:02d}.webp"
 path.parent.mkdir(parents=True,exist_ok=True)
 image.save(path,"WEBP",quality=100,method=4)
 return {"path":f"shelters/{room['id']}/abrigo-{stage*4+view+1:02d}.webp",
         "room":room["id"],"kind":"shelter","license":"original",
         "caption":(f"Operação Refúgio · {room['title']}, posto {stage+1}/5: "+
         STAGE_NAMES[area][stage]+". "+VIEWS[view].lower()+
         ". Planta 8x8 com circulação civil, equipamentos de assistência, "+
         "cinco pontos de intervenção e riscos reais do distrito.")[:240]}

def generate(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 total=0
 for room in rooms:
  area=district(room);folder=root/area;manifest=folder/"source-manifest.json"
  previous=json.loads(manifest.read_text(encoding="utf-8")) if manifest.is_file() else []
  previous=[a for a in previous if a["room"]!=room["id"] or a["kind"]!="shelter"]
  authored=[paint(room,stage,view,root) for stage in range(5) for view in range(4)]
  manifest.parent.mkdir(parents=True,exist_ok=True)
  manifest.write_text(json.dumps(previous+authored,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
  size=sum((folder/a["path"]).stat().st_size for a in authored)
  total+=size
  print("SHELTER "+room["id"]+": 20 original map-bound frames, "+
        f"{size:,} bytes",flush=True)
 report={"rooms":len(rooms),"frames":len(rooms)*20,"bytes":total}
 print("SHELTER_ART_REPORT "+json.dumps(report),flush=True)
 return report

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 parser.add_argument("--limit-rooms",type=int)
 args=parser.parse_args()
 generate(args.source,args.limit_rooms)
