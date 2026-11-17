#!/usr/bin/env python3
"""28 original, evolving urban ambiences for Nova Arcádia.

Seven districts × four distinct states: outdoors, tropical rain, indoors,
security alert. These are NOT additional music. 6-minute non-repeating
environmental beds reduce audible loop fatigue in real exploration.
All 28 sources are played by AudioDirector when their scene is entered,
on demand: a single streaming HTMLAudioElement, never decoded as PCM atlases.

FFmpeg generates stereo soundfields procedurally; no remote downloads, sample
copyrights or placeholder files. The 56 original songs remain unchanged.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"public/assets/ambient"
DISTRICTS={
 "baixada":(96,73,0.043,0.058),
 "ferrugem":(53,80,0.061,0.045),
 "aurea":(125,108,0.038,0.028),
 "subsolo":(68,57,0.036,0.069),
 "setor-zero":(41,91,0.029,0.046),
 "prisma":(143,118,0.049,0.040),
 "periferia":(88,52,0.025,0.057),
}
MODES=("street","rain","interior","alert")
DURATION=360
BITRATE="128k"

def sonic_field(district:str,mode:str,channel:int)->str:
    d=list(DISTRICTS).index(district);m=MODES.index(mode)
    low,high,hum,air=DISTRICTS[district]
    phase=0.012*channel+0.002*(m+d)
    t=f"(t+{phase:.5f})"
    # Fundamental pulses from infrastructure, subtly asynchronous L/R.
    f1=low*(1+.03*m)+(.17*channel)
    f2=high*(1+.06*d)+(1.3*m)+channel*.43
    drift=f"(1+0.0035*sin(2*PI*{t}/{17+3*d:.3f}))"
    machine=(f"{hum:.4f}*sin(2*PI*{f1:.4f}*{t}*{drift})"
             f"*(0.68+0.32*sin(2*PI*{t}/{61+7*m+4*d:.3f}))")
    second=(f"0.023*sin(2*PI*{f2:.4f}*{t}"
            f"+0.32*sin(2*PI*{t}/{28+2*d+m:.3f}))")
    # Moving wind, traffic/noise textures; 28 scenes have different modulation.
    roll=(f"{air:.4f}*(random({channel})-0.5)"
          f"*(0.52+0.26*sin(2*PI*{t}/{21+3*d:.3f})"
          f"+0.22*sin(2*PI*{t}/{87+5*m+7*d:.3f}))")
    # Distant point events are sparse and modulated over the full scene.
    event_period=8.1 + d*.61+m*1.27+channel*.08
    tick=(f"0.023*sin(2*PI*{370+84*d+43*m+7*channel}*{t})"
          f"*exp(-mod({t},{event_period:.4f})*{7.8+m*1.6:.3f})")
    event_period2=33+3*d+2*m+channel*.8
    far=(f"0.028*sin(2*PI*{160+32*d+10*m}*{t}"
         f"+0.9*sin(2*PI*{t}/{8+d:.3f}))"
         f"*exp(-mod({t},{event_period2:.4f})*0.65)")
    # Scene-specific distinct texture; never replace melody or play music.
    if mode=="street":
        texture=(f"0.028*(random({2+channel})-0.5)"
                 f"*(0.5+0.5*sin(2*PI*{t}/{49+d*3:.2f})"
                 f"*sin(2*PI*{t}/{49+d*3:.2f}))")
    elif mode=="rain":
        texture=(f"0.085*(random({4+channel})-0.5)"
                 f"*(0.73+0.27*sin(2*PI*{t}/{37+d*3:.2f}))"
                 f"+0.022*sin(2*PI*{550+d*40}*{t})"
                 f"*exp(-mod({t},{1.17+d*.08:.3f})*18)")
    elif mode=="interior":
        texture=(f"0.023*sin(2*PI*{110+15*d}*{t}"
                 f"+.65*sin(2*PI*{t}/{6+m+d:.2f}))"
                 f"+0.028*(random({6+channel})-0.5)"
                 f"*(0.75+0.25*sin(2*PI*{t}/{29+d:.2f}))")
    else:
        texture=(f"0.032*sin(2*PI*{210+d*38}*{t}"
                 f"+1.45*sin(2*PI*{t}/{3.4+d*.1:.3f}))"
                 f"*(0.6+0.4*sin(2*PI*{t}/{19+d:.2f}))"
                 f"+0.017*(random({8+channel})-0.5)")
    # A near-silence floor and very slow third modulation prevent flat loops.
    breathe=f"(0.87+0.13*sin(2*PI*{t}/{113+2*d+4*m:.3f}))"
    return f"({machine}+{second}+{roll}+{tick}+{far}+{texture})*{breathe}"

def generate(item:tuple[str,str,int])->dict:
    district,mode,duration=item
    dest=OUT/district/f"{mode}.ogg"
    dest.parent.mkdir(parents=True,exist_ok=True)
    minimum=duration*15500
    if not dest.exists() or dest.stat().st_size<minimum:
        if not shutil.which("ffmpeg"):
            raise RuntimeError("FFmpeg required for original environmental audio")
        expr="|".join(sonic_field(district,mode,channel) for channel in range(2))
        source=f"aevalsrc=exprs='{expr}':s=24000:d={duration}"
        command=["ffmpeg","-hide_banner","-loglevel","error","-nostdin","-y",
                 "-f","lavfi","-i",source,
                 "-af","highpass=f=35,lowpass=f=10000,alimiter=limit=0.84",
                 "-ar","48000","-ac","2",
                 "-c:a","libopus","-application","audio",
                 "-b:a",BITRATE,"-vbr","off","-compression_level","2",
                 str(dest)]
        result=subprocess.run(command,capture_output=True,text=True,check=False)
        if result.returncode:
            raise RuntimeError(f"Environmental sound generation failed {district}/{mode}: {result.stderr[-1000:]}")
    size=dest.stat().st_size
    if size<minimum:
        raise RuntimeError(f"Truncated original ambience: {dest}, {size} bytes")
    return {
     "district":district,"mode":mode,"seconds":duration,
     "url":f"/assets/ambient/{district}/{mode}.ogg",
     "bytes":size,"sha256":hashlib.sha256(dest.read_bytes()).hexdigest(),
     "license":"Original Nova Arcádia — generated stereo environmental sound design.",
    }

def main()->None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--sample",action="store_true",help="One short source for quick QA")
    args=parser.parse_args()
    if not shutil.which("ffmpeg"):
        raise SystemExit("FFmpeg unavailable. Original ambience cannot be generated.")
    duration=4 if args.sample else DURATION
    todo=[(d,m,duration) for d in DISTRICTS for m in MODES]
    if args.sample:todo=todo[:1]
    # Two concurrent jobs balance CI throughput against 2-core GitHub runners.
    with ThreadPoolExecutor(max_workers=2) as pool:
        items=list(pool.map(generate,todo))
    if len({x["sha256"] for x in items})!=len(items):
        raise RuntimeError("Duplicate environmental sound: each location/state must be unique")
    manifest={"format":"nova-arcadia-environment-v1","version":1,
              "totalBytes":sum(x["bytes"] for x in items),"items":items}
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"manifest.json").write_text(
        json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf8")
    print(f"ENVIRONMENTAL_SOUNDS={len(items)} BYTES={manifest['totalBytes']}",flush=True)

if __name__=="__main__":
    main()
