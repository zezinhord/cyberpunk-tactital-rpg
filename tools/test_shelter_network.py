#!/usr/bin/env python3
"""Validate 560 independently drawn shelter stage plates with live map semantics.
No counted image is unused or duplicated; optional single-room smoke generation.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import tempfile
from collections import defaultdict
from pathlib import Path
from PIL import Image
from generate_v20_illustrations import room_specs
from produce_shelter_network import generate,district,STAGE_NAMES,W,H,GOALS,layout
def audit(root:Path,num_rooms:int)->int:
 paths=sorted(root.glob("*/shelters/*/abrigo-*.webp"))
 assert len(paths)==num_rooms*20,(len(paths),num_rooms*20)
 shas=set()
 grouped=defaultdict(list)
 total=0
 for path in paths:
  data=path.read_bytes()
  assert len(data)>130_000,("Visual plate lacks scene information",path,len(data))
  sha=hashlib.sha256(data).hexdigest()
  assert sha not in shas,("Duplicated illustration",path)
  shas.add(sha)
  with Image.open(path) as im:
   assert im.format=="WEBP" and im.mode=="RGB" and im.size==(W,H),(path,im.size)
  total+=len(data)
  grouped[path.parent.name].append(path)
 assert len(grouped)==num_rooms
 for room,items in grouped.items():
  assert sorted(int(p.stem.rsplit("-",1)[-1]) for p in items)==list(range(1,21))
  walls,_hazards=layout(room)
  assert all(p not in walls for p in GOALS),"Live intervention blocked in artwork"
  assert room.startswith(tuple(d+"-" for d in STAGE_NAMES))
 for area in {district(x) for x in room_specs()[:num_rooms]}:
  src=root/area/"source-manifest.json"
  entries=json.loads(src.read_text())
  shelters=[a for a in entries if a["kind"]=="shelter"]
  assert len(shelters)==20*sum(district(x)==area for x in room_specs()[:num_rooms])
  for asset in shelters:
   assert asset["license"]=="original"
   assert len(asset["caption"])>=45 and len(asset["caption"])<=240
   assert asset["path"].startswith("shelters/"+asset["room"]+"/")
   assert (root/area/asset["path"]).is_file()
 if num_rooms==28:
  # The next signed 300 MB milestone is gated independently by actual ZIP bytes.
  assert total>=202_707_277,("Art does not yet reach next published milestone",total)
 print(f"REFÚGIO ART QA: {len(paths)} original 2880x1620 plates, "+
       f"{len(grouped)} locations, {total:,} verified new bytes")
 return total
if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--source",type=Path)
 p.add_argument("--full",action="store_true")
 args=p.parse_args()
 if args.full:
  assert args.source and args.source.is_dir()
  audit(args.source,28)
 else:
  with tempfile.TemporaryDirectory(prefix="na-refugio-art-") as folder:
   root=Path(folder)
   generate(root,limit_rooms=1)
   audit(root,1)
