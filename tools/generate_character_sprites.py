"""Regenera os spritesheets provisórios de Nova Arcádia.

Requer Pillow: python -m pip install Pillow
Execute na raiz do projeto: python tools/generate_character_sprites.py
"""
from PIL import Image, ImageDraw
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'src/assets/characters'
S=4
CW,CH=64,80

# Individual palettes and distinguishing garments/accessories.
CHARS={
 'player-corporativo': dict(skin='#c88968', hair='#202a34', hair2='#34485a', top='#d8ded8', inner='#203d4a', pants='#253744', shoes='#121d25', accent='#00dff0', detail='#9fb4b8', style='blazer', hair_style='neat', accessory='id'),
 'player-baixada': dict(skin='#a96f51', hair='#171a1e', hair2='#36302b', top='#15534f', inner='#d49a53', pants='#263c3b', shoes='#182326', accent='#e5b36b', detail='#77b9a0', style='hood', hair_style='curls', accessory='toolbelt'),
 'player-gangue': dict(skin='#b87b5d', hair='#17151d', hair2='#493047', top='#3b263f', inner='#161e2c', pants='#262337', shoes='#11151f', accent='#ff4b9a', detail='#a74c80', style='street', hair_style='undercut', accessory='bandana'),
 'player-militar': dict(skin='#b87958', hair='#252a25', hair2='#4a5042', top='#475442', inner='#b29c6b', pants='#303a32', shoes='#191f1a', accent='#c9b77d', detail='#879477', style='armor', hair_style='short', accessory='shoulder'),
 'player-pesquisador': dict(skin='#c88d6c', hair='#4b3e36', hair2='#746254', top='#d5e1df', inner='#2c6068', pants='#31434a', shoes='#1a282d', accent='#79d8ed', detail='#a7c9c9', style='coat', hair_style='side', accessory='visor'),
 'player-nomade': dict(skin='#ae7657', hair='#251c18', hair2='#684933', top='#74513a', inner='#d69b56', pants='#493d30', shoes='#211d18', accent='#e9a45c', detail='#a77a4c', style='cloak', hair_style='long', accessory='goggles'),
 'npc-amara': dict(skin='#94644d', hair='#d3c2a0', hair2='#eee0c3', top='#e9eee4', inner='#277b73', pants='#32484a', shoes='#172326', accent='#e5a765', detail='#70bcb0', style='medic', hair_style='short', accessory='cross'),
 'npc-nilo': dict(skin='#b97858', hair='#29221d', hair2='#594433', top='#754735', inner='#d59a5a', pants='#2d3d35', shoes='#171d18', accent='#e6b86f', detail='#b67d4b', style='mechanic', hair_style='messy', accessory='wrench'),
 'npc-joana': dict(skin='#9f684c', hair='#19151a', hair2='#3e2832', top='#655487', inner='#c68d65', pants='#263346', shoes='#181b29', accent='#d8a66f', detail='#9b7ab3', style='jacket', hair_style='braids', accessory='earring'),
 'npc-saira': dict(skin='#b77c59', hair='#211b1c', hair2='#55403a', top='#356a53', inner='#d6a15e', pants='#59453a', shoes='#24221b', accent='#e9c56c', detail='#8bb27c', style='market', hair_style='bun', accessory='plants'),
 'npc-teo': dict(skin='#c18a69', hair='#2a201d', hair2='#644737', top='#3d5269', inner='#e0a85d', pants='#303844', shoes='#191f28', accent='#63d5d0', detail='#8aa4b2', style='courier', hair_style='cap', accessory='bag'),
}

def hx(c):
    c=c.lstrip('#'); return tuple(int(c[i:i+2],16) for i in (0,2,4))

def shifted(color, amount):
    r,g,b=hx(color); return (max(0,min(255,r+amount)),max(0,min(255,g+amount)),max(0,min(255,b+amount)))

