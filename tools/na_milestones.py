#!/usr/bin/env python3
"""The real, byte-verified Nova Arcádia 2.0 delivery milestones.

Only count a *signed* measured APK and compressed ZIP district packs that
passed source/license validation. Do not count intermediate PNG generators,
unintegrated sprites, staging duplicates, inferred sizes, or synthetic padding.
This tracker never calls a release "final" on byte size alone: live content,
SHA-256 and Android boot tests are separate gates.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

BASELINE_VERIFIED_BYTES = 1_174_082_151
MIN_FINAL_BYTES = 3_000_000_000
STEP_BYTES = 300_000_000

def milestones(total: int, *, apk_signed: bool = False,
               packs_audited: bool = False) -> dict:
    if not isinstance(total, int) or isinstance(total, bool) or total < 0:
        raise ValueError("Total must be a non-negative integer number of bytes")
    thresholds = []
    threshold = BASELINE_VERIFIED_BYTES + STEP_BYTES
    while threshold < MIN_FINAL_BYTES:
        thresholds.append(threshold)
        threshold += STEP_BYTES
    thresholds.append(MIN_FINAL_BYTES)
    achieved = [x for x in thresholds if total >= x]
    next_target = next((x for x in thresholds if total < x), None)
    eligible = apk_signed and packs_audited
    return dict(
        firstVerifiedBytes=BASELINE_VERIFIED_BYTES,
        totalObservedBytes=total,
        totalEligibleBytes=total if eligible else None,
        apkSigned=apk_signed,
        packsAudited=packs_audited,
        eligibleForMilestoneCredit=eligible,
        stepBytes=STEP_BYTES,
        thresholdsBytes=thresholds,
        observedMilestones=len(achieved),
        verifiedMilestones=len(achieved) if eligible else 0,
        newBytesSinceFirstVerified=max(0,total-BASELINE_VERIFIED_BYTES)
            if eligible else 0,
        nextTargetBytes=next_target,
        remainingToNextBytes=max(0,next_target-total)
            if next_target is not None else 0,
        remainingTo3GbBytes=max(0,MIN_FINAL_BYTES-total),
        threeGbByteGoalReached=total>=MIN_FINAL_BYTES and eligible,
        gameplayAndAndroidCertificationRequired=True,
    )

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--total-bytes",type=int,required=True)
    parser.add_argument("--signed-apk",action="store_true")
    parser.add_argument("--audited-packs",action="store_true")
    parser.add_argument("--output",type=Path)
    args=parser.parse_args()
    report=milestones(args.total_bytes,apk_signed=args.signed_apk,
                      packs_audited=args.audited_packs)
    raw=json.dumps(report,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(raw,encoding="utf-8")
    print(raw)

if __name__=="__main__":
    main()
