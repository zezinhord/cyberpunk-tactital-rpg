#!/usr/bin/env python3
"""QA the new original archival artwork without claiming 3GB is already shipped."""
import hashlib
import json
import tempfile
from pathlib import Path
from PIL import Image
from produce_district_archives import PAGE_TYPES, produce
from build_3gb_asset_packs import rooms_by_district

def main():
    with tempfile.TemporaryDirectory(prefix="na-authored-dossier-") as temp:
        root=Path(temp)
        result=produce(root,limit_rooms=1)
        assert result["rooms"]==1
        assert result["artworks"]==4+len(PAGE_TYPES)
        assert result["missingTo3GB"]>0
        manifest=list(root.rglob("source-manifest.json"))
        assert len(manifest)==1
        assets=json.loads(manifest[0].read_text())
        assert len(assets)==4+len(PAGE_TYPES)
        assert {x["kind"] for x in assets}=={"mural","prop","dossier"}
        assert len({x["path"] for x in assets})==len(assets)
        assert len({x["caption"] for x in assets})==len(assets)
        checks=[]
        for asset in assets:
            path=manifest[0].parent/asset["path"]
            assert asset["license"]=="original"
            assert path.exists() and path.stat().st_size>=1024
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                assert image.width>=128 and image.height>=128
                assert image.width*image.height<65_536_000
            checks.append(hashlib.sha256(path.read_bytes()).hexdigest())
        assert len(set(checks))==len(checks)
        rooms=rooms_by_district()
        assert len(rooms)==7 and all(len(x)==4 for x in rooms.values())
        print("Original archive smoke test: 1 distinct physical room, 3 props, "
              f"{len(PAGE_TYPES)} content-rich dossier pages, valid art licenses, "
              "checksums, captions and image dimensions.")
if __name__=="__main__":
    main()
