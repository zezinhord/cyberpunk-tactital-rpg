#!/usr/bin/env python3
"""Restore only the original runtime audio media from a verified QA APK.

The source APK's SHA-256 must be checked by the caller first. We never restore
compiled JS, artwork or Android binaries: gameplay code is freshly compiled
from this branch. This avoids re-synthesizing 1 GB of existing original music.
"""
from __future__ import annotations
import collections
import json
import shutil
import sys
import zipfile
from pathlib import Path, PurePosixPath

SOURCE_PREFIX = "assets/public/assets/"
ALLOWED = {"soundscapes", "ambient", "ambient-expanded", "music"}
REQUIRED = {"soundscapes": 56, "ambient": 28, "ambient-expanded": 112}

def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: python tools/restore_media_from_apk.py <validated APK>")
    apk = Path(sys.argv[1])
    if not apk.is_file() or apk.stat().st_size < 1_000_000_000:
        raise SystemExit("Refusing absent/compact baseline APK")
    dest_root = Path("public/assets")
    stats: dict[str, int] = collections.defaultdict(int)
    ogg_counts: dict[str, int] = collections.defaultdict(int)
    with zipfile.ZipFile(apk) as archive:
        if archive.testzip() is not None:
            raise SystemExit("Baseline APK has corrupted ZIP entries")
        selected = []
        for info in archive.infolist():
            name = info.filename
            if info.is_dir() or not name.startswith(SOURCE_PREFIX):
                continue
            rel = PurePosixPath(name.removeprefix(SOURCE_PREFIX))
            if not rel.parts or rel.parts[0] not in ALLOWED:
                continue
            if rel.is_absolute() or any(part in ("", ".", "..") for part in rel.parts):
                raise SystemExit("Unsafe ZIP path in baseline APK")
            if not name.endswith((".ogg", ".json", ".mp3", ".opus")):
                continue
            selected.append((info, rel))
            if name.endswith(".ogg"):
                ogg_counts[rel.parts[0]] += 1
        for category, count in REQUIRED.items():
            if ogg_counts[category] != count:
                raise SystemExit(f"Baseline missing audio: {category}={ogg_counts[category]} expected={count}")
        for info, rel in selected:
            output = dest_root.joinpath(*rel.parts)
            output.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info) as src, output.open("wb") as dst:
                shutil.copyfileobj(src, dst, 1024 * 1024)
            if output.stat().st_size != info.file_size:
                raise SystemExit("Partial media extraction: " + str(rel))
            stats[rel.parts[0]] += info.file_size
    for relative in (
        "soundscapes/catalog.json",
        "ambient/manifest.json",
        "ambient-expanded/manifest.json",
    ):
        manifest = dest_root / relative
        if not manifest.is_file():
            raise SystemExit("Manifest missing after recovery: " + relative)
        json.loads(manifest.read_text(encoding="utf8"))
    if sum(stats.values()) < 1_000_000_000:
        raise SystemExit("Less than 1 GB of existing runtime assets restored")
    print(json.dumps({"status": "media recovered", "ogg_counts": ogg_counts, "bytes": stats}, default=dict))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
