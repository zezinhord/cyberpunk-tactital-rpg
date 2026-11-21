#!/usr/bin/env python3
"""Integration QA with disposable tiny drawings; NEVER shipped as game content."""
from __future__ import annotations
import json
import random
import tempfile
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw
from build_3gb_asset_packs import (
    APPROVED_DISTRICTS, BASELINE_BYTES, GOAL_BYTES, build, rooms_by_district,
)

def render(path: Path, seed: int):
    path.parent.mkdir(parents=True,exist_ok=True)
    r=random.Random(seed)
    im=Image.new("RGB",(320,256),(15,26,38))
    d=ImageDraw.Draw(im)
    for k in range(96):
        x,y=r.randrange(320),r.randrange(256)
        w,h=r.randrange(10,70),r.randrange(5,30)
        d.rectangle((x,y,min(319,x+w),min(255,y+h)),
                    fill=(r.randrange(50,200),r.randrange(40,170),r.randrange(30,170)))
    d.text((8,10),f"QA SHAPE {seed:08X}",fill=(244,242,230))
    im.save(path,optimize=True)
    assert path.stat().st_size>1024


def test():
    with tempfile.TemporaryDirectory(prefix="na-pack-test-") as tmp:
        root=Path(tmp);src=root/"source";out=root/"packs"
        for district,rooms in rooms_by_district().items():
            data=[]
            for room in rooms:
                rid=room["id"]
                for kind,count in (("mural",1),("prop",3),("dossier",4)):
                    for i in range(count):
                        path=f"{kind}s/{rid}/{kind}-{i}.png"
                        render(src/district/path,abs(hash((district,rid,kind,i))) % (2**32))
                        data.append(dict(path=path,room=rid,kind=kind,
                             caption=f"Prancha original de teste do {rid}, folha {i}, grupo {kind}.",
                             license="original"))
            (src/district/"source-manifest.json").write_text(json.dumps(data,ensure_ascii=False))
        cat=build(src,out,require_3gb=False)
        assert len(cat["packs"])==7
        assert sum(p["artworkCount"] for p in cat["packs"])==224
        assert BASELINE_BYTES+cat["totalBytes"] < GOAL_BYTES
        for p in cat["packs"]:
            with zipfile.ZipFile(out/p["file"]) as z:
                assert len(z.namelist())==32
                for member in z.namelist():
                    assert member.startswith(("murals/","props/","dossiers/"))
        try:
            build(src,out,require_3gb=True)
            raise AssertionError("Release gate must block small packs!")
        except ValueError as ex:
            assert "3GB delivery BLOCKED" in str(ex),str(ex)
        try:
            build(src,out,require_3gb=False,milestone_1474=True)
            raise AssertionError("QA milestone must reject tiny test fixtures!")
        except ValueError as ex:
            assert "QA +300 MB MILESTONE BLOCKED" in str(ex),str(ex)
        try:
            build(src,out,require_3gb=False,milestone_1774=True)
            raise AssertionError("Second +300MB milestone cannot accept tiny fixtures!")
        except ValueError as ex:
            assert "QA +600 MB MILESTONE BLOCKED" in str(ex),str(ex)
        try:
            build(src,out,require_3gb=False,milestone_2074=True)
            raise AssertionError("Third QA release cannot ship 224 dummy fixtures!")
        except ValueError as err:
            assert "QA +900 MB MILESTONE BLOCKED" in str(err),str(err)
        try:
            build(src,out,require_3gb=False,milestone_2374=True)
            raise AssertionError("Fourth QA release cannot ship a dummy fixture bundle!")
        except ValueError as err:
            assert "QA +1200 MB MILESTONE BLOCKED" in str(err),str(err)
        assert not Path("src/game/assets/published-packs.ts").read_text().startswith(
            'import type {PackCatalog} from "./pack-catalog.ts";'
        ),"Small test artwork must never enter definitive catalog"
        print("3GB release QA: 224 generated fixture assets, 7 verified archives,"
              " no padding and blocked premature final publication.")


if __name__=="__main__":
    test()
