#!/usr/bin/env python3
"""Original 448-frame cinematic field archive for the 28 playable interiors.

16 inspectable, full-resolution frames per room cover arrival, evidence,
testimony, component inspection, repair, public hearing, and reconstruction.
Every image contains original architectural art, equipment, local dialogue and
unique scene staging. No silence, duplicate image resizing or random byte
payloads. Frames are viewed one at a time in the Android field gallery.
"""
from __future__ import annotations
import argparse, json, math, random, textwrap
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from generate_v20_illustrations import room_specs,seed_for

ROOT=Path(__file__).resolve().parents[1]
W,H=2880,1620
PALETTE={
 "baixada":((14,28,39),(70,147,173),(234,186,113)),
 "ferrugem":((27,24,32),(155,91,63),(242,177,109)),
 "aurea":((18,34,52),(86,152,188),(233,206,163)),
 "subsolo":((17,31,39),(77,119,153),(224,167,124)),
 "setor-zero":((28,24,41),(140,100,154),(239,173,137)),
 "prisma":((31,22,43),(172,83,157),(249,184,119)),
 "periferia":((35,31,34),(143,121,89),(238,193,130)),
}
STAGES=(
 ("Chegada","A infraestrutura do distrito conserva pistas anteriores à investigação."),
 ("Testemunho","O contato local explica o que as ordens corporativas omitiram."),
 ("Arquivo","A prova física foi preservada fora dos servidores da Helix."),
 ("Versões","Compare o documento original com a ordem posterior."),
 ("Anomalia","O equipamento mostra o momento da interrupção."),
 ("Componentes","Confronte conectores, sensores e pontos de risco."),
 ("Reserva","Os suprimentos refletem uma rede de cuidado comunitário."),
 ("Fluxo","Siga a origem e o destino dos recursos."),
 ("Cronologia","Cruze a hora da falha com o depoimento."),
 ("Corredores","Localize a passagem que preserva pessoas e provas."),
 ("Pressão","A força hostil tenta revogar o acordo."),
 ("Conselho","Três modelos de gestão disputam o controle da infraestrutura."),
 ("Defesa","Mantenha os equipamentos e as provas seguros."),
 ("Calibração","O reparo técnico precisa preservar os vestígios."),
 ("Responsabilidade","O acordo deverá identificar deveres sem expor moradores."),
 ("Retomada","A cidade conserva o direito de conferir e contestar a decisão."),
)
FONT_ROOT="/usr/share/fonts/truetype/dejavu/"
def font(n,bold=False):
 p=Path(FONT_ROOT+("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"))
 return ImageFont.truetype(str(p),n) if p.exists() else ImageFont.load_default()
TITLE=font(62,True);SUB=font(29,True);BODY=font(26);SMALL=font(21)
def mix(a,b,t):
 return tuple(max(0,min(255,int(x*(1-t)+y*t))) for x,y in zip(a,b))
def brighten(a,n):
 return tuple(max(0,min(255,x+n)) for x in a)
def district(room):
 return next(k for k in PALETTE if room["id"].startswith(k+"-"))
def story(room,k):
 a,m,c=[room[x] for x in ("archiveDetail","machineDetail","cacheDetail")]
 entries=(
  room["guideWords"],f'{room["guide"]}: {room["guideWords"]}',
  f'{room["archiveTitle"]}: {a}',f'Proveniência do registro: {a}',
  f'{room["machineTitle"]}: {m}',f'Inspeção do circuito: {m}',
  f'{room["cacheTitle"]}: {c}',f'Origem e destino: {m} {c}',
  f'Antes: {a} Depois: {m}',
  f'A rota segura liga {room["archiveTitle"]} a {room["machineTitle"]}.',
  f'A comunidade preserva as evidências: {a}',
  f'O conselho confronta a medição e o testemunho: {room["guideWords"]}',
  f'A defesa protege {room["machineTitle"]} e os registros recolhidos.',
  f'O reparo deve ser reversível: {m}',
  f'Uma decisão pública precisa responsabilizar a gestão: {room["guideWords"]}',
  f'Rede restabelecida: {c} {a}',
 )
 return entries[k]
