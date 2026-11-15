#!/usr/bin/env python3
"""Importa somente músicas CC0, identificadas por URL de origem e licença.

Arquivos são baixados durante a BUILD (nunca pelo Android); transcodificação
Opus mantém streaming local leve, baixo uso de memória e direitos auditáveis.
Falhas de rede não podem ser confundidas com aprovação: a versão de distribuição
requer ao menos 8 faixas CC0 válidas.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"music"/"cc0-sources.json"
DEST=ROOT/"public"/"assets"/"music"
MIN_TRACKS=8
BASE="https://opengameart.org/sites/default/files/"
MAX_SOURCE=50_000_000
USER_AGENT="NovaArcadiaGameBuild/0.7.2 (licensing attribution preserved)"

def candidates(filename:str)->list[str]:
    # OGA pode acrescentar sufixo numérico quando há colisões no upload.
    p=Path(filename)
    variants=[filename]
    for n in range(4):
        variant=f"{p.stem}_{n}{p.suffix}"
        if variant not in variants:variants.append(variant)
    if "_" in p.stem and p.stem.rsplit("_",1)[-1] in {"0","1","2","3"}:
        bare=p.stem.rsplit("_",1)[0]+p.suffix
        if bare not in variants:variants.append(bare)
    return [BASE+quote(v,safe="") for v in variants]

def download_music(track:dict,target:Path)->tuple[str,str]:
    urls=candidates(track["source_file"])
    last_error=""
    for url in urls:
        for attempt in range(2):
            try:
                req=Request(url,headers={"User-Agent":USER_AGENT,"Accept":"audio/*,application/octet-stream,*/*"})
                with urlopen(req,timeout=30) as response:
                    typ=response.headers.get("Content-Type","").split(";")[0].lower()
                    if typ in {"text/html","application/json"}:raise ValueError("Recebeu HTML em vez de áudio")
                    with target.open("wb") as output:
                        h=hashlib.sha256()
                        total=0
                        while True:
                            block=response.read(64*1024)
                            if not block:break
                            total+=len(block)
                            if total>MAX_SOURCE:raise ValueError("Arquivo maior que limite")
                            h.update(block);output.write(block)
                if total<10_000:raise ValueError(f"Audio muito curto ({total} bytes)")
                return url,h.hexdigest()
            except (HTTPError,URLError,ValueError,OSError) as exc:
                last_error=str(exc)
                target.unlink(missing_ok=True)
                if isinstance(exc,HTTPError) and exc.code in (403,404):break
                if attempt==0:time.sleep(.3)
    raise RuntimeError(f"{track['id']}: download indisponível ({last_error})")

def probe_duration(path:Path)->float:
    proc=subprocess.run(["ffprobe","-v","error","-select_streams","a:0",
      "-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",
      str(path)],capture_output=True,text=True,timeout=20)
    if proc.returncode or not proc.stdout.strip():raise RuntimeError("Sem faixa de áudio válida")
    duration=float(proc.stdout.strip())
    if not (5<=duration<=2400):raise RuntimeError(f"Duração suspeita: {duration}")
    return duration

def transcode(source:Path,destination:Path)->None:
    temp=destination.with_suffix(".tmp.ogg")
    cmd=["ffmpeg","-hide_banner","-nostdin","-v","error","-y","-i",str(source),
      "-map","0:a:0","-vn","-af","highpass=f=35,lowpass=f=12000",
      "-ar","24000","-ac","2","-c:a","libopus","-application","audio",
      "-b:a","80k","-vbr","on","-compression_level","3",str(temp)]
    result=subprocess.run(cmd,capture_output=True,text=True,timeout=240)
    if result.returncode:raise RuntimeError(result.stderr[-1000:])
    if temp.stat().st_size<15_000:raise RuntimeError("Opus inválido")
    temp.replace(destination)

def main()->None:
    args=argparse.ArgumentParser()
    args.add_argument("--check",action="store_true",help="Só valida o catálogo de direitos/IDs")
    args.add_argument("--sample",action="store_true",help="Importa 1 faixa para QA")
    flags=args.parse_args()
    entries=json.loads(CATALOG.read_text(encoding="utf-8"))["tracks"]
    ids=[x["id"] for x in entries]
    assert len(ids)==len(set(ids)) and len(ids)>=8
    assert all(x["license"]=="CC0-1.0" and
      urlparse(x["source"]).netloc=="opengameart.org" and
      x["source_file"] and x["id"].replace("-","").isalnum()
      for x in entries),"Metadados de licença ou fonte inválidos"
    if flags.check:
        print(f"Licenciamento: {len(entries)} candidatas declaradas CC0")
        return
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("FFmpeg/ffprobe são obrigatórios na build Android.")
    DEST.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for track in entries[:1] if flags.sample else entries:
        path=DEST/(track["id"]+".ogg")
        try:
            if path.exists() and probe_duration(path)>=5:
                manifest.append({**track,"url":f"/assets/music/{path.name}",
                  "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                  "durationSeconds":round(probe_duration(path),1),"sourceAsset":"cached"})
                print("CC0 cache:",track["id"],flush=True)
                continue
        except (OSError,RuntimeError,ValueError):
            path.unlink(missing_ok=True)
        try:
            with tempfile.TemporaryDirectory() as td:
                input_path=Path(td)/("original"+Path(track["source_file"]).suffix)
                source_url,source_sha=download_music(track,input_path)
                duration=probe_duration(input_path)
                transcode(input_path,path)
                manifest.append({**track,"url":f"/assets/music/{path.name}",
                  "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                  "durationSeconds":round(duration,1),
                  "sourceAsset":source_url,"originalSha256":source_sha})
                print(f"CC0 OK: {track['id']} {duration:.1f}s",flush=True)
        except (OSError,ValueError,RuntimeError,subprocess.TimeoutExpired) as exc:
            path.unlink(missing_ok=True)
            print(f"CC0 INDISPONÍVEL: {exc}",flush=True)
    if len(manifest)<(1 if flags.sample else MIN_TRACKS):
        raise RuntimeError(f"Apenas {len(manifest)}/{MIN_TRACKS} músicas CC0 importadas. "
          "Não publique APK que alegue incluir a nova trilha.")
    (DEST/"catalog.json").write_text(json.dumps({
      "format":"nova-arcadia-licensed-music","license":"CC0-1.0",
      "items":manifest},ensure_ascii=False,indent=2),encoding="utf-8")
    credits=[
      "# Nova Arcádia — trilhas CC0 incorporadas",
      "As fontes foram identificadas como CC0-1.0 nas páginas abaixo. "
      "NCS não foi incluída: música de jogos requer autorização da NCS.",
      ""]
    for t in manifest:credits.append(
      f"- **{t['title']}** — {t['artist']} · CC0-1.0 · {t['source']} · "
      f"SHA-256 do Opus: `{t['sha256']}`"
    )
    (DEST/"CREDITS.md").write_text("\n".join(credits)+"\n",encoding="utf-8")
    print(f"CC0_TRACK_COUNT={len(manifest)}",flush=True)

if __name__=="__main__":main()
