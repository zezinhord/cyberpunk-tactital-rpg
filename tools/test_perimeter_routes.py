#!/usr/bin/env python3
"""Test 560 original physically-mapped 2880x1620 patrol frames.

Sample builds one interior; --full enforces exact 28x20 assets and original
bytes above 205 MB. All native app URLs are validated by ZIP builder too.
"""
from __future__ import annotations
import argparse,hashlib,json,tempfile
from collections import defaultdict
from pathlib import Path
from PIL import Image
from generate_v20_illustrations import room_specs
from produce_perimeter_routes import produce,layout,district,WIDTH,HEIGHT,STATIONS,SAFE_ROUTE
MIN_ADDED_BYTES=205_600_000

def inspect(root:Path,rooms:int):
 paths=sorted(root.glob("*/routes/*/patrulha-*.webp"))
 assert len(paths)==rooms*20,(len(paths),rooms)
 seen=set();by_room=defaultdict(list);total=0
 for path in paths:
  raw=path.read_bytes();total+=len(raw)
  assert len(raw)>110_000,(path,len(raw))
  h=hashlib.sha256(raw).hexdigest()
  assert h not in seen,("Duplicate tactical route artwork",path)
  seen.add(h)
  with Image.open(path) as im:
   assert im.format=="WEBP" and im.size==(WIDTH,HEIGHT) and im.mode=="RGB",path
  by_room[path.parent.name].append(path)
 for room,items in by_room.items():
  assert [int(p.stem.rsplit("-",1)[-1]) for p in sorted(items)]==list(range(1,21))
  walls,dangers=layout(room)
  assert not any(p in walls for p in SAFE_ROUTE)
  assert not any(p in walls for p in STATIONS)
  assert not any(p in dangers for p in STATIONS)
 for zone in {district(r) for r in room_specs()[:rooms]}:
  manifest=json.loads((root/zone/"source-manifest.json").read_text(encoding="utf8"))
  chosen=[entry for entry in manifest if entry["kind"]=="route"]
  assert len(chosen)==20*sum(district(r)==zone for r in room_specs()[:rooms])
  for entry in chosen:
   assert entry["license"]=="original" and len(entry["caption"])>=24
   assert (root/zone/entry["path"]).is_file()
 if rooms==28:
  assert total>=MIN_ADDED_BYTES,("Not enough real in-game maps",total,MIN_ADDED_BYTES)
 print(f"PERIMETER_QA: {len(paths)} distinct 2880x1620 isometric patrol maps, "
       f"{len(by_room)} independent floorplans, {total:,} actual original bytes.")
 return total

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--source",type=Path)
 p.add_argument("--full",action="store_true")
 a=p.parse_args()
 if a.full:
  assert a.source is not None and a.source.is_dir()
  inspect(a.source,28)
 else:
  with tempfile.TemporaryDirectory(prefix="na-perimeter-qa-") as directory:
   root=Path(directory)
   produce(root,limit_rooms=1)
   inspect(root,1)
if __name__=="__main__":main()
