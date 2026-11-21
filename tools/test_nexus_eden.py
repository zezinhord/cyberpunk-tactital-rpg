#!/usr/bin/env python3
"""Independent art + geometry QA for all 672 original Operação Nexo panels.
Checks real gameplay coordinates, protected safe corridors, per-room frame
sequences, unique artwork bytes, source licenses, SHA-256 and dimensions.
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
from produce_nexus_eden import generate,NODES,TITLES,W,H,district,plan,guards_at

MIN_FULL_BYTES=295_000_000
def audit(root:Path,num_rooms:int):
 images=sorted(root.glob("*/nexus/*/rele-*.webp"))
 assert len(images)==num_rooms*24,("Nexus missing original images",len(images),num_rooms*24)
 per_room=defaultdict(list);sha_set=set();total=0
 for image in images:
  binary=image.read_bytes()
  assert len(binary)>=130_000,("Insufficient authored content",image,len(binary))
  sha=hashlib.sha256(binary).hexdigest()
  assert sha not in sha_set,("Exact frame duplicated",image)
  sha_set.add(sha)
  with Image.open(image) as im:
   assert im.format=="WEBP" and im.size==(W,H) and im.mode=="RGB",image
  per_room[image.parent.name].append(image)
  total+=len(binary)
 assert len(per_room)==num_rooms
 for room,pictures in per_room.items():
  assert sorted(int(p.stem.rsplit("-",1)[-1]) for p in pictures)==list(range(1,25))
  layout=plan(room)
  assert len(layout["path"])==14 and len(layout["guards"])==3
  coords=[layout["path"][index] for index in NODES]
  assert len(coords)==6 and len(set(coords))==6
  assert all(p not in layout["walls"] for p in coords)
  for tick in range(24):
   sentries=guards_at(layout,tick)
   assert len(sentries)==3
   assert all(p not in layout["walls"] and p not in layout["path"] for p in sentries)
 for district_id in {district(r) for r in room_specs()[:num_rooms]}:
  folder=root/district_id
  manifest=json.loads((folder/"source-manifest.json").read_text(encoding="utf-8"))
  selected=[a for a in manifest if a["kind"]=="nexus"]
  expected=24*sum(district(r)==district_id for r in room_specs()[:num_rooms])
  assert len(selected)==expected,(district_id,len(selected),expected)
  for entry in selected:
   assert entry["license"]=="original"
   assert len(entry["caption"])>=45 and len(entry["caption"])<=240
   assert entry["path"].startswith("nexus/"+entry["room"]+"/")
   assert (folder/entry["path"]).is_file()
 if num_rooms==28:
  assert total>=MIN_FULL_BYTES,("Final art count insufficient",total)
 print(f"NEXUS_ART_QA PASS: {len(images)} original 2880x1620 views, "+
       f"{len(per_room)} playable sites, {total:,} checked bytes")
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
  with tempfile.TemporaryDirectory(prefix="na-nexus-art-") as directory:
   folder=Path(directory)
   generate(folder,limit_rooms=1)
   audit(folder,1)