def draw_frame(cfg, row, frame):
    im=Image.new('RGBA',(CW*S,CH*S),(0,0,0,0)); d=ImageDraw.Draw(im)
    def xy(box): return tuple(int(v*S) for v in box)
    def ellipse(box, fill, outline=None, width=1): d.ellipse(xy(box), fill=fill, outline=outline, width=width*S)
    def rect(box, fill, outline=None, width=1): d.rectangle(xy(box), fill=fill, outline=outline, width=width*S)
    def roundrect(box, radius, fill, outline=None, width=1): d.rounded_rectangle(xy(box), radius*S, fill=fill, outline=outline, width=width*S)
    def poly(points, fill, outline=None): d.polygon([(int(x*S),int(y*S)) for x,y in points],fill=fill,outline=outline)
    def line(points, fill, width=1): d.line([(int(x*S),int(y*S)) for x,y in points],fill=fill,width=width*S,joint='curve')

    # walk cycle: frames 0 and 2 are contact poses, 1 and 3 passing poses.
    phase=[0,1,0,-1][frame]
    bob=[0,-1,0,-1][frame]
    # Rows: 0 SE, 1 SW, 2 NW (back), 3 NE. Face direction changes face/hair and chest detail.
    facing = ['right','left','back','front'][row]
    skin=hx(cfg['skin']); hair=hx(cfg['hair']); hair2=hx(cfg['hair2']); top=hx(cfg['top']); inner=hx(cfg['inner']); pants=hx(cfg['pants']); shoes=hx(cfg['shoes']); acc=hx(cfg['accent']); detail=hx(cfg['detail'])
    outline=(13,22,25,255); shade=shifted(cfg['top'],-24)
    # ground shadow
    ellipse((15,69,49,76),(4,10,12,105))
    # legs and shoes animated with opposite stride
    leg_shift=phase*2
    if facing=='back': leg_shift=-leg_shift
    roundrect((23,53+bob,30,69+leg_shift),(2),pants,outline,1)
    roundrect((33,53+bob,40,69-leg_shift),(2),pants,outline,1)
    # trousers seams / knee panels
    line([(26,57+bob,),(26,64+leg_shift)],detail,1)
    line([(36,57+bob),(36,64-leg_shift)],detail,1)
    roundrect((21,67+leg_shift,31,73+leg_shift),2,shoes,outline,1)
    roundrect((32,67-leg_shift,43,73-leg_shift),2,shoes,outline,1)
    line([(23,71+leg_shift),(29,71+leg_shift)],acc,1)
    line([(34,71-leg_shift),(40,71-leg_shift)],acc,1)

    # arms swing with gait
    arm_l=-phase*2; arm_r=phase*2
    if facing=='back': arm_l,arm_r=-arm_r,-arm_l
    roundrect((16,34+bob+arm_l,23,54+bob+arm_l),(3),top,outline,1)
    roundrect((40,34+bob+arm_r,47,54+bob+arm_r),(3),shade,outline,1)
    ellipse((17,51+bob+arm_l,23,57+bob+arm_l),skin,outline,1)
    ellipse((40,51+bob+arm_r,46,57+bob+arm_r),skin,outline,1)

    # torso shape; jacket body
    poly([(21,30+bob),(26,27+bob),(38,27+bob),(43,31+bob),(42,54+bob),(22,54+bob)],top,outline)
    poly([(25,31+bob),(31,29+bob),(37,31+bob),(37,53+bob),(27,53+bob)],inner,None)
    # shoulder/hem panels
    line([(21,34+bob),(24,51+bob),(42,51+bob),(43,34+bob)],detail,1)
    # style-specific garment details
    style=cfg['style']
    if style=='blazer':
        poly([(24,29+bob),(31,34+bob),(29,45+bob),(24,39+bob)],(235,240,233,255),None)
        poly([(40,29+bob),(32,34+bob),(35,44+bob),(41,39+bob)],(188,207,205,255),None)
        line([(32,34+bob),(32,49+bob)],acc,2); roundrect((39,43+bob,42,47+bob),1,acc)
    elif style=='hood':
        line([(24,30+bob),(20,26+bob),(16,29+bob)],detail,2); line([(40,30+bob),(45,27+bob),(48,31+bob)],detail,2)
        line([(32,34+bob),(32,49+bob)],acc,2); roundrect((22,45+bob,28,51+bob),1,detail)
    elif style=='street':
        poly([(20,34+bob),(25,31+bob),(27,51+bob),(22,50+bob)],shade,None)
        line([(24,36+bob),(40,45+bob)],acc,2); roundrect((38,46+bob,42,50+bob),1,acc)
    elif style=='armor':
        roundrect((21,32+bob,28,44+bob),2,detail,outline,1); roundrect((36,32+bob,43,44+bob),2,detail,outline,1)
        roundrect((28,31+bob,36,48+bob),2,top,outline,1); line([(32,33+bob),(32,48+bob)],acc,2)
    elif style=='coat' or style=='medic':
        poly([(21,29+bob),(28,33+bob),(24,55+bob),(19,51+bob)],(232,238,231,255),outline)
        poly([(43,29+bob),(36,33+bob),(40,55+bob),(45,51+bob)],(210,224,220,255),outline)
        line([(32,35+bob),(32,52+bob)],acc,1)
    elif style=='cloak':
        poly([(20,32+bob),(27,29+bob),(23,58+bob),(17,53+bob)],top,outline)
        poly([(44,32+bob),(37,29+bob),(41,58+bob),(47,53+bob)],shade,outline)
        line([(24,34+bob),(42,48+bob)],acc,2)
    elif style=='mechanic':
        roundrect((18,39+bob,46,56+bob),2,shade,outline,1)
        roundrect((26,40+bob,38,55+bob),1,inner)
        line([(21,44+bob),(27,44+bob)],acc,2); roundrect((39,44+bob,44,51+bob),1,acc)
    elif style=='jacket':
        poly([(20,32+bob),(26,29+bob),(28,53+bob),(22,51+bob)],detail,outline)
        line([(29,34+bob),(41,50+bob)],acc,2)
    elif style=='market':
        roundrect((20,37+bob,44,55+bob),2,shade,outline,1)
        line([(24,39+bob),(40,39+bob)],acc,2); roundrect((23,45+bob,29,51+bob),1,detail)
    elif style=='courier':
        line([(25,33+bob),(38,45+bob)],acc,2); roundrect((38,40+bob,46,53+bob),2,detail,outline,1)

    # neck
    roundrect((28,24+bob,36,33+bob),2,skin,outline,1)
    # head profile/orientation
    if facing=='back':
        ellipse((23,8+bob,41,30+bob),skin,outline,1)
        ellipse((22,7+bob,42,22+bob),hair,outline,1)
        # hair nape
        roundrect((22,15+bob,26,29+bob),2,hair)
        roundrect((38,15+bob,42,28+bob),2,hair)
    else:
        ellipse((23,8+bob,41,30+bob),skin,outline,1)
        # ears
        ellipse((21,17+bob,26,23+bob),skin,outline,1); ellipse((38,17+bob,43,23+bob),skin,outline,1)
        # hair styles
        hs=cfg['hair_style']
        if hs=='neat':
            poly([(23,17+bob),(24,9+bob),(31,6+bob),(40,11+bob),(42,18+bob),(36,14+bob),(29,15+bob)],hair,outline)
        elif hs=='curls':
            for xx,yy,rr in [(25,11,5),(31,8,5),(37,11,5),(24,17,4),(39,17,4)]: ellipse((xx-rr/2,yy-rr/2+bob,xx+rr/2,yy+rr/2+bob),hair,outline,1)
        elif hs=='undercut':
            poly([(23,18+bob),(24,9+bob),(31,6+bob),(40,10+bob),(41,16+bob),(35,13+bob),(28,14+bob)],hair,outline)
            roundrect((22,16+bob,25,26+bob),1,hair2)
        elif hs=='short':
            poly([(23,18+bob),(24,9+bob),(31,7+bob),(40,10+bob),(41,17+bob),(36,13+bob),(28,13+bob)],hair,outline)
        elif hs=='side':
            poly([(22,17+bob),(24,9+bob),(31,6+bob),(41,11+bob),(39,15+bob),(31,13+bob),(27,20+bob)],hair,outline)
        elif hs=='long':
            poly([(22,18+bob),(24,8+bob),(31,6+bob),(41,10+bob),(42,27+bob),(38,31+bob),(38,17+bob),(28,14+bob),(25,30+bob)],hair,outline)
        elif hs=='messy':
            poly([(22,18+bob),(21,10+bob),(27,11+bob),(30,5+bob),(35,9+bob),(41,8+bob),(42,18+bob),(35,14+bob),(28,15+bob)],hair,outline)
        elif hs=='braids':
            poly([(22,18+bob),(23,9+bob),(31,6+bob),(40,11+bob),(42,18+bob),(36,15+bob),(29,15+bob)],hair,outline)
            line([(23,19+bob),(21,30+bob),(23,37+bob)],hair,3); line([(41,19+bob),(43,30+bob),(41,37+bob)],hair,3)
            ellipse((20,35+bob,25,40+bob),acc); ellipse((39,35+bob,44,40+bob),acc)
        elif hs=='bun':
            poly([(23,18+bob),(24,9+bob),(31,6+bob),(40,11+bob),(41,18+bob),(35,14+bob),(28,14+bob)],hair,outline)
            ellipse((34,3+bob,42,12+bob),hair,outline,1)
        elif hs=='cap':
            poly([(22,16+bob),(24,8+bob),(40,8+bob),(42,17+bob)],hair,outline)
            roundrect((36,14+bob,46,18+bob),2,hair2)
        # face, oriented view direction
        if facing=='right': eyeX=35; cheekX=39
        else: eyeX=29; cheekX=25
        ellipse((eyeX-1,18+bob,eyeX+1,20+bob),(18,25,28,255))
        line([(31,23+bob),(33,24+bob)],shifted(cfg['skin'],-30),1)
    # unique accessories
    acc_type=cfg['accessory']
    if acc_type=='id': roundrect((36,36+bob,43,45+bob),1,(31,61,70,255),acc,1); line([(38,39+bob),(41,39+bob)],acc,1)
    elif acc_type=='toolbelt': roundrect((21,48+bob,44,53+bob),1,(49,47,35,255),acc,1); roundrect((38,48+bob,44,54+bob),1,acc)
    elif acc_type=='bandana': poly([(23,20+bob),(41,20+bob),(39,25+bob),(25,25+bob)],acc,None)
    elif acc_type=='shoulder': roundrect((17,31+bob,25,40+bob),2,detail,outline,1); line([(20,33+bob),(23,38+bob)],acc,1)
    elif acc_type=='visor': roundrect((22,15+bob,42,21+bob),2,(24,57,67,255),acc,1); line([(25,17+bob),(39,17+bob)],acc,1)
    elif acc_type=='goggles': roundrect((22,13+bob,42,21+bob),2,(35,37,35,255),acc,1); line([(26,16+bob),(38,16+bob)],acc,1)
    elif acc_type=='cross': rect((29,37+bob,35,44+bob),(42,128,116,255)); rect((25,39+bob,39,42+bob),(42,128,116,255))
    elif acc_type=='wrench': line([(43,45+bob),(48,53+bob)],acc,2); ellipse((45,42+bob,50,47+bob),None,acc,1)
    elif acc_type=='earring': ellipse((40,22+bob,44,27+bob),acc)
    elif acc_type=='plants': line([(42,38+bob),(47,29+bob)],detail,2); ellipse((43,26+bob,48,32+bob),acc); ellipse((39,29+bob,44,34+bob),detail)
    elif acc_type=='bag': roundrect((39,36+bob,49,52+bob),2,detail,outline,1); line([(40,36+bob),(32,30+bob)],acc,2)

    # lighting edge and small high-contrast details
    line([(22,35+bob),(22,49+bob)],shifted(cfg['top'],35),1)
    if frame in (1,3):
        line([(30,54+bob),(33,54+bob)],acc,1)
    # downsample smooth anti-aliased vector-pixel finish
    return im.resize((CW,CH),Image.Resampling.LANCZOS)

for name,cfg in CHARS.items():
    sheet=Image.new('RGBA',(CW*4,CH*4),(0,0,0,0))
    for row in range(4):
        for col in range(4):
            frame=draw_frame(cfg,row,col)
            sheet.alpha_composite(frame,(col*CW,row*CH))
    sheet.save(OUT/f'{name}.png', optimize=True)
print('Generated',len(CHARS),'spritesheets')
