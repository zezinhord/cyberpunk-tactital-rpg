#!/usr/bin/env python3
"""112 soundscapes evolutivas ORIGINAIS: 7 territórios x 4 modos x 4 fases.
Todas usadas pelo AudioDirector, sem pré-carregamento ou conteúdo de enchimento.
Cada uma dura seis minutos e contém padrões de sons e acontecimentos próprios.
Codec Ogg/Opus 168 kbit/s (um stream de cada vez)."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public/assets/ambient-expanded"
DISTRICTS={
 "baixada":(90,130,.052,.052),
 "ferrugem":(52,97,.080,.038),
 "aurea":(113,161,.039,.032),
 "subsolo":(61,76,.074,.051),
 "setor-zero":(48,132,.049,.040),
 "prisma":(126,187,.058,.045),
 "periferia":(77,118,.041,.066),
}
MODES=("street","rain","interior","alert")
PHASES=("aurora","turno","ocaso","vigilia")
DURATION=360
BITRATE=168000

def field(district:str,mode:str,phase:str,channel:int)->str:
 di=list(DISTRICTS).index(district);mi=MODES.index(mode);pi=PHASES.index(phase)
 bass,upper,hum,wind=DISTRICTS[district]
 t=f"(t+{.021*channel+.0017*di+.0013*pi:.5f})"
 freq=bass*(1+.08*pi+.015*mi);high=upper*(1+.07*mi+.027*di+.04*pi)
 beat=.58+.07*di+.035*pi+.023*mi
 note=f"mod(floor({t}/{beat:.5f})*{1+(di+pi)%4}+{pi*3+di},7)"
 pitch=f"({freq:.4f}*pow(2,({note}-3)/12))"
 gate=f"exp(-mod({t},{beat:.5f})*{3.1+.38*mi:.4f})"
 cyc=f"(0.62+0.38*sin(2*PI*{t}/{47+di*7+pi*4})*sin(2*PI*{t}/{47+di*7+pi*4}))"
 humtone=f"{hum:.5f}*sin(2*PI*{freq:.4f}*{t}+0.39*sin(2*PI*{t}/{13+mi*5}))*{cyc}"
 overtone=f"0.025*sin(2*PI*{high:.4f}*{t}+0.27*sin(2*PI*{t}/{22+di*2+pi}))"
 pulse=f"0.030*sin(2*PI*{pitch}*{t})*{gate}*(.58+.42*sin(2*PI*{t}/{91+di*8+pi*3})*sin(2*PI*{t}/{91+di*8+pi*3}))"
 bed=f"{wind*(.5+mi*.17+pi*.08):.5f}*(random({11+di*3+mi+channel})-.5)*(.68+.32*sin(2*PI*{t}/{31+di*3+pi*4}))"
 rate=7.5+di*.91+mi*1.57+pi*.69+channel*.17
 event1=f"0.029*sin(2*PI*{330+47*di+37*pi+79*mi+2*channel}*{t})*exp(-mod({t},{rate:.4f})*{6.2+pi})"
 long=32+mi*6+di*3+pi*4+channel*.9
 event2=f"0.022*sin(2*PI*{104+mi*19+di*23+pi*31}*{t}+.9*sin(2*PI*{t}/{6.7+di*.4:.3f}))*exp(-mod({t},{long:.4f})*.34)"
 if mode=="rain":
  texture=f"0.078*(random({30+di+pi*2+channel})-.5)*(.65+.35*sin(2*PI*{t}/{25+di*5+pi}))+0.012*sin(2*PI*{480+di*27+pi*11}*{t})*exp(-mod({t},{1.09+di*.06+pi*.04:.3f})*17)"
 elif mode=="alert":
  texture=f"0.026*sin(2*PI*{208+di*27+pi*19}*{t}+1.2*sin(2*PI*{t}/{2.7+pi*.2:.3f}))*(.6+.4*sin(2*PI*{t}/{15+di+pi}))+0.019*(random({43+di*2+pi+channel})-.5)"
 elif mode=="interior":
  texture=f"0.025*sin(2*PI*{116+di*11+pi*9}*{t}+.65*sin(2*PI*{t}/{5+di+pi}))+0.028*(random({52+di+mi+channel})-.5)"
 else:
  texture=f"0.037*(random({63+di*2+pi+channel})-.5)*(.5+.5*sin(2*PI*{t}/{49+pi*7+di})*sin(2*PI*{t}/{49+pi*7+di}))"
 if phase=="aurora":
  phasepart=f"0.012*sin(2*PI*{510+di*24}*{t})*exp(-mod({t},11.3)*3)"
 elif phase=="turno":
  phasepart=f"0.026*sin(2*PI*{190+di*16}*{t})*exp(-mod({t},{beat*2:.3f})*5)"
 elif phase=="ocaso":
  phasepart=f"0.023*sin(2*PI*{82+di*7}*{t}+sin(2*PI*{t}/13.1))"
 else:
  phasepart=f"0.016*sin(2*PI*{54+di*5}*{t})*(.5+.5*sin(2*PI*{t}/113))"
 breathe=f"(.78+.22*sin(2*PI*{t}/{131+di*8+mi*5+pi*3}))"
 return f"({humtone}+{overtone}+{pulse}+{bed}+{event1}+{event2}+{texture}+{phasepart})*{breathe}"

def render(task:tuple[str,str,str,int])->dict:
 district,mode,phase,duration=task
 file=OUT/district/mode/f"{phase}.ogg"
 file.parent.mkdir(parents=True,exist_ok=True)
 if not file.exists() or file.stat().st_size<duration*19000:
  expr="|".join(field(district,mode,phase,channel) for channel in range(2))
  args=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
   "-f","lavfi","-i",f"aevalsrc=exprs='{expr}':s=24000:d={duration}",
   "-af","highpass=f=30,lowpass=f=10500,alimiter=limit=0.88",
   "-ar","48000","-ac","2","-c:a","libopus","-application","audio",
   "-b:a","168k","-vbr","off","-compression_level","2",str(file)]
  process=subprocess.run(args,capture_output=True,text=True,check=False)
  if process.returncode:
   raise RuntimeError(f"Falha em {file}: {process.stderr[-1500:]}")
 size=file.stat().st_size
 if size<duration*19000:raise RuntimeError(f"Arquivo de áudio truncado: {file} ({size})")
 digest=hashlib.sha256()
 with file.open("rb") as handle:
  for buf in iter(lambda:handle.read(1024*1024),b""):digest.update(buf)
 return {"district":district,"mode":mode,"phase":phase,"seconds":duration,
  "url":f"/assets/ambient-expanded/{district}/{mode}/{phase}.ogg",
  "bytes":size,"sha256":digest.hexdigest(),
  "license":"Composição ambiental original Nova Arcádia"}

def main():
 parser=argparse.ArgumentParser();parser.add_argument("--sample",action="store_true")
 args=parser.parse_args()
 if not shutil.which("ffmpeg"):raise RuntimeError("FFmpeg indisponível")
 tasks=[(d,m,p,2 if args.sample else DURATION) for d in DISTRICTS for m in MODES for p in PHASES]
 if args.sample:tasks=tasks[:1]
 workers=min(4,max(1,int(os.environ.get("NA_AUDIO_WORKERS","2"))))
 with ThreadPoolExecutor(max_workers=workers) as pool:
  tracks=list(pool.map(render,tasks))
 total=sum(t["bytes"] for t in tracks)
 if len(set(t["sha256"] for t in tracks))!=len(tracks):raise RuntimeError("Faixas duplicadas")
 if not args.sample:
  if len(tracks)!=112 or total<780000000:
   raise RuntimeError(f"Pacote audiovisual insuficiente: {len(tracks)} faixas; {total} bytes")
  OUT.mkdir(parents=True,exist_ok=True)
  (OUT/"manifest.json").write_text(json.dumps({
   "format":"nova-arcadia-adaptive-city-audio-v1","version":1,
   "trackCount":len(tracks),"totalBytes":total,"tracks":tracks
  },ensure_ascii=False,indent=2),encoding="utf8")
 print(f"ORIGINAL_ADAPTIVE_AUDIO={len(tracks)} TOTAL_BYTES={total}",flush=True)

if __name__=="__main__":main()
