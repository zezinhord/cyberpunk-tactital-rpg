#!/usr/bin/env python3
"""Audit the ACTUAL compressed Android package before shipping the 1GB milestone.

Only verify assets that the game references, not placeholder bytes or the size
of a GitHub artifact wrapper. The content budget includes the 56 original songs,
the 28 environmental tracks, 17 unique named NPC sheets, and 12 player sheets.
"""
import json
import hashlib
import sys
import zipfile
from pathlib import Path

APK=Path(sys.argv[1]) if len(sys.argv)>1 else Path("android/app/build/outputs/apk/debug/app-debug.apk")
if not APK.is_file():
    raise SystemExit("APK missing: "+str(APK))
size=APK.stat().st_size
MILESTONE=1_000_000_000
if size<MILESTONE:
    raise SystemExit(f"1GB milestone not met: {size:,} bytes ({size/1e6:.2f} MB)")
with zipfile.ZipFile(APK) as archive:
    if archive.testzip() is not None:
        raise SystemExit("Damaged APK zip entry")
    entries={entry.filename:entry for entry in archive.infolist() if not entry.is_dir()}
    ambient_root="assets/public/assets/ambient/"
    music_root="assets/public/assets/soundscapes/"
    expanded_root="assets/public/assets/ambient-expanded/"
    environmental=[name for name in entries if name.startswith(ambient_root) and name.endswith(".ogg")]
    original=[name for name in entries if name.startswith(music_root) and name.endswith(".ogg")]
    expanded=[name for name in entries if name.startswith(expanded_root) and name.endswith(".ogg")]
    names=[name for name in entries if name.startswith("assets/public/assets/npc-") and name.endswith(".png")]
    player=[name for name in entries if name.startswith("assets/public/assets/player-") and name.endswith(".png")]
    if len(environmental)!=28 or len(original)!=56 or len(expanded)!=112 or len(names)<17 or len(player)<12:
        raise SystemExit(f"Missing gameplay assets: ambience={len(environmental)}, extended={len(expanded)}, OST={len(original)}, NPC={len(names)}, player={len(player)}")
    manifest=json.loads(archive.read(ambient_root+"manifest.json"))
    if manifest.get("format")!="nova-arcadia-environment-v1" or len(manifest.get("items",[]))!=28:
        raise SystemExit("Invalid environmental sound manifest")
    registered={entry["url"].lstrip("/") for entry in manifest["items"]}
    if registered!={name.removeprefix("assets/public/") for name in environmental}:
        raise SystemExit("An environmental audio track is not referenced in the live manifest")
    if manifest["totalBytes"]!=sum(entries[n].file_size for n in environmental):
        raise SystemExit("Recorded environmental bytes differ from the APK")
    sfx_hashes=set()
    for name in environmental:
        raw=archive.read(name)
        if raw[:4]!=b"OggS" or len(raw)<5_550_000:
            raise SystemExit("Missing or truncated ambience: "+name)
        digest=hashlib.sha256(raw).hexdigest()
        if digest in sfx_hashes:
            raise SystemExit("Duplicated ambient recording: "+name)
        sfx_hashes.add(digest)
    adaptive=json.loads(archive.read(expanded_root+"manifest.json"))
    if adaptive.get("format")!="nova-arcadia-adaptive-city-audio-v1" or len(adaptive.get("tracks",[]))!=112:
        raise SystemExit("The adaptive sound catalogue does not contain 112 real recordings")
    registered={t["url"].lstrip("/") for t in adaptive["tracks"]}
    if registered!={n.removeprefix("assets/public/") for n in expanded}:
        raise SystemExit("Unreferenced or missing expanded environmental media")
    runtime=Path("src/audio/director.ts").read_text(encoding="utf8")
    if "expandedAmbiencePath(" not in runtime:
        raise SystemExit("Expanded media is not used by the audio director")
    total_expanded=0
    hashes=set()
    for item in adaptive["tracks"]:
        name="assets/public/"+item["url"].lstrip("/")
        if name not in entries or item["seconds"]!=360 or entries[name].file_size!=item["bytes"]:
            raise SystemExit("Incomplete environmental media: "+str(item.get("url")))
        if item["bytes"]<6_800_000:
            raise SystemExit("Truncated environment: "+name)
        h=hashlib.sha256()
        with archive.open(name) as stream:
            for block in iter(lambda:stream.read(1024*1024),b""):h.update(block)
        if h.hexdigest()!=item["sha256"] or item["sha256"] in hashes:
            raise SystemExit("Corrupt or duplicated environmental asset: "+name)
        hashes.add(item["sha256"])
        total_expanded+=item["bytes"]
    if total_expanded!=adaptive.get("totalBytes") or total_expanded<780_000_000:
        raise SystemExit("112 genuinely generated soundscapes are missing")
    # PNG file identities: source sheets remain separate and directional.
    def meta(name):
        stream=archive.read(name)
        return (int.from_bytes(stream[16:20],"big"),int.from_bytes(stream[20:24],"big"))
    if any(meta(n)!=(768,320) for n in names):
        raise SystemExit("An NPC sheet no longer contains 12 poses × 4 directions")
    if any(meta(n)!=(768,320) for n in player):
        raise SystemExit("A player origin sheet lost its 12 poses × 4 directions")
    metrics={
      "version":"0.9.0-rc.1",
      "apkBytes":size,"targetBytes":MILESTONE,
      "ambientFiles":len(environmental),"ambientBytes":sum(entries[x].file_size for x in environmental),
      "expandedAmbientFiles":len(expanded),"expandedAmbientBytes":total_expanded,
      "originalSongs":len(original),"originalSongBytes":sum(entries[x].file_size for x in original),
      "namedNpcSheets":len(names),"playerSheets":len(player),
      "assetsTotal":len(entries),
    }
    Path("qa").mkdir(exist_ok=True)
    Path("qa/android-content-audit.json").write_text(json.dumps(metrics,indent=2),encoding="utf-8")
    print("APK_CONTENT_AUDIT="+json.dumps(metrics,ensure_ascii=False))
