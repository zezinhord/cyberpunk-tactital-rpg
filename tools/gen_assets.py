"""Generates small, original audio and game icons using the Python standard library.

The checked-in source branch needs no third-party or commercial assets.
"""
import math
import random
import struct
import wave
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)
RATE = 22050
rng = random.Random(270)


def output_wav(name, samples):
    data = bytearray()
    for value in samples:
        data.extend(struct.pack("<h", int(32700 * max(-1.0, min(1.0, value)))))
    with wave.open(str(OUT / (name + ".wav")), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(data)


def sfx(name, seconds, fn):
    count = int(RATE * seconds)
    output_wav(name, [fn(i / RATE, i / count) * 0.55 for i in range(count)])


sfx("swing", 0.30, lambda t, u: (math.sin(2 * math.pi * (160 + 900 * t) * t) + rng.uniform(-1, 1) * .55) * math.sin(math.pi * u) ** 2)
sfx("hit", 0.35, lambda t, u: (math.sin(2 * math.pi * (70 - 34 * t) * t) + rng.uniform(-1, 1) * .4) * math.exp(-13 * t))
sfx("hurt", 0.36, lambda t, u: (math.sin(2 * math.pi * (200 - 170 * t) * t) + .35 * rng.uniform(-1, 1)) * math.exp(-8 * t))
sfx("collect", 0.72, lambda t, u: (math.sin(2 * math.pi * 523.25 * t) + .6 * math.sin(2 * math.pi * 659.25 * t) + .35 * math.sin(2 * math.pi * 783.99 * t)) * min(1, t * 12) * math.exp(-3 * t))
sfx("heal", .9, lambda t, u: (math.sin(2 * math.pi * (300 + 400 * t) * t) + .6 * math.sin(2 * math.pi * 510 * t)) * math.sin(math.pi * u) ** 2)
sfx("victory", 2.4, lambda t, u: sum(math.sin(2 * math.pi * f * t) * (1 + .15 * math.sin(2 * math.pi * 3 * t)) for f in [220, 330, 440, 550]) * .2 * min(1, t * 5) * min(1, (2.4 - t) * 1.5))

amb = []
for i in range(RATE * 6):
    t = i / RATE
    pad = sum(math.sin(2 * math.pi * f * t + math.sin(t * .2) * .3) for f in [55, 82.41, 110, 164.81, 220]) * .05
    wind = math.sin(2 * math.pi * .22 * t) * .05 + math.sin(2 * math.pi * .15 * t) * .03
    amb.append((pad + wind) * max(0, min(1, t / .7, (6 - t) / .7)))
output_wav("ambient", amb)


def png_write(name, n, background=False):
    pixels = []
    for y in range(n):
        row = bytearray([0])
        for x in range(n):
            if background:
                k = y / n
                color = (int(18 + 40 * k), int(22 + 9 * k), int(31 + 13 * k), 255)
            else:
                dx, dy = x - n / 2, y - n / 2
                radius = math.hypot(dx, dy) / n
                color = (22, 22, 30, 255)
                if radius < .40:
                    color = (43, 40, 46, 255)
                if .39 < radius < .415:
                    color = (191, 130, 87, 255)
                # Rune flame
                if abs(dx) < n * (.085 - max(0, dy / n) * .15) and -n * .31 < dy < n * .13:
                    color = (213, 73, 63, 255)
                # Silver sword with dark pommel
                if abs(dx + dy) < n * .025 and -n * .18 < dx < n * .24:
                    color = (230, 214, 194, 255)
                if abs(dx + dy) < n * .035 and n * .22 < dx < n * .34:
                    color = (111, 78, 56, 255)
            row.extend(color)
        pixels.append(row)
    data = b"".join(pixels)
    def chunk(name, payload):
        return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", zlib.crc32(name + payload) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", n, n, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(data, 6)) + chunk(b"IEND", b"")
    (OUT / name).write_bytes(png)


png_write("icon_192.png", 192)
png_write("icon_432.png", 432)
png_write("icon_bg_432.png", 432, True)
print("Generated", len(list(OUT.iterdir())), "original assets")