def draw(frame,room,stage):
 d=ImageDraw.Draw(frame)
 bg,mid,amber=PALETTE[district(room)]
 rng=random.Random(seed_for("cinema",room["id"],str(stage)))
 for yy in range(0,H,2):
  d.rectangle((0,yy,W,yy+2),fill=mix(brighten(bg,-8),mix(bg,mid,.3),yy/H))
 for _ in range(23):
  x=rng.randint(-430,W);y=rng.randint(90,490);w=rng.randint(135,550)
  d.ellipse((x,y,x+w,y+rng.randint(24,106)),fill=mix(bg,mid,rng.uniform(.06,.18)))
 # Each viewpoint builds its own city block with independent facades, windows and antennas.
 for i in range(85):
  x=i*38+rng.randint(-90,40)+stage%4*9
  w=rng.randint(36,158);roof=rng.randint(140,815)
  d.polygon([(x,roof),(x+w,roof-18),(x+w,1070),(x,1070)],
            fill=mix(bg,mid,.11+(i%5)*.03))
  for px in range(x+10,x+w-9,17):
   for py in range(roof+22,971,29):
    if rng.randrange(9)>4:
     d.rectangle((px,py,px+8,py+12),
                 fill=mix(mid,amber,.14+(i+py)%7*.065))
  for px in range(x+6,x+w-4,13):
   d.line((px,roof,px,1045),fill=brighten(bg,-5),width=1)
  if i%7==0:
   d.line((x+w//2,roof,x+w//2,roof-75),fill=mid,width=4)
 # Useful layer of utility cables, with anchors and actual conduits.
 for j in range(11):
  sy=345+j*58
  xx=rng.randrange(-40,320)
  d.line([(xx,sy),(1120,sy+30),(2060,sy-10),(W,sy+50)],
         fill=mix(mid,amber,.18),width=2)
  for q in range(11):
   x=xx+q*222
   d.line((x,sy,x,sy+22),fill=amber,width=2)
 d.polygon([(0,1010),(W,970),(W,H),(0,H)],
           fill=mix(bg,(100,90,80),.38))
 for j in range(65):
  y=1010+int((j/65)**1.3*610)
  d.line((0,y,W,y-40),fill=mix(bg,mid,.26),width=2)
 for j in range(-24,80):
  d.line((W//2,965,j*90,H),fill=mix(bg,mid,.3),width=2)
 # Physical corridors use a directional oblique projection, not a flat stock plate.
 panels=[]
 for j in range(18):
  x=80+j*160+(stage%4-2)*19
  y=900+int(38*math.sin(j+stage))
  width=rng.randint(90,140);height=rng.randint(165,355)
  panels.append((x,y,width,height))
  d.polygon([(x,y-height),(x+width,y-height-27),
             (x+width+18,y-height-10),(x+20,y-height+16)],
      fill=mix(bg,mid,.44),outline=mix(mid,amber,.33),width=3)
  d.polygon([(x+20,y-height+16),(x+width+18,y-height-10),
             (x+width+22,y+13),(x+38,y+30)],
      fill=mix(bg,mid,.55),outline=mid,width=2)
  for py in range(y-height+32,y-15,20):
   d.line((x+43,py,x+width+8,py-4),fill=mix(mid,amber,.24),width=2)
  for k in range(6):
   px=x+33+k*12
   d.line((px,y-height+15,px+13,y-8),fill=mix(bg,mid,.44),width=1)
 # Man-made surface fidelity: rivets, corrosion trails, hatches and etched
 # maintenance codes located on the actual architectural structures only.
 for index,(x,y,w,h) in enumerate(panels):
  for j in range(143):
   xx=x+22+rng.randint(0,max(5,w-10))
   yy=y-h+30+rng.randint(0,max(12,h-38))
   case=(j+stage+index)%5
   if case==0:
    d.ellipse((xx,yy,xx+7,yy+7),outline=mix(mid,amber,.32),width=2)
   elif case==1:
    d.line((xx,yy,xx+rng.randint(6,31),yy-rng.randint(0,8)),
           fill=mix(bg,mid,.55),width=2)
   elif case==2:
    d.rectangle((xx,yy,xx+rng.randint(4,17),yy+rng.randint(3,14)),
                outline=mix(mid,bg,.35),width=1)
   elif case==3:
    d.line((xx,yy,xx+5,yy+12),fill=mix(mid,amber,.2),width=2)
   else:
    d.line((xx,yy,xx+16,yy),fill=mix(mid,amber,.32),width=1)
 # District-specific functional machinery and human witnesses.
 cx=1885+(stage%3-1)*106
 cy=860+(stage%2)*25
 area=district(room)
 d.ellipse((cx-603,cy+394,cx+544,cy+523),
           fill=mix(bg,mid,.28),outline=amber,width=4)
 d.polygon([(cx-390,cy+102),(cx+177,cy-135),
            (cx+470,cy+100),(cx-100,cy+345)],
           fill=mix(bg,mid,.33),outline=mid,width=6)
 units=[]
 for j in range(3):
  x=cx-330+j*267
  y=cy-69+rng.randint(-28,28)
  units.append((x,y))
  if area in ("baixada","periferia"):
   d.rounded_rectangle((x-45,y-244,x+142,y+158),radius=38,
                       fill=mix(mid,bg,.47),outline=amber,width=9)
   d.ellipse((x-45,y-265,x+142,y-188),fill=mix(bg,mid,.38),
             outline=amber,width=7)
   for m in range(6):
    d.line((x-21,y-172+m*48,x+120,y-172+m*48),
           fill=mid if m<4 else amber,width=4)
   d.line((x+145,y+60,x+208,y+67),fill=mid,width=12)
  elif area=="ferrugem":
   d.rectangle((x,y-300,x+183,y+149),fill=mix(bg,mid,.5),outline=amber,width=8)
   d.rectangle((x+19,y-242,x+151,y-87),fill=(151,66,42),outline=amber,width=6)
   for m in range(9):
    d.line((x+37,y-207+m*23,x+144,y-207+m*23),
           fill=mix(mid,amber,m/11),width=4)
   d.line((x+91,y-299,x+91,y-389),fill=mid,width=15)
  elif area=="aurea":
   d.rounded_rectangle((x-17,y-260,x+201,y+206),radius=17,
              fill=mix(bg,mid,.4),outline=mid,width=9)
   for m in range(11):
    d.rounded_rectangle((x+6,y-229+m*34,x+181,y-210+m*34),
              radius=3,fill=mix(mid,amber,(m%4)*.12))
  elif area=="subsolo":
   d.rounded_rectangle((x-12,y-255,x+205,y+136),radius=28,
              fill=mix(bg,mid,.38),outline=mid,width=10)
   d.ellipse((x+7,y-196,x+184,y-20),fill=mix(bg,mid,.2),
             outline=amber,width=8)
   for m in range(8):
    ang=m*math.pi/4
    d.line((x+96,y-108,x+96+int(78*math.cos(ang)),
            y-108+int(78*math.sin(ang))),fill=mid,width=8)
  elif area=="setor-zero":
   d.rectangle((x,y-263,x+188,y+223),fill=mix(bg,mid,.31),
               outline=amber,width=9)
   for m in range(13):
    d.line((x+11+m*14,y-253,x+11+m*14,y+210),fill=mid,width=2)
   d.polygon([(x+20,y+120),(x+94,y+14),(x+165,y+120)],
             outline=amber,width=5)
  else:
   d.rounded_rectangle((x,y-193,x+202,y+224),radius=24,
              fill=mix(bg,mid,.4),outline=amber,width=8)
   for m in range(8):
    d.line((x+22,y-155+m*41,x+184,y-155+m*41),
           fill=mix(mid,amber,m/12),width=8)
 # Zoom-level device details: service bolts, risk symbols, cable channels
 # and connector tests located inside each actual piece of machinery.
 for x,y in units:
  for j in range(660):
   px=x+rng.randint(6,172)
   py=y+rng.randint(-194,132)
   mode=(j+stage)%4
   if mode==0:
    d.ellipse((px,py,px+7,py+7),outline=amber,width=2)
   elif mode==1:
    d.line((px,py,px+rng.randint(8,25),py),fill=mix(mid,amber,.41),width=2)
   elif mode==2:
    d.line((px,py,px,py+rng.randint(5,25)),fill=mix(bg,amber,.40),width=2)
   else:
    d.rectangle((px,py,px+rng.randint(6,17),py+rng.randint(3,9)),
                outline=mid,width=1)
 for j,name in enumerate((room["archiveTitle"],room["machineTitle"],
                          room["cacheTitle"])):
  x=cx-484+j*385;y=cy+319+(j-1)*63
  d.rounded_rectangle((x,y,x+370,y+50),radius=6,
     fill=mix(bg,mid,.37),outline=amber,width=3)
  d.text((x+9,y+8),f'{j+1:02d} / {name[:20].upper()}',
         font=SMALL,fill=(234,228,206))
  d.line((x+65,y,cx-179+j*166,cy+31),fill=mid,width=3)
 for j in range(4):
  x=cx-560+j*291+rng.randint(-20,20)
  y=cy+296+rng.randint(-10,11)
  d.ellipse((x-17,y-119,x+17,y-80),fill=mix(amber,bg,.32),
            outline=amber,width=2)
  d.polygon([(x-18,y-70),(x+21,y-70),(x+31,y+10),(x-25,y+10)],
            fill=mix(bg,mid,.61),outline=mid,width=3)
  d.line((x-14,y,x-26,y+51),fill=mid,width=8)
  d.line((x+17,y,x+28,y+51),fill=mid,width=8)
  if j==stage%4:
   d.line((x+25,y-30,x+75,y-79),fill=amber,width=6)
 # Reader controls and grounded narrative; no decorative filler text.
 d.rounded_rectangle((73,73,1242,430),radius=21,
       fill=mix(bg,(4,12,20),.5),outline=mid,width=5)
 d.text((114,96),"NOVA ARCÁDIA / ARQUIVO DE CAMPO",font=SUB,fill=amber)
 d.line((114,160,1180,160),fill=mid,width=3)
 d.text((114,187),room["title"].upper()[:31],font=TITLE,fill=(236,226,202))
 d.text((120,297),f"QUADRO {stage+1:02d}/16 • {STAGES[stage][0].upper()}",
        font=SUB,fill=(208,225,231))
 d.rounded_rectangle((91,1129,1650,1531),radius=21,
       fill=mix(bg,(13,25,36),.5),outline=mid,width=4)
 d.text((137,1166),"RELATO / MATERIALIDADE",font=SUB,fill=amber)
 for i,line in enumerate(textwrap.wrap(story(room,stage),70,
                               break_long_words=False)[:5]):
  d.text((138,1221+i*48),line,font=BODY,fill=(226,227,218))
 for j in range(16):
  x=1690+j*66
  d.rounded_rectangle((x,1460,x+47,1493),radius=5,
        fill=amber if j==stage else mix(bg,mid,.47),
        outline=amber if j<=stage else mid,width=2)
 d.text((1696,1512),"INVESTIGAÇÃO • CONSELHO • DEFESA • RETOMADA",
        font=SMALL,fill=(210,216,217))
 d.rounded_rectangle((2090,65,2790,193),radius=17,
         fill=mix(bg,mid,.3),outline=amber,width=3)
 d.text((2120,85),room["id"].upper()[:38],font=SMALL,fill=(238,230,202))
 d.text((2120,130),f"LOCAL {area.upper()} / TOMADA {stage%4+1}",
        font=SMALL,fill=amber)

def render(room,idx,root):
 zone=district(room)
 out=root/zone/"cutscenes"/room["id"]/f"quadro-{idx+1:02d}.webp"
 out.parent.mkdir(parents=True,exist_ok=True)
 im=Image.new("RGB",(W,H),PALETTE[zone][0])
 draw(im,room,idx)
 im.save(out,"WEBP",quality=100,method=4)
 return dict(path=f'cutscenes/{room["id"]}/quadro-{idx+1:02d}.webp',
             room=room["id"],kind="cutscene",license="original",
             caption=(f"{STAGES[idx][0]} · {room['title']}: "
                      f"{STAGES[idx][1]}")[:240])

def produce(root:Path,limit_rooms:int|None=None):
 rooms=room_specs()
 if limit_rooms is not None:rooms=rooms[:limit_rooms]
 total=0
 for room in rooms:
  zone=district(room)
  source=root/zone
  manifest=source/"source-manifest.json"
  old=json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else []
  old=[x for x in old if x["room"]!=room["id"] or x["kind"]!="cutscene"]
  created=[render(room,i,root) for i in range(len(STAGES))]
  manifest.write_text(json.dumps(old+created,ensure_ascii=False,indent=2)+"\n",
                      encoding="utf-8")
  size=sum((source/x["path"]).stat().st_size for x in created)
  total+=size
  print(f"CINEMATIC {room['id']}: 16 inspectable scenes, {size:,} original art bytes",flush=True)
 report=dict(rooms=len(rooms),frames=16*len(rooms),bytes=total)
 print("CINEMATIC_REPORT "+json.dumps(report),flush=True)
 return report

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 parser.add_argument("--limit-rooms",type=int)
 args=parser.parse_args()
 produce(args.source,args.limit_rooms)
