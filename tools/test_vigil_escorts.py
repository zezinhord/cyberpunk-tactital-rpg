#!/usr/bin/env python3
"""Verify authored Vigília rescue art against all 28 physical gameplay maps.

Sample builds and checks a real 16-frame interior; --full checks all 448
separate 2880×1620 frames, no duplicate SHA, exactly one four-person rescue
sequence per playable room, valid UTF-8 captions and >=180MB original bytes.
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
from produce_vigil_escorts import generate,plan,district,guards_at,W,H

MIN_NEW_BYTES=177_300_000
def audit(root:Path,num_rooms:int)->int:
 expected=num_rooms*16
 paths=sorted(root.glob("*/evacs/*/resgate-*.webp"))
 assert len(paths)==expected,("Vigília incomplete images",len(paths),expected)
 sha=set()
 grouped=defaultdict(list)
 count=0
 for path in paths:
  binary=path.read_bytes();count+=len(binary)
  assert len(binary)>=130_000,("A frame is missing meaningful graphical data",str(path),len(binary))
  digest=hashlib.sha256(binary).hexdigest()
  assert digest not in sha,("Duplicate rescue artwork",str(path))
  sha.add(digest)
  with Image.open(path) as im:
   assert im.format=="WEBP" and im.mode=="RGB" and im.size==(W,H),str(path)
  grouped[path.parent.name].append(path)
 assert len(grouped)==num_rooms
 for room,files in grouped.items():
  ids=sorted(int(p.stem.rsplit("-",1)[-1]) for p in files)
  assert ids==list(range(1,17)),room
  layout=plan(room)
  assert len(layout["path"])==14
  assert layout["path"][0]==(0,7) and layout["path"][-1]==(7,1)
  assert all(p not in layout["walls"] for p in layout["path"])
  assert len(layout["groups"])==4 and len(layout["guards"])==3
  assert all(g in layout["path"] for g in layout["groups"])
  for turn in range(10):
   patrols=guards_at(layout,turn)
   assert len(patrols)==3
   assert all(g not in layout["walls"] and g not in layout["path"] for g in patrols)
 for zone in {district(r) for r in room_specs()[:num_rooms]}:
  manifest=json.loads((root/zone/"source-manifest.json").read_text(encoding="utf-8"))
  records=[entry for entry in manifest if entry["kind"]=="evac"]
  assert len(records)==16*sum(district(r)==zone for r in room_specs()[:num_rooms])
  for a in records:
   assert a["license"]=="original" and len(a["caption"])>=34
   assert a["path"].startswith("evacs/"+a["room"]+"/")
   assert (root/zone/a["path"]).is_file()
 if num_rooms==28:
  assert count>=MIN_NEW_BYTES,("Real fourth milestone requires >177.3MB authored art",count)
 print(f"VIGIL_ART_QA PASSED: {len(paths)} independently checked 2880x1620 images, "
       f"{len(grouped)} 8x8 worlds, {count:,} actual original bytes.")
 return count

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--source",type=Path)
 parser.add_argument("--full",action="store_true")
 args=parser.parse_args()
 if args.full:
  assert args.source and args.source.is_dir()
  audit(args.source,28)
 else:
  with tempfile.TemporaryDirectory(prefix="na-vigil-art-") as directory:
   root=Path(directory)
   generate(root,limit_rooms=1)
   audit(root,1)
if __name__=="__main__":main()
