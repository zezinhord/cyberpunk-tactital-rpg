import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const ids = ["corporativo","baixada","gangue","militar","pesquisador","nomade"];
const hashes = new Set();
for (const origin of ids) {
  for (const gender of ["masculine","feminine"]) {
    const path = `src/assets/characters/player-${origin}-${gender}.png`;
    const data = await readFile(path);
    assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a", "PNG inválido: " + path);
    assert.equal(data.readUInt32BE(16),768,"Largura deve ser 12 colunas: " + path);
    assert.equal(data.readUInt32BE(20),320,"Altura deve ser quatro direções: " + path);
    assert.ok(data.length > 3000,"Sprite vazio ou truncado: " + path);
    hashes.add(createHash("sha256").update(data).digest("hex"));
  }
}
assert.equal(hashes.size,12,"Os 12 spritesheets precisam ser arquivos visualmente distintos.");
console.log("Sprites: 12 PNGs distintos; 4 direções e 12 quadros por direção.");
