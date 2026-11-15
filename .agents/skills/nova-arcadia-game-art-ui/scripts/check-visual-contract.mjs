#!/usr/bin/env node
import {readFileSync,existsSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(process.argv[2]??join(dirname(fileURLToPath(import.meta.url)),'../../../..'));
let passed=0;const errors=[];
function get(name){const path=join(root,name);if(!existsSync(path)){errors.push('Arquivo ausente: '+name);return '';}return readFileSync(path,'utf8');}
function check(ok,msg){if(ok)passed++;else errors.push(msg);}
const colors=get('src/theme/tokens.ts');
for(const [name,hex] of Object.entries({ally:'#00E5FF',hostile:'#FF2E88',neutral:'#FFD166',eden:'#7DFFB3'}))
 check(colors.includes(name+': "'+hex+'"'),'Token visual de '+name+' foi alterado');
for(const glyph of ['circle','triangle','diamond','hexagon'])
 check(colors.includes('shape: "'+glyph+'"'),'Símbolo funcional ausente: '+glyph);
check(colors.includes('minTarget: 48'),'Alvo touch mínimo mudou');
check(colors.includes('button: 56'),'Botão primário mudou');
const sprites=get('src/game/baixada/sprites.ts');
for(const origin of ['corporativo','baixada','gangue','militar','pesquisador','nomade'])
 for(const gender of ['masculine','feminine'])
  check(sprites.includes('player-'+origin+'-'+gender+'.png'),'Sprite não mapeado: '+origin+'/'+gender);
check(sprites.includes('PLAYER_COLUMNS = 12'),'Spritesheet deixou de ter 12 colunas');
check(sprites.includes('SPRITE_FRAME_WIDTH = 64')&&sprites.includes('SPRITE_FRAME_HEIGHT = 80'),'Frames 64×80 alterados');
const world=get('src/components/BaixadaLiteWorld.tsx');
for(const identifier of ['drawLiteSprite','createLiteArtAssets','drawCityBuilding','drawCityProp'])
 check(world.includes(identifier),'Arte original da Baixada ausente: '+identifier);
const css=get('src/arena-v030.css');
for(const selector of ['.arena-console-scroll','.control-sheet','.actions button','.na-abilities-open'])
 check(css.includes(selector),'Seletor fixo de combate ausente: '+selector);
const landscape=get('src/landscape.css');
check(landscape.includes('orientation: landscape'),'Regra landscape ausente');
for(const file of ['src/ui/icons.tsx','scripts/capture-baixada-visual.mjs','scripts/test-android-cold-boot.mjs','public/assets/baixada/market-stall.svg','public/assets/baixada/palm-tree.svg'])
 check(existsSync(join(root,file)),'Asset / teste visual não encontrado: '+file);
console.log('Nova Arcádia: '+passed+' invariantes preservados; '+errors.length+' falhas.');
for(const error of errors)console.error('✗ '+error);
if(errors.length)process.exitCode=1;else console.log('QA estático aprovado; capturas e Android real ainda necessários.');
