#!/usr/bin/env python3
"""Release gate invariants: 300 MB must be measured, never guessed."""
from na_milestones import BASELINE_VERIFIED_BYTES,MIN_FINAL_BYTES,STEP_BYTES,milestones
base=milestones(BASELINE_VERIFIED_BYTES,apk_signed=True,packs_audited=True)
assert base["verifiedMilestones"]==0
assert base["nextTargetBytes"]==1_474_082_151
assert base["remainingToNextBytes"]==STEP_BYTES
assert base["remainingTo3GbBytes"]==1_825_917_849
assert base["newBytesSinceFirstVerified"]==0
partial=milestones(BASELINE_VERIFIED_BYTES+299_999_999,apk_signed=True,packs_audited=True)
assert partial["verifiedMilestones"]==0
assert partial["remainingToNextBytes"]==1
done=milestones(BASELINE_VERIFIED_BYTES+STEP_BYTES,apk_signed=True,packs_audited=True)
assert done["verifiedMilestones"]==1
assert done["nextTargetBytes"]==BASELINE_VERIFIED_BYTES+STEP_BYTES*2
for n in range(1,6):
 x=milestones(BASELINE_VERIFIED_BYTES+n*STEP_BYTES,
   apk_signed=True,packs_audited=True)
 assert x["verifiedMilestones"]==n
no_signature=milestones(3_500_000_000,apk_signed=False,packs_audited=True)
assert no_signature["observedMilestones"]==7
assert no_signature["verifiedMilestones"]==0
assert not no_signature["threeGbByteGoalReached"]
unvalidated=milestones(3_500_000_000,apk_signed=True,packs_audited=False)
assert not unvalidated["threeGbByteGoalReached"]
final=milestones(MIN_FINAL_BYTES,apk_signed=True,packs_audited=True)
assert final["threeGbByteGoalReached"]
assert final["nextTargetBytes"] is None
assert final["gameplayAndAndroidCertificationRequired"] is True
for bad in (-1,1.5,True,"3000000000"):
 try:milestones(bad)
 except ValueError:pass
 else:raise AssertionError("Invalid byte count accepted")
print("Six progressive milestones, signature/packs integrity and final Android certification gate verified.")
