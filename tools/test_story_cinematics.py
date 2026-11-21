#!/usr/bin/env python3
"""Verify one full 16-shot original cinematic and safe metadata, then all
448 in production mode. Never accept duplicated frames or source padding."""
from __future__ import annotations
import argparse,hashlib,json,tempfile
from pathlib import Path
from PIL import Image
from produce_story_cinematics import produce,STAGES,room_specs,district,W,H

def inspect(root:Path,expected_rooms:int):
 webps=sorted(root.glob("*/cutscenes/*/quadro-*.webp"))
 assert len(webps)==expected_rooms*len(STAGES),(len(webps),expected_rooms)
 hashes=set()
 locations={}
 size=0
 for file in webps:
  with Image.open(file) as image:
   assert image.format=="WEBP" and image.size==(W,H),file
   assert image.mode=="RGB"
   assert image.getbbox() is not None
  raw=file.read_bytes()
  assert len(raw)>=100_000,(file,len(raw))
  digest=hashlib.sha256(raw).hexdigest()
  assert digest not in hashes,("Repeated cinematic frame",file)
  hashes.add(digest);size+=len(raw)
  locations[file.parent.name]=locations.get(file.parent.name,0)+1
 for name,count in locations.items():
  assert count==len(STAGES),(name,count)
 for zone in {district(room) for room in room_specs()[:expected_rooms]}:
  manifest=json.loads((root/zone/"source-manifest.json").read_text())
  scenes=[a for a in manifest if a["kind"]=="cutscene"]
  assert len(scenes)==len(STAGES)*sum(district(room)==zone
       for room in room_specs()[:expected_rooms])
  for entry in scenes:
   assert entry["license"]=="original"
   assert 20<=len(entry["caption"])<=240
   assert (root/zone/entry["path"]).is_file()
 print(f"Original cinematic QA: {len(webps)} unique full-resolution frames, {size:,} bytes, "
       f"{len(locations)} physical rooms; no duplicated WebP or broken links.")
 return size

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--source",type=Path)
 p.add_argument("--full",action="store_true")
 a=p.parse_args()
 if a.full:
  assert a.source and a.source.is_dir()
  assert inspect(a.source,28)>=300_000_000,"300MB milestone NOT reached"
 else:
  with tempfile.TemporaryDirectory(prefix="na-cinematic-qa-") as tmp:
   root=Path(tmp)
   produce(root,limit_rooms=1)
   inspect(root,1)
if __name__=="__main__":main()
