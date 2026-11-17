#!/usr/bin/env python3
"""Restaura as 28 ambiências originais do APK 0.8.1 verificado.

Reutiliza áudio real entre branches, sem gerar arquivos artificiais.
Valida catálogo, nomes, hashes SHA-256, tamanho e duração declarada antes de
gravar. Se indisponível, o workflow usa o sintetizador original existente.
"""
from __future__ import annotations
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"public/assets/ambient"
PREFIX="assets/public/assets/ambient/"
DISTRICTS={"baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"}
MODES={"street","rain","interior","alert"}

def restore(apk:Path)->bool:
    try:
        with zipfile.ZipFile(apk) as bundle:
            manifest_path=PREFIX+"manifest.json"
            if manifest_path not in bundle.namelist():
                return False
            catalog=json.loads(bundle.read(manifest_path))
            items=catalog.get("items",[])
            if catalog.get("format")!="nova-arcadia-environment-v1" or len(items)!=28:
                return False
            total=0
            hashes=set()
            expected={(d,m) for d in DISTRICTS for m in MODES}
            sources=[]
            for item in items:
                district,mode=item.get("district"),item.get("mode")
                if (district,mode) not in expected or item.get("seconds")!=360:
                    return False
                expected.remove((district,mode))
                url=item.get("url")
                if url!=f"/assets/ambient/{district}/{mode}.ogg":
                    return False
                name=PREFIX+url.removeprefix("/")
                if name not in bundle.namelist():
                    return False
                info=bundle.getinfo(name)
                if info.file_size<360*15500 or info.file_size!=item.get("bytes"):
                    return False
                content=bundle.read(name)
                digest=hashlib.sha256(content).hexdigest()
                if digest!=item.get("sha256") or digest in hashes:
                    return False
                hashes.add(digest)
                total+=len(content)
                sources.append((name,district,mode))
            if expected or total!=catalog.get("totalBytes"):
                return False
            for name,district,mode in sources:
                target=DEST/district/f"{mode}.ogg"
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(bundle.read(name))
            DEST.mkdir(parents=True,exist_ok=True)
            (DEST/"manifest.json").write_bytes(bundle.read(manifest_path))
            print(f"Reused {len(sources)} verified ambient audio beds ({total} bytes) from prior APK",flush=True)
            return True
    except (OSError,ValueError,KeyError,TypeError,zipfile.BadZipFile) as error:
        print(f"Restore unavailable: {error}",flush=True)
        return False

if __name__=="__main__":
    if len(sys.argv)!=2:
        raise SystemExit("Usage: recover_ambience_from_apk.py <validated.apk>")
    raise SystemExit(0 if restore(Path(sys.argv[1])) else 1)
