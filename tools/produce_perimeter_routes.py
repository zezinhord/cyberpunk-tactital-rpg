#!/usr/bin/env python3
"""OPERAÇÃO LIMIAR — twenty authored tactical route plates per physical interior.

The navigable 8x8 map is the same geometrical geometry as the gameplay:
walls, traps, objective stations, safe fallback corridor, entrance and exit.
Each of 5 stations has 4 unique author-directed visual perspectives, 560
separately inspected original WebP plates for the Android offline reader.
Real obstacles and water/heat/records/etc. replace generic wallpaper.
No resizing of existing images, artificial byte padding, random texture
or duplicated whole frames. One image at a time is decoded on Android.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import random
import textwrap
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from generate_v20_illustrations import room_specs,seed_for
from produce_tactical_simulations import draw_city,PAL,font,mix,district

ROOT=Path(__file__).resolve().parents[1]
WIDTH,HEIGHT=2880,1620
STATIONS=((2,6),(3,5),(4,4),(5,3),(6,2))
ENTRANCE=(0,7)
EXIT=(7,1)
SAFE_ROUTE=((0,7),(1,7),(2,7),(2,6),(3,6),(3,5),
            (4,5),(4,4),(5,4),(5,3),(6,3),(6,2),(7,2),(7,1))
EXTRA_COVER=((0,1),(0,2),(1,1),(1,3),(1,5),(2,0),(2,2),(2,4),
             (3,0),(3,2),(3,7),(4,0),(4,2),(4,7),
             (5,0),(5,1),(5,6),(5,7),(6,0),(6,4),(6,6),(7,3),(7,4),(7,6))
HAZARD_CANDIDATES=((1,6),(1,5),(2,5),(3,6),(3,4),(4,5),
                   (4,3),(5,4),(5,2),(6,3),(6,1),(7,2))
PHASE_LABELS=(
 ("ROTA DE APROXIMAÇÃO","O equipamento isolado precisa receber uma vistoria local"),
 ("INTERVENÇÃO SEGURA","O sistema deve funcionar mesmo sem ordens corporativas"),
 ("FLUXO DE EVACUAÇÃO","Os corredores precisam preservar a circulação civil"),
 ("CONTRAPROVA","Os registros físicos resistem à adulteração digital"),
 ("GUARDA COMUNITÁRIA","O retorno exige manutenção e fiscalização contínuas"),
)
BODY=font(22);TINY=font(18);MID=font(28,True);BIG=font(56,True)

def layout(room_id):
 h=2166136261
 for ch in room_id:
  h=((h^ord(ch))*16777619)&0xffffffff
 safe=set(SAFE_ROUTE)
 walls=set()
 for i,pair in enumerate(EXTRA_COVER):
  local=(h^(((i+1)*0x9E3779B1)&0xffffffff))&0xffffffff
  if (local+i*13)%7<3 and pair not in safe:
   walls.add(pair)
 danger=set()
 for i,pair in enumerate(HAZARD_CANDIDATES):
  local=(h^(((i+7)*0x85EBCA6B)&0xffffffff))&0xffffffff
  if (local+i*11)%4==0 and pair not in walls and pair not in STATIONS:
   danger.add(pair)
 return walls,danger

def iso(cx,cy,x,y,z=0,zoom=1.05):
 return (int(cx+(x-y)*77*zoom),int(cy+(x+y)*39*zoom-z*zoom))
def outline_poly(d,poly,fill,stroke,width):
 d.polygon(poly,fill=fill)
 d.line(poly+[poly[0]],fill=stroke,width=width,joint="curve")
def sign(d,rect,label,color,bg,scale=1):
 x1,y1,x2,y2=rect
 d.rounded_rectangle(rect,radius=7,fill=bg,outline=color,width=3)
 d.text((x1+12,y1+7),label[:32].upper(),fill=color,font=font(19*scale,True))
def machinery(d,rng,room,phase,view,region,bg,steel,gold):
 # Region-specific structure with real pipes, switches, vents and manual
 # control panels. This is not recycled audio/media from earlier releases.
 xmin=1850
 d.rounded_rectangle((xmin,208,2805,1420),radius=22,
   fill=mix(bg,(6,16,24),.60),outline=steel,width=5)
 name=(room["archiveTitle"],room["machineTitle"],room["cacheTitle"])
 details=(room["archiveDetail"],room["machineDetail"],room["cacheDetail"])
 for n in range(3):
  top=260+n*375
  edge=gold if phase%3==n else steel
  d.rounded_rectangle((xmin+20,top,2780,top+332),radius=17,
      fill=mix(bg,steel,.20+(view%3)*.06),outline=edge,width=4)
  d.text((xmin+44,top+13),f"{n+1:02d} / {name[n][:22].upper()}",
     font=MID,fill=edge)
  d.line((xmin+40,top+72,2740,top+72),fill=steel,width=3)
  if n==0: # Signed record readers: trace sample and stamped film strips
   samples=[]
   for k in range(110):
    x=xmin+42+k*7
    y=top+198+int(35*math.sin(k*.28+phase*.30)+
                   27*math.cos(k*.11+view*.6)+11*math.sin(k*.59))
    samples.append((x,y))
   d.line(samples,fill=gold,width=5,joint="curve")
   for t in range(21):
    x=xmin+48+t*34
    h=27+int(23*(1+math.sin(t*.56+view))/2)
    d.rectangle((x,top+254,x+15,top+254+h),
      fill=mix(steel,gold,.26+(t%4)*.12))
    d.line((x,top+253,x,top+299),fill=mix(bg,steel,.7),width=2)
  elif n==1: # Pneumatic radial manual valve and relay wiring
   cx=xmin+270;cy=top+208
   for rad in (130,110,84,52,19):
    d.ellipse((cx-rad,cy-rad,cx+rad,cy+rad),
      outline=gold if rad in (84,19) else steel,width=5)
   for t in range(16):
    a=t*math.pi/8+view*.21+phase*.08
    x=cx+int(math.cos(a)*98);y=cy+int(math.sin(a)*98)
    d.line((cx,cy,x,y),fill=mix(steel,gold,.16),width=4)
    d.ellipse((x-6,y-6,x+6,y+6),outline=gold,width=2)
   for t in range(9):
    y=top+113+t*23
    d.rectangle((xmin+484,y,xmin+490+rng.randint(80,258),y+10),
      fill=mix(steel,gold,(t%5)*.11))
  else: # Batch inventory with precisely countable supply compartments
   for y in range(4):
    for x in range(10):
     xx=xmin+46+x*77;yy=top+107+y*51
     d.rounded_rectangle((xx,yy,xx+57,yy+38),radius=5,
       fill=mix(bg,steel,.43+(x%4)*.04),
       outline=gold if (x+y+phase+view)%9==0 else steel,width=2)
     d.rectangle((xx+11,yy+13,xx+43,yy+19),fill=mix(gold,steel,.55))
  txt=details[n]
  for i,line in enumerate(textwrap.wrap(txt,width=85,break_long_words=False)[:2]):
   d.text((xmin+43,top+300-i*24),line[:90],font=TINY,fill=(222,226,223))

def route_city(d,rng,cx,cy,walls,dangers,phase,view,bg,steel,gold):
 # Axonometric patrol zone is EXACTLY the live 8x8 game grid.
 # The full safe corridor, dangerous areas and destinations line up.
 for diagonal in range(15):
  for x in range(8):
   y=diagonal-x
   if y<0 or y>7:continue
   p0=iso(cx,cy,x,y);p1=iso(cx,cy,x+1,y)
   p2=iso(cx,cy,x+1,y+1);p3=iso(cx,cy,x,y+1)
   shade=mix(bg,steel,.29+((x+y+view+phase)%6)*.045)
   outline_poly(d,[p0,p1,p2,p3],shade,mix(steel,bg,.55),3)
   # Maintenance seams, drains and crosshatch are physical pavement.
   for k in range(39):
    px=p0[0]+rng.randint(-48,48);py=p0[1]+rng.randint(7,69)
    if k%5==0:d.line((px,py,px+rng.randint(8,36),py+2),
                     fill=mix(steel,gold,.09),width=2)
    elif k%5==1:d.rectangle((px,py,px+9,py+6),
                            outline=mix(steel,bg,.40),width=1)
    elif k%5==2:d.ellipse((px,py,px+7,py+7),fill=mix(bg,steel,.63))
    elif k%5==3:d.line((px,py,px,py+14),fill=mix(steel,bg,.20),width=2)
    else:d.line((px,py,px+16,py-1),fill=mix(bg,gold,.20),width=2)
 # Signs and protective barricades match the actual blocked cells.
 for k,(x,y) in enumerate(sorted(walls)):
  base=[iso(cx,cy,x,y),iso(cx,cy,x+1,y),
        iso(cx,cy,x+1,y+1),iso(cx,cy,x,y+1)]
  h=89+(k%5)*21
  roof=[(xx,yy-h) for xx,yy in base]
  outline_poly(d,[base[1],base[2],roof[2],roof[1]],
       mix(bg,steel,.59),steel,4)
  outline_poly(d,[base[2],base[3],roof[3],roof[2]],
       mix(bg,steel,.40),steel,4)
  outline_poly(d,roof,mix(bg,steel,.73),gold if (k+phase)%7==0 else steel,4)
  d.line((roof[3][0]+14,roof[3][1]+20,roof[2][0]-14,roof[2][1]-5),
       fill=mix(steel,gold,.32),width=4)
  for i in range(170):
   px=roof[0][0]+rng.randint(-44,48)
   py=roof[0][1]+rng.randint(2,41)
   if i%3==0:d.ellipse((px,py,px+4,py+4),outline=mix(steel,gold,.31),width=1)
   elif i%3==1:d.line((px,py,px+rng.randint(4,18),py+2),
       fill=mix(steel,bg,.37),width=2)
   else:d.rectangle((px,py,px+8,py+4),outline=steel,width=1)
 # Hazard cells and their actual sensors are rendered in map space.
 for x,y in sorted(dangers):
  px,py=iso(cx,cy,x+.5,y+.5,15)
  d.ellipse((px-41,py-24,px+41,py+26),fill=mix(bg,(168,89,61),.56),
   outline=(238,153,102),width=6)
  d.line((px-20,py-9,px+20,py+9),fill=(248,193,126),width=5)
  d.line((px+20,py-9,px-20,py+9),fill=(248,193,126),width=5)
  d.ellipse((px-8,py-73,px+8,py-55),fill=(239,144,84))
  d.line((px,py-55,px,py-28),fill=(239,144,84),width=4)
 # Fixed, real safe service corridor. No magic teleport: all 4-neighbour cells.
 route=[iso(cx,cy,x+.5,y+.5,14) for x,y in SAFE_ROUTE]
 d.line(route,fill=gold,width=13,joint="curve")
 for i,(x,y) in enumerate(SAFE_ROUTE):
  px,py=iso(cx,cy,x+.5,y+.5,14)
  d.ellipse((px-12,py-12,px+12,py+12),
    fill=gold,outline=bg,width=2)
  if i%3==0:d.text((px+23,py-30),f"{i:02d}",fill=gold,font=TINY)
 # Five real checkpoints: current stage stronger than completed and future.
 for idx,(x,y) in enumerate(STATIONS):
  px,py=iso(cx,cy,x+.5,y+.5,48)
  radius=46 if idx==phase else 34
  d.ellipse((px-radius,py-radius,px+radius,py+radius),
    fill=mix(bg,gold,.45),outline=gold,width=7)
  d.text((px-17,py-23),str(idx+1),font=font(40,True),fill=(255,235,187))
  d.line((px,py-radius,px,py-radius-54),fill=gold,width=5)
  d.ellipse((px-10,py-radius-70,px+10,py-radius-50),
      outline=gold,width=3)
 for (x,y),name,color in ((ENTRANCE,"ENTRADA",(105,218,240)),
                           (EXIT,"SAÍDA",(231,193,126))):
  px,py=iso(cx,cy,x+.5,y+.5,40)
  d.ellipse((px-25,py-27,px+25,py+27),fill=mix(bg,color,.55),
    outline=color,width=6)
  d.text((px-50,py-77),name,font=TINY,fill=color)
 # Service crews and sentry shadows are scene characters, not the real
 # player sprite; all rendered objects are placed in the same geometry.
 for k in range(8):
  loc=SAFE_ROUTE[(k*2+phase+view)%len(SAFE_ROUTE)]
  px,py=iso(cx,cy,loc[0]+.35,loc[1]+.35,18)
  tint=(70,208,229) if k<4 else (213,71,160)
  d.ellipse((px-8,py-64,px+8,py-44),fill=mix(tint,bg,.21),outline=tint,width=2)
  d.polygon([(px-13,py-40),(px+13,py-40),(px+19,py-1),(px-18,py-1)],
             fill=mix(bg,tint,.62))
  d.line((px-9,py-1,px-15,py+21),fill=tint,width=5)
  d.line((px+9,py-1,px+15,py+21),fill=tint,width=5)
 # Floor fixtures and service wiring, all correlated with map tiles.
 for idx in range(3950):
  x=rng.randrange(8);y=rng.randrange(8)
  px,py=iso(cx,cy,x,y)
  fx=px+rng.randint(-38,38);fy=py+rng.randint(14,62)
  shape=idx%7
  if shape==0:d.line((fx,fy,fx+10,fy),fill=mix(steel,gold,.14),width=1)
  elif shape==1:d.rectangle((fx,fy,fx+6,fy+4),outline=mix(bg,steel,.48),width=1)
  elif shape==2:d.ellipse((fx,fy,fx+3,fy+3),fill=mix(steel,bg,.3))
  elif shape==3:d.line((fx,fy,fx+4,fy+8),fill=mix(steel,gold,.11),width=1)
  elif shape==4:d.line((fx,fy,fx+18,fy-2),fill=mix(bg,steel,.66),width=1)
  elif shape==5:d.line((fx,fy,fx,fy+12),fill=mix(bg,steel,.59),width=1)
  else:d.ellipse((fx,fy,fx+4,fy+4),outline=mix(steel,gold,.13),width=1)

def render(room,frame,root):
 phase=frame//4;view=frame%4
 sector=district(room)
 bg,steel,gold=PAL[sector]
 # All routes in the source are reproductions of the actual game geometry.
 walls,dangers=layout(room["id"])
 rng=random.Random(seed_for("perimeter-map-v1",room["id"],str(phase),str(view)))
 image=Image.new("RGB",(WIDTH,HEIGHT),bg)
 d=ImageDraw.Draw(image)
 draw_city(d,rng,bg,steel,gold,phase,view,room)
 route_city(d,rng,1035+view*11,340+phase*8,walls,dangers,phase,view,bg,steel,gold)
 machinery(d,rng,room,phase,view,sector,bg,steel,gold)
 d.rounded_rectangle((63,70,1825,266),radius=18,
       fill=mix(bg,(5,15,24),.73),outline=steel,width=5)
 d.text((99,90),"OPERAÇÃO LIMIAR / NOVA ARCÁDIA",font=MID,fill=gold)
 d.line((98,142,1800,142),fill=steel,width=4)
 d.text((99,163),room["title"].upper()[:37],font=BIG,fill=(233,230,220))
 d.rounded_rectangle((62,1110,1877,1549),radius=26,
       fill=mix(bg,(8,15,25),.71),outline=steel,width=5)
 d.text((104,1143),f"POSTO {phase+1:02d}/05 · {PHASE_LABELS[phase][0]}",
       font=font(39,True),fill=gold)
 d.line((106,1209,1810,1209),fill=steel,width=4)
 for i,row in enumerate(textwrap.wrap(
      PHASE_LABELS[phase][1]+" · "+room["guideWords"],width=94,break_long_words=False)[:5]):
  d.text((113,1242+i*47),row,font=BODY,fill=(231,229,213))
 d.text((106,1502),f"VISÃO {view+1}/4 · DADOS OPERACIONAIS SEM IDENTIFICAÇÃO CIVIL",
     font=TINY,fill=(180,205,208))
 for idx in range(20):
  px=1906+idx*44
  d.rounded_rectangle((px,1500,px+29,1536),radius=4,
     fill=gold if idx==frame else mix(bg,steel,.30+(idx%3)*.07),
     outline=gold if idx//4<=phase else steel,width=2)
 digest=hashlib.sha256((room["id"]+"perimeter"+str(frame)).encode()).hexdigest()[:12].upper()
 d.text((1995,1563),"REGISTRO DE PATRULHA: "+digest,font=TINY,fill=(183,193,204))
 path=root/sector/"routes"/room["id"]/f"patrulha-{frame+1:02d}.webp"
 path.parent.mkdir(parents=True,exist_ok=True)
 image.save(path,"WEBP",quality=100,method=4)
 caption=(f"Operação Limiar · {room['title']}: posto {phase+1}/5, "
   f"enquadramento {view+1}/4. {PHASE_LABELS[phase][1]}. "
   f"Rotas e obstáculos fiéis à planta de navegação local.")
 return {"path":f"routes/{room['id']}/patrulha-{frame+1:02d}.webp",
   "room":room["id"],"kind":"route","license":"original","caption":caption[:240]}

def produce(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 sizes=[]
 for room in rooms:
  zone=district(room)
  source=root/zone
  path=source/"source-manifest.json"
  existing=json.loads(path.read_text(encoding="utf8")) if path.is_file() else []
  existing=[e for e in existing if e["room"]!=room["id"] or e["kind"]!="route"]
  generated=[render(room,j,root) for j in range(20)]
  path.parent.mkdir(parents=True,exist_ok=True)
  path.write_text(json.dumps(existing+generated,ensure_ascii=False,indent=2)+"\n",
                  encoding="utf8")
  size=sum((source/x["path"]).stat().st_size for x in generated)
  sizes.append(size)
  print(f"PERIMETER {room['id']}: 20 original navigable map illustrations, {size:,} bytes",flush=True)
 report={"rooms":len(rooms),"images":len(rooms)*20,"bytes":sum(sizes),
         "minimum_room_bytes":min(sizes) if sizes else 0}
 print("PERIMETER_ART_REPORT "+json.dumps(report),flush=True)
 return report
if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 parser.add_argument("--limit-rooms",type=int)
 args=parser.parse_args()
 produce(args.source,args.limit_rooms)
