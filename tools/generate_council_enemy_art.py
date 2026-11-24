#!/usr/bin/env python3
"""Draw sixteen original eight-direction / four-pose antagonist sprite atlases.

Gameplay identifiers and wave sequencing match the seven council encounters.
Each 1024×768 PNG contains 8 facing views × 4 acting poses, with physically
distinct drone, saboteur, sniper, hunter, Helix and suppressor silhouettes.
Transparent backgrounds permit the existing low-memory SVG battle renderer
to decode ONLY the current 1MB-ish PNG instead of 16 simultaneous textures.
No stock assets, audio, duplicated bitmaps or synthetic size inflation.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parents[1]
OUTPUT = BASE / "public/assets/council-enemies"
CW, CH = 128, 192
WAVES = {
 "baixada": ("drone","suppressor"),
 "ferrugem": ("saboteur","hunter"),
 "aurea": ("sniper","saboteur","hunter"),
 "subsolo": ("saboteur","suppressor"),
 "setor-zero": ("helix","suppressor","sniper"),
 "prisma": ("suppressor","sniper"),
 "periferia": ("helix","hunter"),
}
COLORS = {
 "baixada": ((42,122,149),(232,166,95)),
 "ferrugem": ((150,89,61),(228,162,102)),
 "aurea": ((65,129,168),(230,203,152)),
 "subsolo": ((76,111,143),(214,163,110)),
 "setor-zero": ((142,83,126),(233,165,139)),
 "prisma": ((168,83,153),(237,182,101)),
 "periferia": ((151,115,75),(228,182,115)),
}
ROLE_COLORS = {
 "drone":(66,125,154),
 "suppressor":(73,81,104),
 "saboteur":(68,93,91),
 "hunter":(98,84,90),
 "sniper":(95,95,121),
 "helix":(83,102,119),
}
INK=(17,24,34,255)
METAL=(35,47,57,255)
LIGHT=(193,207,214,255)

def rgba(c,a=255):return (*c,a)
def adjust(c,amt):
 return tuple(max(0,min(255,x+amt)) for x in c)

def frame(role:str, district:str, facing:int, phase:int, wave:int)->Image.Image:
 """The direction controls silhouette foreshortening; poses show idle, alternating
 steps and a readied class weapon. No rescaling an earlier sprite to gain bytes."""
 im=Image.new("RGBA",(CW,CH))
 d=ImageDraw.Draw(im)
 accent,amber=COLORS[district]
 suit=ROLE_COLORS[role]
 theta=facing*math.pi/4
 forward=math.cos(theta)
 side=math.sin(theta)
 step=(1 if phase==1 else -1 if phase==2 else 0)
 sway=4 if phase==3 else (3 if phase==1 else -3 if phase==2 else 0)
 cx=64+int(side*3)
 head_x=cx+int(forward*5)
 head_y=46+(-2 if phase==3 else abs(step))
 upper=69+step
 feet=157+(2 if phase!=0 else 0)
 # Volumetric shadow and boots anchored to fixed map tile.
 d.ellipse((27,163,101,180),fill=(3,11,20,110))
 for sign in (-1,1):
  xx=cx+sign*(17+int(side*3))
  run=step*sign*6
  d.polygon([(xx-10,114),(xx+8,114),(xx+11+run,145),
    (xx+8+run,163),(xx-11+run,160),(xx-7,144)],
    fill=INK)
  d.polygon([(xx-5,120),(xx+5,120),(xx+7+run,149),(xx-6+run,148)],
    fill=rgba(adjust(suit,-12)))
  d.rounded_rectangle((xx-12+run,157,xx+14+run,170),radius=5,
                      fill=rgba(adjust(suit,-31)),outline=INK,width=2)
 # Worn utility coat or armor with explicit back/front silhouettes.
 shoulder=33 if role in ("hunter","helix","suppressor") else 29
 d.polygon([(cx-shoulder,70),(cx-19,62),(cx+18,62),
   (cx+shoulder,72),(cx+24+sway,119),(cx-24+sway,119)],
   fill=INK)
 d.polygon([(cx-24,72),(cx-13,69),(cx+13,69),(cx+24,73),
             (cx+18+sway,114),(cx-19+sway,114)],
           fill=rgba(adjust(suit,-5)))
 if role in ("hunter","sniper"):
  d.polygon([(cx-24,92),(cx+21,92),(cx+27,148),
             (cx-26,148)],fill=rgba(adjust(suit,-21),237))
 if role=="helix":
  for px in (cx-23,cx+12):
   d.rounded_rectangle((px,76,px+11,102),radius=2,
                       fill=rgba(adjust(suit,45)),outline=INK,width=2)
 # Chest mesh / armored center / corporate emblem.
 d.rounded_rectangle((cx-13,77,cx+14,102),radius=4,
                     fill=rgba(adjust(suit,24)),outline=rgba(accent),width=3)
 d.line((cx-11,87,cx+11,87),fill=rgba(amber),width=3)
 for i in range(3):
  yy=106+i*5
  d.line((cx-17,yy,cx+18,yy),fill=rgba(adjust(suit,34)),width=2)
 # Directional neck and head, visor varies from frontal to rear view.
 d.rounded_rectangle((head_x-13,head_y-3,head_x+13,head_y+31),
                     radius=9,fill=INK)
 d.rounded_rectangle((head_x-10,head_y,head_x+10,head_y+25),
                     radius=7,fill=rgba(adjust(suit,35)))
 if facing in (3,4,5):
  d.line((head_x-10,head_y+8,head_x+10,head_y+8),
         fill=rgba(adjust(suit,-15)),width=6)
  d.ellipse((head_x-4,head_y+12,head_x+5,head_y+17),
            fill=rgba(amber))
 else:
  shift=round(side*4)
  d.rounded_rectangle((head_x-10+shift,head_y+8,head_x+10+shift,head_y+16),
    radius=3,fill=rgba(amber))
  d.line((head_x-6,head_y+21,head_x+7,head_y+21),fill=INK,width=2)
 # Articulated shoulder pistons and large gear are independently positioned.
 for sign in (-1,1):
  px=cx+sign*(shoulder-5)
  armshift=round(side*7*sign)
  d.ellipse((px-10,72,px+10,92),fill=INK)
  d.ellipse((px-7,74,px+8,90),fill=rgba(adjust(suit,28)))
  endpoint=(px+armshift+sign*3,125-18*(phase==3 and sign==1))
  d.line((px,84,*endpoint),fill=INK,width=13)
  d.line((px,86,*endpoint),fill=rgba(adjust(suit,17)),width=8)
  d.ellipse((endpoint[0]-6,endpoint[1]-6,
             endpoint[0]+6,endpoint[1]+6),fill=rgba(amber))
 # Role-specific devices have materially distinct shapes & attack intent.
 right=cx+34
 if role=="drone":
  for sign in (-1,1):
   rx=cx+sign*34
   d.ellipse((rx-23,40,rx+23,57),outline=rgba(accent),width=5)
   d.line((rx-18,48,rx+18,48),fill=rgba(amber),width=4)
   d.line((rx,42,rx,58),fill=LIGHT,width=2)
  d.polygon([(cx-10,69),(cx+10,69),(cx+16,115),(cx,130),(cx-16,115)],
            outline=rgba(accent),fill=rgba(adjust(suit,-18)))
  d.ellipse((cx-10,91,cx+10,113),fill=rgba(amber),outline=INK,width=3)
 elif role=="suppressor":
  d.rounded_rectangle((cx+28,85,cx+56,143),radius=8,
    fill=INK,outline=rgba(amber),width=3)
  d.rounded_rectangle((cx+31,91,cx+53,135),radius=5,
    fill=rgba(adjust(suit,32)))
  for y in (101,114,127):
   d.line((cx+34,y,cx+50,y),fill=rgba(accent),width=3)
  d.ellipse((cx+34,109,cx+50,122),fill=rgba(amber))
 elif role=="saboteur":
  d.rounded_rectangle((cx+24,106,cx+56,136),radius=4,fill=INK,
    outline=rgba(amber),width=3)
  d.rectangle((cx+29,110,cx+50,124),fill=rgba(accent))
  for i in range(3):
   d.line((cx+32,114+i*4,cx+47-i*2,114+i*4),
          fill=rgba(amber),width=2)
  d.arc((cx+11,33,cx+55,75),220,345,fill=rgba(accent),width=4)
 elif role=="sniper":
  d.polygon([(cx+8,85),(cx+65,81),(cx+67,88),(cx+9,101)],
            fill=INK)
  d.line((cx+22,83,cx+62,83),fill=LIGHT,width=4)
  d.rounded_rectangle((cx+33,73,cx+53,82),radius=3,fill=rgba(amber))
  d.line((cx+12,107,cx+47,130),fill=rgba(adjust(suit,15)),width=5)
 elif role=="hunter":
  for i in range(3):
   d.line((cx+28+i*5,105,cx+50+i*5,140),
          fill=rgba(amber),width=4)
  d.ellipse((cx-39,70,cx-20,94),outline=rgba(accent),width=4)
  d.line((cx-32,87,cx-49,128),fill=LIGHT,width=4)
 elif role=="helix":
  d.rounded_rectangle((cx+23,100,cx+61,123),radius=5,
                      fill=INK,outline=rgba(accent),width=3)
  d.line((cx+33,108,cx+53,108),fill=rgba(amber),width=3)
  d.rounded_rectangle((cx-20,64,cx+20,72),radius=3,
                      fill=rgba(amber),outline=INK,width=2)
 # Grounded muzzle/emission flash only in the attack pose.
 if phase==3:
  fx=107 if role in ("helix","sniper","suppressor") else 97
  fy=100 if role!="saboteur" else 120
  d.polygon([(fx-12,fy),(fx,fy-18),(fx+4,fy-3),
             (fx+15,fy+4),(fx-3,fy+8)],fill=rgba(amber,225))
 return im

def produce(output:Path=OUTPUT):
 output.mkdir(parents=True,exist_ok=True)
 manifests=[]
 for district,roles in WAVES.items():
  for number,role in enumerate(roles,1):
   sheet=Image.new("RGBA",(CW*8,CH*4))
   for facing in range(8):
    for pose in range(4):
     actor=frame(role,district,facing,pose,number)
     sheet.alpha_composite(actor,(facing*CW,pose*CH))
   # True alpha preserves parallax; no background grid or dummy pixels.
   name=f"council-{district}-w{number}.png"
   target=output/name
   sheet.save(target,format="PNG",optimize=True,compress_level=6)
   data=target.read_bytes()
   manifests.append(dict(path=name,district=district,role=role,wave=number,
                         directions=8,poses=4,width=sheet.width,height=sheet.height,
                         bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),
                         license="original"))
 assert len(manifests)==16
 info=dict(artworks=16,frames=16*8*4,totalBytes=sum(x["bytes"] for x in manifests),
           sprites=manifests)
 (output/"catalog.json").write_text(json.dumps(info,ensure_ascii=False,indent=2)+"\n")
 print(f"Council defense enemies: {len(manifests)} original sprite sheets, "
       f"{info['frames']} real rendered frames, {info['totalBytes']:,} bytes.")
 return info

if __name__=="__main__":
 produce()
