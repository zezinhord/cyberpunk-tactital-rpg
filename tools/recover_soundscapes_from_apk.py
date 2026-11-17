#!/usr/bin/env python3
"""Restaura SOMENTE trilhas originais validadas do APK anterior, sem alterar o código.

O cache do GitHub Actions é isolado por branch. Esta migração para a branch v0.8
reutiliza os mesmos 56 Ogg/Opus de v0.7.9 enquanto arte, história e código mudam.
Se o download falhar, o gerador original do projeto continua funcionando.
"""
from __future__ import annotations
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public/assets/soundscapes"
PREFIX = "assets/public/assets/soundscapes/"

def restore(source: Path) -> bool:
    if not source.is_file():
        return False
    try:
        with zipfile.ZipFile(source) as archive:
            names = archive.namelist()
            music = sorted(n for n in names if n.startswith(PREFIX) and n.endswith(".ogg"))
            catalog_name = PREFIX + "catalog.json"
            if len(music) != 56 or catalog_name not in names:
                print(f"Archive rejected: expected 56 original soundscapes, found {len(music)}")
                return False
            catalog = json.loads(archive.read(catalog_name))
            if catalog.get("format") != "nova-arcadia-original-soundtrack" or len(catalog.get("items", [])) != 56:
                return False
            # Validate first: no untrusted paths or partial exports.
            if any(not n.removeprefix(PREFIX) or ".." in Path(n).parts for n in music):
                return False
            if any(archive.getinfo(n).file_size < 950_000 for n in music):
                return False
            for name in [*music, catalog_name]:
                relative = name.removeprefix(PREFIX)
                target = DEST / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(name))
            print(f"Reused {len(music)} licensed-original local tracks from validated baseline APK")
            return True
    except (OSError, ValueError, zipfile.BadZipFile, KeyError) as exc:
        print(f"Existing soundscape restore unavailable: {exc}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: recover_soundscapes_from_apk.py <baseline-app-debug.apk>")
        raise SystemExit(2)
    raise SystemExit(0 if restore(Path(sys.argv[1])) else 1)
