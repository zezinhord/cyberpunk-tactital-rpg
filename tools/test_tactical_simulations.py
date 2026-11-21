#!/usr/bin/env python3
"""Inspect 672 original playable isometric mission frames and SHA-256 paths.

The content gate rejects duplicated images, wrong aspect ratios, missing world
locations, missing phase viewpoints and a second +300MB claim backed only by
source files or test-only fixtures. Run --full ONLY after all 28 rooms exist.
"""
from __future__ import annotations
import argparse,hashlib,json,tempfile
from collections import defaultdict
from pathlib import Path
from PIL import Image
from generate_v20_illustrations import room_specs
from produce_tactical_simulations import produce,WIDTH,HEIGHT,PHASES,VIEWS,district
MIN_NEW_SOURCE_BYTES=300_500_000
def inspect(root:Path,count:int):
 files=sorted(root.glob("*/spritesheets/*/simulacao-*.webp"))
 expected=count*len(PHASES)*VIEWS
 assert len(files)==expected,("Missing playable simulation frames",len(files),expected)
 seen=set(); per_room=defaultdict(list); total=0
 for file in files:
  raw=file.read_bytes();total+=len(raw)
  assert len(raw)>=90_000,("Frame lacks authored details",file,len(raw))
  h=hashlib.sha256(raw).hexdigest()
  assert h not in seen,("Duplicated tactical field plate",file)
  seen.add(h)
  with Image.open(file) as im:
   assert im.format=="WEBP" and im.size==(WIDTH,HEIGHT) and im.mode=="RGB",file
   assert im.getbbox() is not None
  per_room[file.parent.name].append(file)
 for room,paths in per_room.items():
  assert len(paths)==24 and [int(p.stem.split("-")[-1]) for p in paths]==list(range(1,25)),room
 for zone in {district(x) for x in room_specs()[:count]}:
  manifest=json.loads((root/zone/"source-manifest.json").read_text(encoding="utf8"))
  sim=[x for x in manifest if x.get("kind")=="spritesheet"]
  assert len(sim)==24*sum(district(x)==zone for x in room_specs()[:count])
  for entry in sim:
   assert entry["license"]=="original"
   assert 22<=len(entry["caption"])<=240
   assert (root/zone/entry["path"]).is_file()
 if count==28:
  assert total>=MIN_NEW_SOURCE_BYTES,("Real +300MB art milestone not met",total)
 print(f"FIELD_SIMULATION_QA: {len(files)} distinct original 2880x1620 views; "
       f"28-room full actual source bytes: {total:,}; physical rooms: {len(per_room)}.")
 return total
def main():
 cli=argparse.ArgumentParser()
 cli.add_argument("--source",type=Path)
 cli.add_argument("--full",action="store_true")
 args=cli.parse_args()
 if args.full:
  assert args.source and args.source.is_dir()
  inspect(args.source,28)
 else:
  with tempfile.TemporaryDirectory(prefix="na-sim-qa-") as directory:
   root=Path(directory)
   produce(root,limit_rooms=1)
   inspect(root,1)
if __name__=="__main__":main()
