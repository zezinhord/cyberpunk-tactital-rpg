import assert from "node:assert/strict";
import {ARCHIVE_KEY,ARCHIVE_PAGES_PER_ROOM,EMPTY_ARCHIVES,
 validateArchiveProgress,markArchivePage,archiveReadCount,
 readArchiveProgress,saveArchiveProgress} from "../src/game/story/archive-progress.ts";
import {EXPANSION_ROOM_DESIGNS} from "../src/game/districts/expansion-interiors.ts";
const db=new Map();
globalThis.localStorage={getItem:key=>db.get(key)??null,
 setItem:(key,value)=>db.set(key,String(value)),
 removeItem:key=>db.delete(key)};
assert.equal(EXPANSION_ROOM_DESIGNS.length,28);
assert.equal(ARCHIVE_PAGES_PER_ROOM,12);
assert.equal(validateArchiveProgress(EMPTY_ARCHIVES),true);
let state=EMPTY_ARCHIVES;
const ids=EXPANSION_ROOM_DESIGNS.map(room=>room.id);
for(const id of ids){
 for(let i=0;i<ARCHIVE_PAGES_PER_ROOM;i++){
  const next=markArchivePage(state,id,i);
  assert.notEqual(next,state);
  state=next;
  assert.equal(archiveReadCount(state,id),i+1);
 }
 assert.equal(markArchivePage(state,id,1),state);
 assert.equal(markArchivePage(state,id,12),state);
 assert.equal(markArchivePage(state,id,-1),state);
 assert.equal(saveArchiveProgress("cyber-hero",state),true);
 assert.deepEqual(readArchiveProgress("cyber-hero"),state);
}
assert.equal(Object.keys(state.viewed).length,28);
assert.equal(archiveReadCount(state,ids[0]),12);
assert.equal(validateArchiveProgress(state),true);
assert.equal(validateArchiveProgress({...state,viewed:{...state.viewed,"../bad":[1]}}),false);
assert.equal(validateArchiveProgress({...state,viewed:{...state.viewed,[ids[0]]:[0,0]}}),false);
assert.equal(validateArchiveProgress({...state,viewed:{...state.viewed,[ids[0]]:[-1]}}),false);
assert.equal(validateArchiveProgress({...state,viewed:{...state.viewed,[ids[0]]:[12]}}),false);
assert.equal(validateArchiveProgress({...state,viewed:{...state.viewed,[ids[0]]:["0"]}}),false);
assert.equal(validateArchiveProgress({...state,unknown:true}),false);
db.set(ARCHIVE_KEY+"bad","{broken");
assert.deepEqual(readArchiveProgress("bad"),EMPTY_ARCHIVES);
const storage=globalThis.localStorage;
globalThis.localStorage=undefined;
assert.equal(saveArchiveProgress("absent",state),false);
globalThis.localStorage=storage;
console.log("336 real archive-reading events across 28 rooms persist, are validated in backups and never duplicate.");
