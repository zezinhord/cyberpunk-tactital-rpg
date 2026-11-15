#!/usr/bin/env python3
"""Trilha original de Nova Arcádia: 56 composições digitais procedurais.

Usa o sintetizador de áudio do FFmpeg com partitura determinística por distrito
e situação (não usa samples, downloads ou música protegida). Os arquivos são
codificados em Ogg/Opus estéreo 128 kbps CBR. Todos os 56 temas são
selecionáveis pelo rádio do jogo; durante a exploração toca apenas UM por vez.
A geração acontece no build, não no telefone do jogador.
"""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "soundscapes"
DISTRICTS = [
    ("baixada", "Baixada", 92, 95),
    ("ferrugem", "Ferrugem", 82, 89),
    ("aurea", "Áurea", 116, 112),
    ("subsolo", "Subsolo", 65, 86),
    ("setor-zero", "Setor Zero", 55, 72),
    ("prisma", "Prisma", 123, 120),
    ("periferia", "Periferia", 103, 92),
]
MOODS = [
    ("abertura", "Prólogo", 0),
    ("exploracao", "Exploração", 1),
    ("contatos", "Contatos", 2),
    ("investigacao", "Investigação", 3),
    ("perseguicao", "Perseguição", 4),
    ("confronto", "Confronto", 5),
    ("memorias", "Memórias", 6),
    ("revelacao", "Revelação", 7),
]

DURATION = 108
BITRATE = "128k"
SAMPLE_RATE = 24000


def score_expression(district: int, mood: int, base: int, bpm: int, stereo: float) -> str:
    """Construção de quatro vozes e três camadas rítmicas originais.

    Cada distrito apresenta altura, escala modal, atmosfera e andamento
    próprios. A natureza procedural evita arquivos de licença duvidosa.
    """
    t = f"(t+{stereo:.3f})"
    beat = 60 / (bpm + mood * 2 + (mood == 5) * 19)
    shift = (district * 3 + mood * 5) % 9
    mode = [0, 2, 3, 5, 7, 8, 10][district % 7]
    harmonics = 1.0 + district * 0.07
    note = f"mod(floor({t}/{beat:.6f})*{(mood % 4)+1}+{shift},7)"
    phrase = f"mod(floor({t}/{beat*4:.6f})+{district}+{mood},4)"
    freq = f"({base * harmonics:.4f}*pow(2,(({note})*{(mood % 3)+1}+{mode}+({phrase})*2)/12))"
    gate = f"exp(-mod({t},{beat:.6f})*{3.4 + mood * .25:.3f})"
    bassgate = f"(0.72+0.26*sin(2*PI*{t}/{beat*8:.6f}))"
    pad = (
        f"0.085*sin(2*PI*{base * (0.71 + district * .012):.4f}*{t}"
        f"+0.44*sin(2*PI*{t}/{8 + mood*.73:.3f}))*{bassgate}"
    )
    bass = (
        f"0.09*sin(2*PI*{base*.5:.4f}*{t}"
        f"+0.2*sin(2*PI*{t}/{beat*4:.6f}))*{bassgate}"
    )
    lead = f"0.086*sin(2*PI*{freq}*{t})*{gate}"
    pulse = (
        f"0.025*sin(2*PI*{740 + district*135 + mood*100}*{t}"
        f"*abs(sin(2*PI*{t}/{beat:.6f})))*"
        f"exp(-mod({t},{beat:.6f})*{15 + mood*1.7:.2f})"
    )
    shimmer = (
        f"0.018*sin(2*PI*{base*3.02:.3f}*{t}"
        f"+1.7*sin(2*PI*{t}/{3 + district*.27:.3f}))*"
        f"(0.45+0.55*sin(2*PI*{t}/{16 + mood:.3f})*sin(2*PI*{t}/{16 + mood:.3f}))"
    )
    breathe = f"(0.68+0.32*sin(2*PI*{t}/{17 + district*2 + mood:.3f}))"
    return "(" + "+".join((pad, bass, lead, pulse, shimmer)) + f")*{breathe}"


def compile_piece(destination: Path, district: int, mood: int, base: int, bpm: int, duration: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Composições estéreo levemente defasadas para espacialidade; sem grandes
    # amostras PCM de RAM: o streaming é feito pelo elemento HTMLAudio no jogo.
    left = score_expression(district, mood, base, bpm, 0.0)
    right = score_expression(district, mood, base, bpm, 0.013 + mood * .001)
    source = f"aevalsrc=exprs='{left}|{right}':s={SAMPLE_RATE}:d={duration}"
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
        "-f", "lavfi", "-i", source,
        "-af", "highpass=f=34,lowpass=f=9200,alimiter=limit=0.86",
        "-ar", str(SAMPLE_RATE), "-ac", "2",
        "-c:a", "libopus", "-application", "audio",
        "-b:a", BITRATE, "-vbr", "off", "-compression_level", "2",
        str(destination),
    ]
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError(f"FFmpeg falhou em {destination.name}: {result.stderr[-1300:]}")
    if destination.stat().st_size < 950_000:
        raise RuntimeError(f"Composição de áudio incompleta: {destination}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", action="store_true", help="Gera 1 faixa de 3 s para CI")
    args = parser.parse_args()
    if not shutil.which("ffmpeg"):
        raise SystemExit("FFmpeg não encontrado: necessário para compor a trilha original.")
    duration = 3 if args.sample else DURATION
    entries = []
    total = 0
    for district, (code, title, root, bpm) in enumerate(DISTRICTS):
        for mood, (mood_id, mood_title, _) in enumerate(MOODS):
            destination = OUTPUT / code / f"{mood_id}.ogg"
            if not destination.exists() or destination.stat().st_size < (40_000 if args.sample else 950_000):
                compile_piece(destination, district, mood, root, bpm, duration)
            size = destination.stat().st_size
            total += size
            entries.append({
                "district": code,
                "districtName": title,
                "mood": mood_id,
                "title": f"{title} · {mood_title}",
                "url": f"/assets/soundscapes/{code}/{mood_id}.ogg",
                "seconds": duration,
                "bytes": size,
                "license": "Original Nova Arcádia; sintetizado e produzido no build.",
            })
            print(f"Áudio {len(entries):02d}/56 · {code} · {mood_id} · {size:,} bytes", flush=True)
            if args.sample:
                break
        if args.sample:
            break
    (OUTPUT / "catalog.json").write_text(
        json.dumps({"format": "nova-arcadia-original-soundtrack", "version": 1,
                    "items": entries, "bytes": total}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"TRILHA_ORIGINAL_BYTES={total}", flush=True)


if __name__ == "__main__":
    main()
