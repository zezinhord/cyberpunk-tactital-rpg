#!/usr/bin/env python3
"""Verify 16 original, playable antagonist atlases for seven council defenses."""
import hashlib
import tempfile
from pathlib import Path
from PIL import Image
from generate_council_enemy_art import CW,CH,WAVES,produce
def main():
 with tempfile.TemporaryDirectory(prefix="na-council-sprites-") as temp:
  root=Path(temp)
  report=produce(root)
  assert report["artworks"]==16
  assert report["frames"]==512
  assert len(report["sprites"])==16
  assert len({a["sha256"] for a in report["sprites"]})==16
  assert len(WAVES)==7
  for record in report["sprites"]:
   path=root/record["path"]
   assert path.exists() and path.stat().st_size>=1024
   assert record["license"]=="original"
   with Image.open(path) as img:
    assert img.size==(CW*8,CH*4)
    assert img.mode=="RGBA"
    assert img.getbbox() is not None
    unique_directions=set()
    unique_poses=set()
    for facing in range(8):
     piece=img.crop((facing*CW,0,(facing+1)*CW,CH))
     unique_directions.add(hashlib.sha256(piece.tobytes()).hexdigest())
    for pose in range(4):
     piece=img.crop((0,pose*CH,CW,(pose+1)*CH))
     unique_poses.add(hashlib.sha256(piece.tobytes()).hexdigest())
    assert len(unique_directions)>=5,(record["path"],"repeated directions")
    assert len(unique_poses)>=3,(record["path"],"repeated poses")
 print(f"Original enemy art QA: {report['frames']} frames, 16 unique "
       f"spritesheets, 7 districts, {report['totalBytes']:,} real artwork bytes.")
if __name__=="__main__":
 main()
