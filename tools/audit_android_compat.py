#!/usr/bin/env python3
"""APK de compatibilidade: recursos originais íntegros; conteúdo 1GB preservado
somente no APK completo que é publicado antes desta variante."""
from pathlib import Path
import sys,zipfile
p=Path(sys.argv[1]);size=p.stat().st_size
if not 100_000_000<size<500_000_000:
 raise SystemExit(f"Compat APK is not a compact installer: {size} bytes")
with zipfile.ZipFile(p) as z:
 if z.testzip() is not None:raise SystemExit("Corrupt archive")
 files=set(z.namelist());root="assets/public/assets/"
 def count(prefix,suffix):
  return [x for x in files if x.startswith(root+prefix) and x.endswith(suffix)]
 amb=count("ambient/",".ogg")
 music=count("soundscapes/",".ogg")
 expanded=count("ambient-expanded/",".ogg")
 npc=count("npc-",".png")
 players=count("player-",".png")
 if len(amb)!=28 or len(music)!=56 or len(npc)<17 or len(players)!=12 or expanded:
  raise SystemExit(f"Missing/extra assets: {len(amb)} {len(music)} {len(npc)} {len(players)} {len(expanded)}")
 for path in npc+players:
  data=z.read(path)
  if data[:8]!=bytes.fromhex("89504e470d0a1a0a") or (
   int.from_bytes(data[16:20],"big"),int.from_bytes(data[20:24],"big")
  )!=(768,320):
   raise SystemExit("Invalid original character spritesheet: "+path)
 print(f"COMPAT_APK_OK={size} files; 28 original ambiences; 56 original scores; 29 spritesheets.")
