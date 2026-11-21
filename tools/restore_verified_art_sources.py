#!/usr/bin/env python3
"""Restore 3136 independently audited Nova Arcádia source artworks from 7 ZIPs.

This is a byte-for-byte *verified* bridge from a successful SHA-256 art
production workflow to the final 3GB build. It never regenerates, re-encodes,
pads or copies an existing image under a second identity. Every ZIP and
member hash, file path, dimensions and source manifest line is checked before
extraction. Expands only into app-owned local build staging, not users' files.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import zipfile
from io import BytesIO
from PIL import Image
from collections import Counter
from pathlib import Path
from build_3gb_asset_packs import APPROVED_DISTRICTS,PATH_RE,rooms_by_district

ROOT=Path(__file__).resolve().parents[1]
SHA=re.compile(r"^[a-f0-9]{64}$")
MAX_ASSET=70_000_000
EXPECTED_PER_DISTRICT={
 "mural":4,"prop":12,"dossier":48,"cutscene":64,
 "spritesheet":96,"route":80,"evac":64,"shelter":80,
}
def digest_file(path:Path)->str:
 sha=hashlib.sha256()
 with path.open("rb") as opened:
  for chunk in iter(lambda:opened.read(1024*1024),b""):
   sha.update(chunk)
 return sha.hexdigest()

def restore(package_root:Path,destination:Path)->dict:
 input_manifest=package_root/"manifest.json"
 catalog=json.loads(input_manifest.read_text(encoding="utf8"))
 if catalog.get("version")!=2 or catalog.get("tag")!="nova-arcadia-v200-final-3gb-assets":
  raise ValueError("Unexpected/untrusted source catalog")
 packs=catalog.get("packs")
 if not isinstance(packs,list) or len(packs)!=7:
  raise ValueError("Need seven original district packs")
 known=rooms_by_district()
 if destination.is_symlink() or (destination.exists() and any(destination.iterdir())):
  raise ValueError("Restore destination must be a new empty directory")
 destination.mkdir(parents=True,exist_ok=True)
 seen_shas=set();total_original=0;total_zip=0;count=0
 for pack in packs:
  district=pack.get("id")
  if district not in APPROVED_DISTRICTS or pack.get("file")!="NA20-"+district+".zip":
   raise ValueError("Invalid approved source district")
  archive_path=package_root/pack["file"]
  if archive_path.is_symlink() or not archive_path.is_file():
   raise ValueError("Missing or linked district archive")
  if pack.get("compressedBytes")!=archive_path.stat().st_size:
   raise ValueError("Archive size mismatch: "+district)
  if not SHA.fullmatch(str(pack.get("sha256"))) or digest_file(archive_path)!=pack["sha256"]:
   raise ValueError("Archive SHA mismatch: "+district)
  total_zip+=archive_path.stat().st_size
  entries=pack.get("assets")
  if not isinstance(entries,list) or len(entries)!=448 or pack.get("artworkCount")!=448:
   raise ValueError("Unexpected district artwork count")
  room_ids={room["id"] for room in known[district]}
  expected_paths=set()
  by_kind=Counter()
  source=[]
  for item in entries:
   path=item.get("path")
   if not isinstance(path,str) or not PATH_RE.fullmatch(path):
    raise ValueError("Unsafe archive member path")
   room=item.get("room");kind=item.get("kind");cap=item.get("caption")
   if room not in room_ids or path.split("/")[1]!=room or kind not in EXPECTED_PER_DISTRICT:
    raise ValueError("Art does not belong to its real playable room")
   if path.split("/")[0]!=kind+"s" or path in expected_paths:
    raise ValueError("Unsafe or repeated member")
   if not isinstance(cap,str) or len(cap)<18 or len(cap)>240:
    raise ValueError("Original source description missing")
   if not SHA.fullmatch(str(item.get("sha256"))):
    raise ValueError("Member hash invalid")
   if item["sha256"] in seen_shas:
    raise ValueError("Duplicate content across districts")
   expected_paths.add(path)
   seen_shas.add(item["sha256"])
   by_kind[kind]+=1
  if dict(by_kind)!=EXPECTED_PER_DISTRICT:
   raise ValueError("Incomplete legacy story family: "+district)
  with zipfile.ZipFile(archive_path) as zipped:
   if set(zipped.namelist())!=expected_paths or len(zipped.namelist())!=448:
    raise ValueError("Archive has missing or extra entries")
   for item in entries:
    member=item["path"];info=zipped.getinfo(member)
    if info.is_dir() or info.file_size<1024 or info.file_size>MAX_ASSET:
     raise ValueError("Invalid original member size")
    if info.compress_type!=zipfile.ZIP_STORED:
     raise ValueError("Original image archives must be stored, not compressed")
    # Refuse symlink-style ZIP entries, even if the declared name is safe.
    if ((info.external_attr>>16)&0o170000)==0o120000:
     raise ValueError("Symlinks not allowed")
    target=destination/district/member
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.is_symlink() or target.exists():
     raise ValueError("Refuse overwrite of restore destination")
    data=zipped.read(info)
    if len(data)!=info.file_size:
     raise ValueError("Truncated ZIP member")
    if hashlib.sha256(data).hexdigest()!=item["sha256"]:
     raise ValueError("Individual art checksum mismatch")
    with Image.open(BytesIO(data)) as decoded:
     if decoded.format not in ("WEBP","PNG"):
      raise ValueError("Only authenticated original images are allowed")
     w,h=decoded.size
     decoded.verify()
    if not (128<=w<=8192 and 128<=h<=8192 and w*h<=65_536_000):
     raise ValueError("Artwork decoded dimensions unsafe")
    target.write_bytes(data)
    total_original+=len(data);count+=1
    source.append(dict(path=member,room=item["room"],kind=item["kind"],
                       caption=item["caption"],license="original"))
  if total_original<0:raise ValueError("Invalid total")
  (destination/district/"source-manifest.json").write_text(
      json.dumps(source,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 if count!=3136 or total_zip!=catalog.get("totalBytes"):
  raise ValueError("Source restoration total mismatch")
 report={"artworks":count,"sourceBytes":total_original,"zipBytes":total_zip,"districts":7,
         "restoredSha256Count":len(seen_shas)}
 print("RESTORED_AUTHENTIC_ART "+json.dumps(report),flush=True)
 return report

if __name__=="__main__":
 parser=argparse.ArgumentParser()
 parser.add_argument("--packs",type=Path,default=ROOT/"resourcepacks/release")
 parser.add_argument("--source",type=Path,default=ROOT/"resourcepacks/source")
 args=parser.parse_args()
 restore(args.packs,args.source)
