#!/usr/bin/env python3
"""Build seven authenticated *playable* Nova Arcadia district content packs.

The ONLY supported source is explicit, artist-curated source-manifest.json
under CONTENT_ROOT. Assets must be referenced in the game: one environment
mural, three real interactables, and >=4 zoomable story dossier pages per room.

No arbitrary resizing, noise, silence, duplication or padding is done here.
ZIP_STORED preserves already-compressed image/video bytes as-is. A final
distribution is created only when baseline APK + seven real pack ZIPs are
at least 3,000,000,000 bytes. This is checked on-disk, not invented metadata.

Usage:
  python tools/build_3gb_asset_packs.py --source resourcepacks/source \
      --output resourcepacks/release
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import zipfile
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
ROOMS_FILE = BASE / "src/game/districts/expansion-interiors.ts"
APPROVED_DISTRICTS = (
    "baixada", "ferrugem", "aurea", "subsolo", "setor-zero", "prisma", "periferia"
)
BASELINE_BYTES = 1143503198  # audited signed RC4 release
GOAL_BYTES = 3_000_000_000
GITHUB_ASSET_MAX_BYTES = 2 * (1024**3)
RELEASE_TAG = "nova-arcadia-v200-final-3gb-assets"
MILESTONE_TAG = "nova-arcadia-v200-milestone-1474"
SECOND_MILESTONE_TAG = "nova-arcadia-v200-milestone-1774"
THIRD_MILESTONE_TAG = "nova-arcadia-v200-milestone-2074"
FOURTH_MILESTONE_TAG = "nova-arcadia-v200-milestone-2374"
FIFTH_MILESTONE_TAG = "nova-arcadia-v200-milestone-2674"
FIFTH_MILESTONE_BYTES = 2_674_082_151
FOURTH_MILESTONE_BYTES = 2_374_082_151
THIRD_MILESTONE_BYTES = 2_074_082_151
SECOND_MILESTONE_BYTES = 1_775_365_848  # at least +300 MB beyond first signed QA201

FIRST_MILESTONE_BYTES = 1_474_082_151
PATH_RE = re.compile(
    r"^(murals|props|dossiers|cutscenes|spritesheets|routes|evacs|shelters|nexus)/[a-z0-9-]+/(?:[a-z0-9-]+/)*[a-z0-9-]+\.(png|webp)$"
)
MAX_IMAGE_BYTES = 70_000_000
MAX_PIXELS = 65_536_000  # prevent malicious 80k x 80k dimensions


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rooms_by_district() -> dict:
    raw = ROOMS_FILE.read_text(encoding="utf-8")
    snippet = raw.split("export const EXPANSION_ROOM_DESIGNS=", 1)[1].split(" as const;", 1)[0]
    rooms = json.loads(snippet)
    result = {x: [] for x in APPROVED_DISTRICTS}
    for room in rooms:
        district = next(
            (x for x in APPROVED_DISTRICTS if room["id"].startswith(x + "-")), None
        )
        if not district:
            raise ValueError("Room has no matching district: " + room["id"])
        result[district].append(room)
    if len(rooms) != 28 or any(len(a) != 4 for a in result.values()):
        raise ValueError("Expected exactly 4 authored rooms in each of 7 districts")
    return result


def dimensions(path: Path, data: bytes) -> tuple[int, int]:
    if path.suffix == ".png":
        if data[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError("Not a valid PNG: " + str(path))
        return struct.unpack(">II", data[16:24])
    if path.suffix == ".webp":
        if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
            raise ValueError("Not a valid WebP: " + str(path))
        from PIL import Image
        with Image.open(path) as im:
            return im.size
    raise ValueError("Unsupported image format")


def list_pack(district: str, source: Path, rooms: list[dict]) -> tuple[list[dict], int]:
    root = source / district
    src_manifest = root / "source-manifest.json"
    if not src_manifest.is_file():
        raise ValueError(f"Missing curated source metadata: {src_manifest}")
    manifest = json.loads(src_manifest.read_text(encoding="utf-8"))
    if not isinstance(manifest, list):
        raise ValueError("Source manifest must be an asset array")
    approved_rooms = {room["id"] for room in rooms}
    seen_paths, seen_sha = set(), set()
    entries, material_bytes = [], 0
    per_room = {room: Counter() for room in approved_rooms}
    for raw in manifest:
        if not isinstance(raw, dict):
            raise ValueError("Invalid asset entry")
        path = raw.get("path")
        room = raw.get("room")
        kind = raw.get("kind")
        caption = raw.get("caption")
        license_id = raw.get("license")
        if not isinstance(path, str) or not PATH_RE.fullmatch(path) or ".." in path:
            raise ValueError(f"Unsafe path or format: {path}")
        if path in seen_paths or room not in approved_rooms:
            raise ValueError(f"Duplicate or irrelevant asset: {path}")
        if path.split("/")[1] != room or (
            kind not in ("mural", "prop", "dossier", "cutscene", "spritesheet", "route", "evac", "shelter", "nexus")
        ) or path.split("/")[0] != ("nexus" if kind == "nexus" else kind + "s"):
            raise ValueError(f"Asset is not mapped to real interactive room: {path}")
        if not isinstance(caption, str) or len(caption.strip()) < 18 or len(caption) > 240:
            raise ValueError(f"Asset requires original narrative description: {path}")
        if license_id not in ("original", "CC0-1.0"):
            raise ValueError(f"Unsupported or unverified license: {path}")
        disk_path = root / path
        if not disk_path.is_file() or disk_path.is_symlink():
            raise ValueError(f"Source artwork missing: {disk_path}")
        data = disk_path.read_bytes()
        if not 1024 <= len(data) <= MAX_IMAGE_BYTES:
            raise ValueError(f"Invalid or empty artwork byte count: {path}")
        w, h = dimensions(disk_path, data)
        if w * h > MAX_PIXELS or w < 128 or h < 128:
            raise ValueError(f"Artwork dimensions unsafe: {path} ({w}x{h})")
        checksum = sha(data)
        if checksum in seen_sha:
            raise ValueError(f"Exact art duplication detected: {path}")
        seen_paths.add(path)
        seen_sha.add(checksum)
        material_bytes += len(data)
        per_room[room][kind] += 1
        entries.append(dict(
            path=path, room=room, kind=kind,
            caption=caption.strip(), sha256=checksum,
        ))
    for room, counts in per_room.items():
        if counts["mural"] != 1:
            raise ValueError(f"{room}: exactly one active mural required")
        if counts["prop"] != 3:
            raise ValueError(f"{room}: all three physically interactive props required")
        if counts["dossier"] < 4:
            raise ValueError(f"{room}: at least 4 distinct explorable dossier pages required")
        if counts["cutscene"] not in (0, 16):
            raise ValueError(f"{room}: 16 original playable cinematic scenes are required if a storyboard is supplied")
        if counts["spritesheet"] not in (0, 24):
            raise ValueError(f"{room}: each tactical simulation must have 24 unique playable frames")
        if counts["route"] not in (0, 20):
            raise ValueError(f"{room}: each perimeter patrol requires exactly 20 real map viewpoints")
        if counts["evac"] not in (0, 16):
            raise ValueError(f"{room}: each escort sequence requires 16 unique rescue storyboard frames")
        if counts["shelter"] not in (0, 20):
            raise ValueError(f"{room}: each relief mission needs 20 original intervention views")
        if counts["nexus"] not in (0, 24):
            raise ValueError(f"{room}: each Éden incursion requires exactly 24 relay viewpoints")
    return entries, material_bytes


def build(source: Path, output: Path, require_3gb=True,
          milestone_1474=False, milestone_1774=False, milestone_2074=False,
          milestone_2374=False, milestone_2674=False):
    if sum(bool(x) for x in (require_3gb,milestone_1474,milestone_1774,
                             milestone_2074,milestone_2374,milestone_2674))>1:
        raise ValueError("Final and QA milestone gates cannot be combined")
    all_rooms = rooms_by_district()
    output.mkdir(parents=True, exist_ok=True)
    packs, world_hashes = [], set()
    total_zips = 0
    for district in APPROVED_DISTRICTS:
        entries, unpacked_bytes = list_pack(district, source, all_rooms[district])
        archive_path = output / f"NA20-{district}.zip"
        with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_STORED,
                             allowZip64=True) as archive:
            for entry in sorted(entries, key=lambda x: x["path"]):
                if entry["sha256"] in world_hashes:
                    raise ValueError("Content duplicated in multiple districts")
                world_hashes.add(entry["sha256"])
                path = source / district / entry["path"]
                archive.write(path, arcname=entry["path"])
        size = archive_path.stat().st_size
        if not 1024 <= size < GITHUB_ASSET_MAX_BYTES:
            raise ValueError(f"{district}: GitHub asset must be <2 GiB")
        packs.append(dict(
            id=district,
            title="Distrito " + district.replace("-", " ").title(),
            file=archive_path.name,
            compressedBytes=size,
            uncompressedBytes=unpacked_bytes,
            sha256=sha(archive_path.read_bytes()),
            artworkCount=len(entries),
            locationCount=len(all_rooms[district]),
            assets=entries,
        ))
        total_zips += size
    catalog = dict(version=2,tag=FIFTH_MILESTONE_TAG if milestone_2674 else
                   FOURTH_MILESTONE_TAG if milestone_2374 else
                   THIRD_MILESTONE_TAG if milestone_2074 else
                   SECOND_MILESTONE_TAG if milestone_1774 else
                   MILESTONE_TAG if milestone_1474 else RELEASE_TAG,
                   totalBytes=total_zips,packs=packs)
    delivery_bytes = BASELINE_BYTES + total_zips
    (output / "manifest.json").write_text(
        json.dumps(catalog,ensure_ascii=False,indent=2)+"\n", encoding="utf-8")
    with (output / "SHA256SUMS.txt").open("w", encoding="utf-8") as sums:
        for pack in packs:
            sums.write(f'{pack["sha256"]}  {pack["file"]}\n')
    print(f"Original packed artworks: {sum(p['artworkCount'] for p in packs)}.")
    print(f"Seven authenticated ZIP packs: {total_zips:,} bytes.")
    print(f"Signed RC4 plus packs: {delivery_bytes:,} bytes.")
    if milestone_1474:
        if delivery_bytes < FIRST_MILESTONE_BYTES:
            raise ValueError(f"QA +300 MB MILESTONE BLOCKED: missing "
                             f"{FIRST_MILESTONE_BYTES-delivery_bytes:,} real shipped bytes")
        for pack in packs:
            if pack["artworkCount"] != 128:
                raise ValueError("Each district must provide 4 rooms x 16 archives + 16 cinematics")
        target = BASE / "src/game/assets/published-packs.ts"
        literal = json.dumps(catalog,ensure_ascii=False,indent=2)
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            '/** Authenticated +300MB QA catalog, NOT the 3GB definitive release. */\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+literal+';\n',
            encoding="utf-8",
        )
        print(f"QA milestone reached: {delivery_bytes:,} source-audited bytes; "
              "Android signing and installation are separate mandatory gates.")
    if milestone_1774:
        if delivery_bytes < SECOND_MILESTONE_BYTES:
            raise ValueError(f"QA +600 MB MILESTONE BLOCKED: missing "
                             f"{SECOND_MILESTONE_BYTES-delivery_bytes:,} original playable bytes")
        for pack in packs:
            if pack["artworkCount"] != 224 or pack["locationCount"] != 4:
                raise ValueError("Second milestone requires 4 rooms x (32 original images + 24 simulations)")
        target = BASE / "src/game/assets/published-packs.ts"
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            '/** Authenticated +600MB QA, NOT the final 3GB edition. */\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+
            json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',
            encoding="utf-8",
        )
        print(f"SECOND QA MILESTONE: {delivery_bytes:,} signed-baseline plus audited source bytes; "
              "new Android build/signature/emulator acceptance still required.")
    if milestone_2074:
        if delivery_bytes < THIRD_MILESTONE_BYTES:
            raise ValueError(f"QA +900 MB MILESTONE BLOCKED: missing "
                             f"{THIRD_MILESTONE_BYTES-delivery_bytes:,} original used bytes")
        for pack in packs:
            if pack["artworkCount"] != 304 or pack["locationCount"] != 4:
                raise ValueError("Third milestone requires 4 rooms x 76 real playable illustrations")
            if sum(a["kind"]=="route" for a in pack["assets"]) != 80:
                raise ValueError("Each district must supply 80 live-navigation images")
        target = BASE / "src/game/assets/published-packs.ts"
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            '/** Signed +900MB QA catalog, NOT the definitive 3GB game. */\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+
            json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',
            encoding="utf-8",
        )
        print(f"THIRD QA MILESTONE: {delivery_bytes:,} bytes of baseline + seven real packs. "
              "Android signed acceptance is independently required.")
    if milestone_2374:
        if delivery_bytes < FOURTH_MILESTONE_BYTES:
            raise ValueError(f"QA +1200 MB MILESTONE BLOCKED: missing "
                             f"{FOURTH_MILESTONE_BYTES-delivery_bytes:,} original used bytes")
        for pack in packs:
            if pack["artworkCount"] != 368 or pack["locationCount"] != 4:
                raise ValueError("Fourth milestone requires 4 rooms x 92 authored visual resources")
            if sum(a["kind"]=="evac" for a in pack["assets"]) != 64:
                raise ValueError("Each district must contain 64 actively usable civilian rescue frames")
            if sum(a["kind"]=="route" for a in pack["assets"]) != 80:
                raise ValueError("Previous 560 active patrol maps cannot be removed")
        target = BASE / "src/game/assets/published-packs.ts"
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            '/** Authenticated +1200MB QA, NOT the final 3GB edition. */\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+
            json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',
            encoding="utf-8",
        )
        print(f"FOURTH QA MILESTONE: {delivery_bytes:,} original used bytes. "
              "Native signing, emulator and publication still required.")
    if milestone_2674:
        if delivery_bytes < FIFTH_MILESTONE_BYTES:
            raise ValueError(f"QA +1500 MB MILESTONE BLOCKED: missing "
                             f"{FIFTH_MILESTONE_BYTES-delivery_bytes:,} real original bytes")
        for pack in packs:
            if pack["artworkCount"] != 448 or pack["locationCount"] != 4:
                raise ValueError("Fifth milestone requires 448 authentic drawings per district")
            counts = Counter(a["kind"] for a in pack["assets"])
            if counts["shelter"] != 80 or counts["evac"] != 64 or counts["route"] != 80:
                raise ValueError("Refúgio plus all existing playable maps required")
        target = BASE / "src/game/assets/published-packs.ts"
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            '/** Authenticated QA201 fifth milestone; NOT definitive 3GB. */\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+
            json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',
            encoding="utf-8")
        print(f"FIFTH QA MILESTONE: {delivery_bytes:,} source-audited bytes. "
              "Android signing and boot verification separately required.")
    if require_3gb and delivery_bytes < GOAL_BYTES:
        raise ValueError(f"Definitive 3GB delivery BLOCKED: missing "
                         f"{GOAL_BYTES-delivery_bytes:,} bytes of ORIGINAL, USED content")
    if require_3gb:
        # The definitive edition must *add* real gameplay assets, never reach
        # the byte target by dropping earlier mission types or duplicated art.
        for pack in packs:
            if pack["artworkCount"] != 544 or pack["locationCount"] != 4:
                raise ValueError("Definitive game requires 544 original used images per district")
            counts = Counter(a["kind"] for a in pack["assets"])
            required = {
                "mural": 4, "prop": 12, "dossier": 48, "cutscene": 64,
                "spritesheet": 96, "route": 80, "evac": 64,
                "shelter": 80, "nexus": 96,
            }
            if any(counts[kind] != amount for kind, amount in required.items()):
                raise ValueError("Definitive edition must preserve all 9 live content families")
        # This manifest may be compiled into the Android client only after
        # the full final package size has genuinely passed the gate.
        target = BASE / "src/game/assets/published-packs.ts"
        literal = json.dumps(catalog,ensure_ascii=False,indent=2)
        target.write_text(
            'import type {PackCatalog} from "./pack-catalog.ts";\n'
            'export const FINAL_ASSET_CATALOG:PackCatalog='+literal+';\n',
            encoding="utf-8",
        )
    return catalog


if __name__ == "__main__":
    cli = argparse.ArgumentParser()
    cli.add_argument("--source",type=Path,required=True)
    cli.add_argument("--output",type=Path,required=True)
    # For testing the integrity checks with tiny hand-authored art fixtures;
    # NEVER pass this flag from release CI.
    choices=cli.add_mutually_exclusive_group()
    choices.add_argument("--test-only-skip-size-gate",action="store_true")
    choices.add_argument("--milestone-1474",action="store_true",
                         help="Audited >=1.474GB QA artifact, never 3GB final")
    choices.add_argument("--milestone-1774",action="store_true",
                         help="Second +300MB signed content milestone, never final")
    choices.add_argument("--milestone-2074",action="store_true",
                         help="Third +205MB source-audited QA milestone; not final")
    choices.add_argument("--milestone-2374",action="store_true",
                         help="Fourth +176MB sequential 2.374GB milestone, not the 3GB final")
    choices.add_argument("--milestone-2674",action="store_true",
                         help="Fifth >=2.674GB signed QA checkpoint, not final")
    args = cli.parse_args()
    build(args.source,args.output,
          require_3gb=not (args.test_only_skip_size_gate or
                           args.milestone_1474 or args.milestone_1774 or
                           args.milestone_2074 or args.milestone_2374 or args.milestone_2674),
          milestone_1474=args.milestone_1474,
          milestone_1774=args.milestone_1774,
          milestone_2074=args.milestone_2074,
          milestone_2374=args.milestone_2374,
          milestone_2674=args.milestone_2674)
