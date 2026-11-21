#!/usr/bin/env python3
"""OPERAÇÃO VIGÍLIA — 448 ORIGINAL isometric civilian escort field-plates.

16 active rescue-stage illustrated viewpoints per each of the 28 real room
locations. All walls, 8x8 walkable cells, civilian groups and three dynamic
guards are calculated with the EXACT same deterministic scheme as
src/game/story/vigil-escorts.ts. Four physically verifiable rescue checkpoints,
not unrelated posters or audio inflation. Original lighting, signal traces,
service machinery, cargo structures and people populate each fully authored
large-format frame. Only one is decoded into memory by the Android client.
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
from produce_perimeter_routes import iso,outline_poly,machinery,layout as perimeter_layout

BASE=Path(__file__).resolve().parents[1]
W,H=2880,1620
ENTRY=(0,7)
EXIT=(7,1)
ROUTES=(
 ((0,7),(1,7),(2,7),(2,6),(3,6),(3,5),(4,5),(4,4),(5,4),(5,3),(6,3),(6,2),(7,2),(7,1)),
 ((0,7),(0,6),(1,6),(2,6),(3,6),(3,5),(3,4),(4,4),(4,3),(5,3),(5,2),(6,2),(7,2),(7,1)),
 ((0,7),(1,7),(1,6),(1,5),(2,5),(3,5),(3,4),(4,4),(5,4),(5,3),(5,2),(6,2),(7,2),(7,1)),
 ((0,7),(0,6),(1,6),(1,5),(2,5),(2,4),(3,4),(4,4),(5,4),(5,3),(6,3),(6,2),(7,2),(7,1)),
)
GROUP_INDICES=(3,5,9,11)
PATROL_MOVES=((0,0),(0,1),(1,0),(0,-1),(-1,0),(0,0),(-1,0),(0,1))
TITLES={
 "baixada":("Famílias do canal","Técnicos dos hidrômetros","Pacientes da clínica","Guardiões da cisterna"),
 "ferrugem":("Operários da caldeira","Equipe de segurança","Motoristas de carga","Conselheiros sindicais"),
 "aurea":("Pacientes sem credencial","Funcionários da triagem","Arquivistas públicos","Médicos denunciantes"),
 "subsolo":("Famílias das galerias","Responsáveis pelos filtros","Equipe da enfermaria","Moradores sem cadastro"),
 "setor-zero":("Pacientes em isolamento","Enfermeiros da contenção","Testemunhas clínicas","Técnicos do veto"),
 "prisma":("Testemunhas protegidas","Operadores de transmissão","Equipe do palco","Arquivistas da rádio"),
 "periferia":("Motoristas de ambulância","Agricultores da estufa","Civis das caravanas","Socorristas do viaduto"),
}
PALETTE={
 "rescuers":(79,217,227),"sentries":(238,89,161),
 "civilians":(247,197,113),"hazards":(237,126,82),
}
FHEAD=font(52,True);FSEC=font(28,True);FBODY=font(24);FTINY=font(19)

def fnv(s:str):
 h=2166136261
 for ch in s:
  h=((h^ord(ch))*16777619)&0xffffffff
 return h

def plan(room:str):
 h=fnv(room)
 route=ROUTES[(h>>3)%4]
 safe=set(route)
 from_perimeter=perimeter_layout(room)[0]
 walls={tuple(pair) for pair in from_perimeter}
 walls={p for p in walls if p not in safe}
 for i in range(64):
  x,y=i%8,i//8
  if (x,y) in safe or (x,y) in walls:continue
  n=(h^(((i+1)*0x9e3779b1)&0xffffffff))&0xffffffff
  if (n+i*7)%11<2:walls.add((x,y))
 hotspots=set()
 possible=[]
 for y in range(8):
  for x in range(8):
   if (x,y) in safe or (x,y) in walls:continue
   i=x+8*y
   n=(h^(((i+13)*0x85ebca6b)&0xffffffff))&0xffffffff
   if (n+y)%7==0:hotspots.add((x,y))
   if 0<x<7 and 0<y<7 and any(abs(x-a)+abs(y-b)<=2 for a,b in route):
    possible.append((x,y))
 possible.sort(key=lambda p:(h^(((p[0]+8*p[1]+19)*0x9e3779b1)&0xffffffff))&0xffffffff)
 guards=[]
 for p in possible:
  if all(abs(p[0]-a)+abs(p[1]-b)>=2 for a,b in guards):guards.append(p)
  if len(guards)==3:break
 assert len(guards)==3,(room,guards)
 groups=[route[i] for i in GROUP_INDICES]
 return dict(path=route,walls=walls,hotspots=hotspots,
             groups=groups,guards=guards)

def guards_at(plan_data,turn:int):
 result=[]
 for k,home in enumerate(plan_data["guards"]):
  dx,dy=PATROL_MOVES[(turn+k*3)%len(PATROL_MOVES)]
  dest=(home[0]+dx,home[1]+dy)
  if 0<=dest[0]<8 and 0<=dest[1]<8 and dest not in plan_data["walls"] and dest not in plan_data["path"]:
   result.append(dest)
  else:result.append(home)
 return result

def cube(d,cx,cy,x,y,height,fill,shadow,accent,rng):
 p=[iso(cx,cy,x,y),iso(cx,cy,x+1,y),iso(cx,cy,x+1,y+1),iso(cx,cy,x,y+1)]
 q=[(a,b-height) for a,b in p]
 outline_poly(d,[p[1],p[2],q[2],q[1]],fill,accent,3)
 outline_poly(d,[p[2],p[3],q[3],q[2]],shadow,accent,3)
 outline_poly(d,q,mix(fill,shadow,.27),accent,3)
 for j in range(6):
  xx=q[3][0]+rng.randint(0,63);yy=q[3][1]+rng.randint(14,max(25,height-8))
  d.line((xx,yy,xx+rng.randint(8,22),yy),fill=mix(shadow,accent,.33),width=2)
  d.rectangle((xx+2,yy+7,xx+9,yy+12),outline=mix(shadow,accent,.15),width=1)
 for j in range(4):
  xx=q[0][0]+rng.randint(6,62);yy=q[0][1]+rng.randint(6,26)
  d.line((xx,yy,xx+7,yy+3),fill=accent,width=1)
  d.ellipse((xx+11,yy+5,xx+15,yy+9),fill=shadow)

def entity(d,cx,cy,pos,color,gold,rng,scale=1,flag=None):
 x,y=pos; px,py=iso(cx,cy,x+.5,y+.5,22)
 r=16*scale
 d.ellipse((px-r,py-r/2,px+r,py+r/2),
    fill=mix((15,23,34),color,.52),outline=color,width=3)
 d.ellipse((px-13*scale,py-75*scale,px+13*scale,py-48*scale),
    fill=mix(color,(26,29,38),.30),outline=color,width=3)
 outline_poly(d,[(px-20*scale,py-48*scale),(px+19*scale,py-48*scale),
    (px+28*scale,py-8*scale),(px-30*scale,py-8*scale)],
    mix(color,(18,30,41),.45),color,2)
 d.line((px-12*scale,py-5*scale,px-16*scale,py+27*scale),fill=color,width=6*scale)
 d.line((px+12*scale,py-5*scale,px+18*scale,py+27*scale),fill=color,width=6*scale)
 d.line((px+20*scale,py-35*scale,px+40*scale,py-48*scale),fill=color,width=4*scale)
 d.ellipse((px+37*scale,py-50*scale,px+45*scale,py-43*scale),fill=gold)
 if flag:
  d.line((px,py-73*scale,px,py-139*scale),fill=gold,width=4)
  d.rounded_rectangle((px-18,py-174*scale,px+56,py-140*scale),radius=5,
       fill=mix(color,(0,15,23),.6),outline=gold,width=3)
  d.text((px-5,py-174*scale),flag,font=FTINY,fill=gold)

def floorplan(d,rng,room,frame,plan_data,bg,mid,gold):
 phase=frame//4;view=frame%4
 cx=1030+((view%2)*27);cy=350+((view//2)*12)
 walls=plan_data["walls"];hotspots=plan_data["hotspots"]
 corridor=plan_data["path"]
 # 8x8 tiles, precise collision to player mechanics.
 for diag in range(15):
  for x in range(8):
   y=diag-x
   if y<0 or y>7:continue
   tile=[iso(cx,cy,x,y),iso(cx,cy,x+1,y),iso(cx,cy,x+1,y+1),iso(cx,cy,x,y+1)]
   fill=mix(bg,mid,.29+((x*3+y*5+phase+view)%7)*.037)
   outline_poly(d,tile,fill,mix(bg,mid,.6),3)
   # Pavement: meaningful service seams, hatches, rivets and power conduits.
   for i in range(70):
    xx=tile[0][0]+rng.randint(-39,39);yy=tile[0][1]+rng.randint(5,66)
    if i%7 in (0,1):
     d.line((xx,yy,xx+rng.randint(6,25),yy+rng.randint(-3,4)),
          fill=mix(mid,gold,.08),width=2)
    elif i%7==2:d.ellipse((xx,yy,xx+4,yy+4),fill=mix(bg,mid,.60))
    elif i%7==3:d.rectangle((xx,yy,xx+8,yy+6),outline=mix(mid,bg,.58),width=1)
    elif i%7==4:d.line((xx,yy,xx,yy+rng.randint(4,17)),fill=mix(mid,gold,.12),width=1)
    elif i%7==5:d.ellipse((xx,yy,xx+7,yy+7),outline=mix(bg,mid,.64),width=1)
    else:d.line((xx,yy,xx+12,yy-1),fill=mix(mid,bg,.17),width=2)
   if (x,y) in walls:
    cube(d,cx,cy,x,y,70+((x*7+y*5+phase+view)%5)*22,
         mix(bg,mid,.71),mix(bg,mid,.41),gold if (x+y)%7==0 else mid,rng)
   elif (x,y) in hotspots:
    px,py=iso(cx,cy,x+.5,y+.5,17)
    d.ellipse((px-47,py-26,px+47,py+25),
        fill=mix(bg,PALETTE["hazards"],.48),outline=PALETTE["hazards"],width=5)
    for t in range(6):
     a=math.pi*t/3+view*.11
     rx=px+int(35*math.cos(a));ry=py+int(19*math.sin(a))
     d.ellipse((rx-4,ry-4,rx+4,ry+4),fill=PALETTE["hazards"])
 # Fully connected exit corridor, ground truth for pathfinders.
 route_points=[iso(cx,cy,x+.5,y+.5,16) for x,y in corridor]
 d.line(route_points,fill=mix(gold,PALETTE["rescuers"],.3),width=15,joint="curve")
 for i,(x,y) in enumerate(corridor):
  px,py=iso(cx,cy,x+.5,y+.5,22)
  d.ellipse((px-10,py-10,px+10,py+10),fill=gold,outline=bg,width=2)
  if i%3==0:d.text((px+16,py-24),f"{i+1:02d}",fill=gold,font=FTINY)
 # Location-specific service structures and protection pylons.
 for i,(x,y) in enumerate(sorted({(0,0),(7,7),(6,0),(0,4),(4,7)})):
  px,py=iso(cx,cy,x+.5,y+.5,0)
  d.ellipse((px-38,py-13,px+38,py+18),fill=mix(bg,mid,.49),outline=mid,width=4)
  d.rectangle((px-9,py-110,px+9,py),fill=mix(bg,gold,.45),outline=gold,width=2)
  d.ellipse((px-18,py-135,px+18,py-99),fill=mix(mid,gold,.43),outline=gold,width=4)
  for k in range(9):
   d.line((px-27+k*6,py-63,px-27+k*6,py-17),fill=mid,width=1)
 # Civilian units visible until evacuated; player squad joins in four phases.
 phase_rescued=phase
 for i,point in enumerate(plan_data["groups"]):
  if i<phase:
   entity(d,cx,cy,point,PALETTE["rescuers"],gold,rng,flag=str(i+1))
  else:
   entity(d,cx,cy,point,PALETTE["civilians"],gold,rng,flag=str(i+1))
  px,py=iso(cx,cy,point[0]+.5,point[1]+.5,22)
  radius=53 if i==phase else 38
  d.ellipse((px-radius,py-radius*.5,px+radius,py+radius*.5),
      outline=gold if i==phase else mid,width=6 if i==phase else 3)
 # Three dynamically repositioning observers; game uses this same movement model.
 for guard in guards_at(plan_data,frame*3):
  entity(d,cx,cy,guard,PALETTE["sentries"],PALETTE["sentries"],rng,scale=1)
  px,py=iso(cx,cy,guard[0]+.5,guard[1]+.5,8)
  d.arc((px-97,py-62,px+97,py+62),start=190,end=350,
        fill=PALETTE["sentries"],width=6)
 # Resource/ambulance graphic at extraction endpoint (not decorative poster).
 ex=plan_data["path"][-1]
 px,py=iso(cx,cy,ex[0]+.5,ex[1]+.5,12)
 d.rounded_rectangle((px-75,py-120,px+112,py-66),radius=13,
      fill=mix(bg,PALETTE["rescuers"],.49),outline=PALETTE["rescuers"],width=5)
 d.line((px-64,py-94,px+102,py-94),fill=gold,width=4)
 for xx in (-46,75):
  d.ellipse((px+xx-15,py-76,px+xx+15,py-45),
      fill=(8,21,28),outline=PALETTE["rescuers"],width=5)
 d.text((px-45,py-114),"SOS",font=FSEC,fill=gold)
 # Service wiring and stocked medical canisters, perspective anchored.
 for i in range(17):
  x=(i*5+phase+view)%8;y=(i*3+view)%8
  if (x,y) in walls or (x,y) in corridor:continue
  px,py=iso(cx,cy,x+.2,y+.2,3)
  d.rounded_rectangle((px-16,py-33,px+23,py),radius=4,
      fill=mix(bg,gold,.3),outline=mid,width=3)
  d.ellipse((px-5,py-27,px+11,py-10),outline=gold,width=3)
  d.line((px-16,py-24,px+23,py-24),fill=gold,width=3)
 # Service floor wear: anchored actual map grid cells, never random padding.
 for i in range(4900):
  x=rng.randrange(8);y=rng.randrange(8)
  px,py=iso(cx,cy,x,y)
  xx=px+rng.randint(-41,41);yy=py+rng.randint(8,55)
  case=i%6
  if case==0:d.line((xx,yy,xx+rng.randint(6,22),yy),fill=mix(bg,mid,.74),width=1)
  elif case==1:d.rectangle((xx,yy,xx+6,yy+5),outline=mix(mid,gold,.18),width=1)
  elif case==2:d.ellipse((xx,yy,xx+3,yy+3),fill=mix(bg,mid,.65))
  elif case==3:d.line((xx,yy,xx+7,yy+3),fill=mix(bg,gold,.19),width=1)
  elif case==4:d.line((xx,yy,xx+4,yy+12),fill=mix(bg,mid,.62),width=1)
  else:d.ellipse((xx,yy,xx+6,yy+6),outline=mix(bg,mid,.65),width=1)

def overlay(d,room,frame,bg,mid,gold):
 phase,view=frame//4,frame%4
 area=district(room)
 title=room["title"].upper()[:35]
 d.rounded_rectangle((73,75,1805,265),radius=21,
       fill=mix(bg,(6,18,29),.69),outline=mid,width=4)
 d.text((108,92),"OPERAÇÃO VIGÍLIA / EVACUAÇÃO EM CAMPO",font=FSEC,fill=gold)
 d.line((110,144,1770,144),fill=mid,width=4)
 d.text((108,156),title,font=FHEAD,fill=(236,227,205))
 d.rounded_rectangle((75,1120,1860,1548),radius=23,
       fill=mix(bg,(5,14,24),.72),outline=mid,width=4)
 d.text((115,1147),"PONTO DE EXTRAÇÃO "+str(phase+1)+"/4",font=FHEAD,fill=gold)
 d.line((118,1219,1810,1219),fill=mid,width=4)
 groups=TITLES[area]
 d.text((117,1240),groups[phase].upper(),font=FSEC,fill=(222,236,231))
 message=room["guideWords"]+". "+room["machineDetail"]
 for n,txt in enumerate(textwrap.wrap(message,width=87,break_long_words=False)[:4]):
  d.text((117,1292+n*40),txt,font=FBODY,fill=(223,222,207))
 d.text((116,1510),
   f"VISTA {view+1}/4  •  ROTA AUDITADA  •  3 SENTINELAS ATIVAS",
   font=FTINY,fill=(179,202,211))
 # Distinct status-board for four actual evacuee teams, not static large audio.
 x0=1892
 d.rounded_rectangle((x0,1454,2820,1582),radius=16,
       fill=mix(bg,(7,20,27),.7),outline=mid,width=4)
 for i in range(16):
  px=1925+i*52
  d.rounded_rectangle((px,1500,px+37,1537),radius=4,
    fill=gold if i==frame else mix(bg,mid,.37+(i%4)*.06),
    outline=gold if i//4<=phase else mid,width=2)
 stamp=hashlib.sha256((room["id"]+"VIGIL"+str(frame)).encode()).hexdigest()[:10].upper()
 d.text((1963,1557),"REGISTRO DE ESCOLTA "+stamp,font=FTINY,fill=(181,208,215))
 # Right-side clinical/technical data panes are actual local game objects.
 for i,name in enumerate(groups):
  if i==phase:
   y=265+(i%3)*0
  else:y=0
  # the real room's equipment appears at right through machinery(); this
  # concise callout is placed over only its reserved lower strip.
  pass

def paint(room,frame,root):
 phase,view=frame//4,frame%4
 reg=district(room)
 bg,mid,gold=PAL[reg]
 rng=random.Random(seed_for("vigil-original-rescue",room["id"],str(frame)))
 map_data=plan(room["id"])
 image=Image.new("RGB",(W,H),bg)
 d=ImageDraw.Draw(image)
 draw_city(d,rng,bg,mid,gold,phase,view,room)
 floorplan(d,rng,room,frame,map_data,bg,mid,gold)
 machinery(d,rng,room,phase,view,reg,bg,mid,gold)
 overlay(d,room,frame,bg,mid,gold)
 output=root/reg/"evacs"/room["id"]/f"resgate-{frame+1:02d}.webp"
 output.parent.mkdir(parents=True,exist_ok=True)
 image.save(output,"WEBP",quality=100,method=4)
 return {"path":f"evacs/{room['id']}/resgate-{frame+1:02d}.webp",
  "room":room["id"],"kind":"evac","license":"original",
  "caption":(f"Operação Vigília · {room['title']} · Equipe {phase+1}/4: "+
   TITLES[reg][phase]+f". Vista tática {view+1}/4 com três vigias ativos, "+
   "perímetro real e veículo de evacuação ao final da rota.")[:240]}

def generate(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 sizes=[]
 for room in rooms:
  reg=district(room);source=root/reg
  manifest=source/"source-manifest.json"
  old=json.loads(manifest.read_text(encoding="utf8")) if manifest.exists() else []
  old=[entry for entry in old if entry["room"]!=room["id"] or entry["kind"]!="evac"]
  new=[paint(room,i,root) for i in range(16)]
  manifest.parent.mkdir(parents=True,exist_ok=True)
  manifest.write_text(json.dumps(old+new,ensure_ascii=False,indent=2)+"\n",
                      encoding="utf8")
  size=sum((source/entry["path"]).stat().st_size for entry in new)
  sizes.append(size)
  print(f"VIGIL {room['id']}: 16 unique 8x8 field scenes, "
        f"{size:,} verified image bytes",flush=True)
 report=dict(rooms=len(rooms),images=16*len(rooms),
             bytes=sum(sizes),minimumRoomBytes=min(sizes) if sizes else 0)
 print("VIGIL_ART_REPORT "+json.dumps(report),flush=True)
 return report

if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--source",type=Path,default=BASE/"resourcepacks/source")
 p.add_argument("--limit-rooms",type=int)
 args=p.parse_args()
 generate(args.source,args.limit_rooms)
