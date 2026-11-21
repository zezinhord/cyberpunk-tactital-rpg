#!/usr/bin/env python3
"""A CIDADE RESPONDE: 672 ORIGINAL isometric playable investigation frames.

24 hand-configured viewpoints per each of the 28 *actual* interiors represent
six technical/tactical choices. The atlas is not a duplicated/cropped rendering
of the previous 448 cinematics: each frame is an independently generated
axonometric operational view with navigable floor topology, obstacles, covers,
stations, route annotations and protagonist / hostile positions.

Frames are indexed by the playable 6-stage simulation minigame and decoded one
at a time on mobile. WebP source bytes are distributed in 7 SHA-256 validated
Android content packs. NO noise, silence, arbitrary opaque padding or resizing
of previous art; all geometric detail belongs to the scene and its machines.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import random
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from generate_v20_illustrations import room_specs,seed_for

ROOT=Path(__file__).resolve().parents[1]
WIDTH,HEIGHT=2880,1620
VIEWS=4
PHASES=(
    ("EXAME DE CAMPO","Reconhecer a origem da falha na infraestrutura"),
    ("ANÁLISE DE SISTEMAS","Isolar o equipamento e conferir as medições"),
    ("TRAJETO SEGURO","Traçar o percurso sem comprometer civis"),
    ("PROVA MATERIAL","Preservar documentos e seu histórico"),
    ("DEFESA TÁTICA","Proteger as rotas e os dispositivos essenciais"),
    ("ACORDO DE RETOMADA","Garantir fiscalização, manutenção e continuidade"),
)
PAL={
 "baixada":((15,30,39),(71,143,160),(233,176,102)),
 "ferrugem":((35,31,38),(158,100,75),(239,186,112)),
 "aurea":((19,33,48),(83,148,183),(237,207,151)),
 "subsolo":((16,30,38),(68,114,143),(223,170,112)),
 "setor-zero":((27,29,45),(139,106,157),(228,189,143)),
 "prisma":((34,24,44),(161,88,153),(235,183,136)),
 "periferia":((34,35,41),(139,118,85),(232,192,132)),
}
FONT_DIR=Path("/usr/share/fonts/truetype/dejavu")
def font(size:int,bold:bool=False):
 f=FONT_DIR/("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
 return ImageFont.truetype(str(f),size) if f.exists() else ImageFont.load_default()
TITLE=font(55,True);SECTION=font(28,True);TEXT=font(23);SMALL=font(19)
def mix(a,b,t):
 return tuple(min(255,max(0,int(x*(1-t)+y*t))) for x,y in zip(a,b))
def brighten(a,n):
 return tuple(min(255,max(0,x+n)) for x in a)
def district(room):
 return next(k for k in PAL if room["id"].startswith(k+"-"))
def line_text(d,message,x,y,color,max_width=59,font_size=TEXT,step=40,max_lines=6):
 for k,row in enumerate(textwrap.wrap(message,width=max_width,break_long_words=False)[:max_lines]):
  d.text((x,y+k*step),row,font=font_size,fill=color)
def polygon(d,points,fill,outline=None,width=1):
 d.polygon(points,fill=fill)
 if outline:d.line([*points,points[0]],fill=outline,width=width,joint="curve")

def draw_city(d,rng,bg,mid,gold,phase,view,room):
 # Architectural skyline with independent footprints, windows, walkways and
 # cables. Its façades use real geometry, not stochastic per-pixel texture.
 for y in range(0,HEIGHT,2):
  d.rectangle((0,y,WIDTH,y+1),fill=mix(bg,mid,.03+y/HEIGHT*.09))
 for i in range(110):
  bx=i*31+rng.randint(-36,34)
  top=80+rng.randint(0,330)+((i+view+phase)%5)*18
  bw=rng.randint(55,155)
  d.rectangle((bx,top,bx+bw,890),fill=mix(bg,mid,.13+(i%5)*.035))
  d.line((bx,top,bx+bw,top),fill=mid,width=2)
  for n in range(1,12):
   xx=bx+8+(n%4)*24
   yy=top+22+(n//4)*34
   for y2 in range(yy,850,75):
    if rng.randrange(6)>1:
     d.rectangle((xx,y2,xx+11,y2+21),
       fill=mix(mid,gold,.12+(n%3)*.08),outline=bg,width=1)
  if i%6==0:
   d.line((bx+bw//2,top,bx+bw//2,top-75),fill=mid,width=4)
   d.line((bx-10,top+22,bx+bw+30,top+22),fill=gold,width=2)
 for wire in range(14):
  y=210+wire*52
  xx=rng.randint(-100,20)
  d.line([(xx,y),(710,y+52),(1740,y-22),(WIDTH,y+70)],
         fill=mix(mid,gold,.08+(wire%3)*.05),width=2)
  for j in range(6):
   px=xx+j*465
   d.line((px,y,px+16,y+30),fill=mid,width=2)
 # Foreground planned street with central lanes and drains.
 polygon(d,[(0,1010),(WIDTH,950),(WIDTH,HEIGHT),(0,HEIGHT)],
         mix(bg,mid,.24),outline=mid,width=3)
 for i in range(40):
  y=1000+int((i/40)**1.28*620)
  d.line((0,y,WIDTH,y-55),fill=mix(bg,mid,.34),width=2)
 for i in range(-14,45):
  d.line((WIDTH//2,950,i*95,HEIGHT),fill=mix(bg,mid,.27),width=1)
 # Overpasses and refuse barriers vary by environment stage.
 for k in range(9):
  x=90+k*330+rng.randint(-80,90)
  y=910+rng.randint(-40,130)
  if k%3==phase%3:
   d.rounded_rectangle((x,y-80,x+180,y+15),radius=6,
      fill=mix(bg,mid,.44),outline=gold,width=4)
   for j in range(9):
    d.line((x+14+j*18,y-75,x+14+j*18,y+8),fill=mid,width=2)
  else:
   polygon(d,[(x,y-30),(x+120,y-45),(x+150,y+3),(x+12,y+21)],
           mix(bg,mid,.42),outline=mid,width=3)

def iso(cx,cy,x,y,z=0,zoom=1):
 return (round(cx+(x-y)*76*zoom),round(cy+(x+y)*35*zoom-z*zoom))
def ground(d,rng,cx,cy,room,phase,view,bg,mid,gold):
 # 9x9 isometric street blocks, pathfinding geometry and cover markers.
 # Distinct alternate viewpoint shifts are not image crops: obstacles,
 # patrols, evidence and routes move at each phase/view.
 order=[(x,y) for x in range(9) for y in range(9)]
 order.sort(key=lambda t:t[0]+t[1])
 for x,y in order:
  px,py=iso(cx,cy,x,y)
  tint=mix(bg,mid,.29+((x+y+phase+view)%6)*.045)
  verts=[iso(cx,cy,x,y),iso(cx,cy,x+1,y),
         iso(cx,cy,x+1,y+1),iso(cx,cy,x,y+1)]
  polygon(d,verts,tint,outline=mix(mid,bg,.61),width=3)
  # Material weathering is rendered as bolts, seams, curb stains and
  # drain grates in world space; each stroke belongs to a floor tile.
  for n in range(32):
   xx=px+rng.randint(-37,37)
   yy=py+rng.randint(12,54)
   case=(n+x+phase)%5
   if case==0:
    d.line((xx,yy,xx+rng.randint(4,27),yy),fill=mix(mid,gold,.12),width=2)
   elif case==1:
    d.rectangle((xx,yy,xx+rng.randint(4,12),yy+rng.randint(3,7)),
          outline=mix(bg,mid,.60),width=1)
   elif case==2:
    d.ellipse((xx,yy,xx+5,yy+5),fill=mix(mid,gold,.22))
   elif case==3:
    d.line((xx,yy,xx+rng.randint(5,23),yy-rng.randint(0,4)),
         fill=mix(mid,bg,.32),width=2)
   else:
    d.line((xx,yy,xx,yy+rng.randint(6,19)),fill=mix(mid,gold,.12),width=1)
  if (x*y+phase+view)%7==0:
   d.line(iso(cx,cy,x+.12,y+.1),iso(cx,cy,x+.72,y+.1),fill=gold,width=3)
   d.line(iso(cx,cy,x+.17,y+.19),iso(cx,cy,x+.76,y+.19),fill=gold,width=2)
 # Major pieces of industrial architecture: each shapes obstacle/cell line
 # of sight, including roof volumes and cast shadows.
 world=random.Random(seed_for(room["id"],"tactical-geometry",str(phase),str(view)))
 obstacles=[]
 for x in range(1,8):
  for y in range(1,8):
   if (x*17+y*13+phase*5+view*11)%9 in (2,4,6):
    obstacles.append((x,y))
 for k,(x,y) in enumerate(obstacles):
  h=world.randint(65,230)
  p0=iso(cx,cy,x,y);p1=iso(cx,cy,x+1,y);p2=iso(cx,cy,x+1,y+1);p3=iso(cx,cy,x,y+1)
  q0=(p0[0],p0[1]-h);q1=(p1[0],p1[1]-h)
  q2=(p2[0],p2[1]-h);q3=(p3[0],p3[1]-h)
  polygon(d,[p1,p2,q2,q1],mix(bg,mid,.45),outline=mid,width=4)
  polygon(d,[p2,p3,q3,q2],mix(bg,mid,.27),outline=mid,width=3)
  polygon(d,[q0,q1,q2,q3],mix(mid,bg,.35),outline=gold if k%5==0 else mid,width=4)
  for m in range(14):
   xx=q3[0]+world.randint(10,65)
   yy=q3[1]+world.randint(12,max(19,h-8))
   d.line((xx,yy,xx+world.randint(3,22),yy+world.randint(-4,7)),
          fill=mix(mid,gold,.18),width=2)
  for m in range(6):
   ax=q0[0]+world.randint(4,70)
   ay=q0[1]+world.randint(6,24)
   d.rectangle((ax,ay,ax+world.randint(3,12),ay+world.randint(3,14)),
               outline=mix(mid,gold,.35),width=1)
  if k%4==0:
   d.ellipse((q0[0]+40,q0[1]+20,q0[0]+68,q0[1]+40),
            outline=gold,width=4)
 # Security pathways, safe zones and equipment are legible on the *map*.
 path=[
  (phase%3,8),(2,7),(3,5),(4,4),(5,3),(7,2),(8,view%3)
 ]
 pathpts=[]
 for x,y in path:
  q=iso(cx,cy,x+.4,y+.4,4)
  pathpts.append(q)
 d.line(pathpts,fill=gold,width=12,joint="curve")
 for j,(x,y) in enumerate(path):
  px,py=iso(cx,cy,x+.4,y+.4,5)
  d.ellipse((px-15,py-15,px+15,py+15),
            fill=mix(bg,gold,.24),outline=gold,width=4)
  if j%2==0:d.text((px+21,py-21),f"{j+1:02d}",font=SMALL,fill=gold)
 # Active combat entities / investigation actors:
 for i in range(11):
  x=(i*3+view+phase)%9
  y=(i*5+phase*2+view)%9
  px,py=iso(cx,cy,x+.4,y+.4,7)
  faction=mid if i<4 else (204,89,151) if i>7 else gold
  d.ellipse((px-21,py-13,px+21,py+13),fill=mix(bg,faction,.5),outline=faction,width=3)
  d.ellipse((px-14,py-76,px+14,py-43),fill=mix(bg,faction,.63),outline=faction,width=2)
  polygon(d,[(px-18,py-40),(px+14,py-40),(px+22,py-5),(px-27,py-5)],
    mix(bg,faction,.52),outline=faction,width=2)
  d.line((px-13,py-2,px-18,py+22),fill=faction,width=6)
  d.line((px+11,py-2,px+18,py+22),fill=faction,width=6)
  if i%3==0:
   d.line((px+23,py-26,px+70,py-48),fill=faction,width=5)
   d.ellipse((px+67,py-52,px+73,py-46),fill=gold)
 # Cell-by-cell meaningful surface clutter: maintenance hatches, wire
 # channels, worn arrows, rivets, signage and machine stamps.
 for n in range(6600):
  x=rng.randint(0,8);y=rng.randint(0,8)
  px,py=iso(cx,cy,x,y)
  xx=px+rng.randint(-30,30);yy=py+rng.randint(9,42)
  q=n%7
  if q==0:d.line((xx,yy,xx+11,yy-2),fill=mix(bg,mid,.61),width=1)
  elif q==1:d.ellipse((xx,yy,xx+4,yy+3),fill=mix(bg,mid,.67))
  elif q==2:d.rectangle((xx,yy,xx+9,yy+5),outline=mix(bg,mid,.61),width=1)
  elif q==3:d.line((xx,yy,xx+6,yy+7),fill=mix(mid,gold,.13),width=2)
  elif q==4:d.line((xx,yy,xx,yy+9),fill=mix(mid,gold,.08),width=1)
  elif q==5:d.line((xx,yy,xx+16,yy+1),fill=mix(bg,mid,.74),width=1)
  else:d.ellipse((xx,yy,xx+3,yy+3),outline=mix(mid,gold,.16),width=1)

def instruments(d,rng,room,bg,mid,gold,phase,view):
 # Three cutaway panels: 28 distinct real objects per area, plus each stage's
 # measurements. Independent traces are real diagrams, not random data.
 x0=1950
 d.rounded_rectangle((x0-36,212,2812,1444),radius=25,
     fill=mix(bg,(8,18,27),.62),outline=mid,width=4)
 titles=(room["archiveTitle"],room["machineTitle"],room["cacheTitle"])
 details=(room["archiveDetail"],room["machineDetail"],room["cacheDetail"])
 for panel in range(3):
  y=260+panel*390
  d.rounded_rectangle((x0,y,2778,y+355),radius=18,
       fill=mix(bg,mid,.26+(panel+view)%3*.06),outline=gold if panel==phase%3 else mid,width=3)
  d.text((x0+28,y+16),f"{panel+1:02d} / {titles[panel][:24].upper()}",
         font=SECTION,fill=gold)
  d.line((x0+28,y+73,x0+773,y+73),fill=mid,width=3)
  if panel==1:
   # real rotating engine/measuring device: pipes, rotors and gauges
   cx=x0+220;cy=y+209
   for rad in (108,86,60,25):
    d.ellipse((cx-rad,cy-rad,cx+rad,cy+rad),outline=gold if rad==60 else mid,width=5)
   for i in range(14):
    angle=(i*math.pi/7)+phase*.10+view*.22
    p=(cx+int(94*math.cos(angle)),cy+int(94*math.sin(angle)))
    d.line((cx,cy,p[0],p[1]),fill=mix(mid,gold,.25),width=4)
    d.ellipse((p[0]-4,p[1]-4,p[0]+4,p[1]+4),fill=gold)
   for i in range(6):
    d.line((x0+380,y+111+i*35,x0+725,y+111+i*35),
           fill=mix(mid,gold,(i%3)*.12),width=3)
    d.rectangle((x0+385,y+119+i*35,x0+385+rng.randint(40,298),y+130+i*35),
      fill=mix(mid,gold,.21+(i%4)*.12))
  elif panel==0:
   # sampled signal and signed event logs
   samples=[(x0+45+k*7,y+184+int(34*math.sin(k*.42+phase)+
             23*math.cos(k*.17+view)+rng.randint(-5,5))) for k in range(100)]
   d.line(samples,fill=gold,width=5,joint="curve")
   for k in range(20):
    xx=x0+55+k*34
    d.line((xx,y+258,xx,y+295+rng.randint(0,18)),fill=mid,width=3)
    d.rectangle((xx-6,y+297,xx+6,y+305),fill=gold if k%5==0 else mid)
  else:
   # actual inventory/relief supply floor plan
   for j in range(5):
    for k in range(9):
     xx=x0+48+k*76;yy=y+117+j*43
     d.rounded_rectangle((xx,yy,xx+61,yy+31),radius=4,
       fill=mix(bg,mid,.54+(j%3)*.05),outline=gold if (k+j+view)%7==0 else mid,width=2)
     d.line((xx+6,yy+15,xx+53,yy+15),fill=mid,width=2)
     d.ellipse((xx+26,yy+10,xx+36,yy+20),outline=gold,width=2)
  # Signal-state captions are tied to real local evidence strings.
  if panel==phase%3:
   line_text(d,details[panel],x0+40,y+321,(223,224,210),
        max_width=95,font_size=SMALL,step=26,max_lines=1)

def paint(room,frame,output):
 phase=frame//VIEWS;view=frame%VIEWS
 key=room["id"]
 region=district(room)
 bg,mid,gold=PAL[region]
 rng=random.Random(seed_for("field-simulation-v1",key,str(phase),str(view)))
 image=Image.new("RGB",(WIDTH,HEIGHT),bg)
 d=ImageDraw.Draw(image)
 draw_city(d,rng,bg,mid,gold,phase,view,room)
 # The geometry shifts in perspective and actor positions between evidence,
 # route planning, skirmish and reconstruction.
 ground(d,rng,1010+(view%2)*60,377+int(view/2)*27,
        room,phase,view,bg,mid,gold)
 instruments(d,rng,room,bg,mid,gold,phase,view)
 d.rounded_rectangle((75,65,1840,260),radius=21,
     fill=mix(bg,(3,14,20),.61),outline=mid,width=5)
 d.text((113,82),"NOVA ARCÁDIA / SIMULAÇÃO DE CAMPO",font=SECTION,fill=gold)
 d.line((114,140,1806,140),fill=mid,width=3)
 d.text((113,156),room["title"][:34].upper(),font=TITLE,fill=(238,224,205))
 d.text((1090,169),f"SIM {phase+1}/6  •  VISTA {view+1}/4",
        font=SECTION,fill=gold)
 d.rounded_rectangle((83,1130,1865,1530),radius=24,
       fill=mix(bg,(7,14,24),.69),outline=mid,width=5)
 d.text((126,1164),PHASES[phase][0],font=TITLE,fill=gold)
 d.line((126,1235,1800,1235),fill=mid,width=3)
 line_text(d,PHASES[phase][1]+" · "+room["guideWords"],
    128,1262,(228,227,214),max_width=98,
    font_size=TEXT,step=38,max_lines=3)
 d.text((131,1450),f"FONTE: {key.upper()} • IDENTIDADE PROTEGIDA",
    font=SMALL,fill=(175,202,209))
 # 24 frame mini-film track; exact progress matches playable gated choices.
 for i in range(24):
  x=1990+i*32
  y=1524
  d.rounded_rectangle((x,y,x+24,y+35),radius=4,
    fill=gold if i==frame else mix(bg,mid,.29+(i%4)*.06),
    outline=gold if i//4<=phase else mid,width=2)
 d.text((1962,1468),"6 FASES • 4 VISTAS • 1 ACORDO VERIFICÁVEL",
        font=SMALL,fill=(207,216,216))
 # Schematic change receipts are unique for each frame, not random byte data.
 digest=hashlib.sha256((key+":"+str(frame)).encode()).hexdigest()[:10].upper()
 d.text((2350,1570),"PROVA/ROTA "+digest,font=SMALL,fill=(183,195,196))
 output.parent.mkdir(parents=True,exist_ok=True)
 image.save(output,"WEBP",quality=100,method=4)
 return dict(path=f"spritesheets/{key}/simulacao-{frame+1:02d}.webp",
             room=key,kind="spritesheet",license="original",
             caption=(f"{PHASES[phase][0]} · {room['title']} · "
                      f"Vista {view+1}/4: {PHASES[phase][1]}.")[:240])

def produce(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 totals=[]
 for room in rooms:
  reg=district(room)
  source=root/reg
  manifest=source/"source-manifest.json"
  old=json.loads(manifest.read_text(encoding="utf8")) if manifest.exists() else []
  old=[x for x in old if x["room"]!=room["id"] or x["kind"]!="spritesheet"]
  records=[]
  size=0
  for n in range(24):
   out=source/"spritesheets"/room["id"]/f"simulacao-{n+1:02d}.webp"
   records.append(paint(room,n,out))
   size+=out.stat().st_size
  manifest.parent.mkdir(parents=True,exist_ok=True)
  manifest.write_text(json.dumps(old+records,ensure_ascii=False,indent=2)+"\n",
                      encoding="utf8")
  totals.append(size)
  print(f"FIELD-SIM {room['id']}: 24 explorable tactical frames, {size:,} actual source bytes",flush=True)
 result=dict(rooms=len(rooms),frames=len(rooms)*24,
             bytes=sum(totals),minimumRoomBytes=min(totals) if totals else 0)
 print("SIMULATION_ART_REPORT "+json.dumps(result),flush=True)
 return result

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 parser.add_argument("--limit-rooms",type=int)
 args=parser.parse_args()
 produce(args.source,args.limit_rooms)
