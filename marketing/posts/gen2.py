# Drop 2 — 8 fresh PUDL post cards (1600x900), same Elegans system as gen.py.
# Grounded in what's newly TRUE + verifiable on-chain: fee routing is locked
# (admin-revoked) 100% to the treasury; no buyback/burn; fees become depth.
import os, html

OUT = os.path.dirname(os.path.abspath(__file__))
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Archivo+Black&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap">')

ACID = '#e8ff1e'; STEEL = '#3f92a8'; DEEP = '#123a4c'


def wrap(inner, vb='0 0 640 900'):
    return (f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" '
            f'preserveAspectRatio="xMidYMid meet">{inner}</svg>')


def m_lock():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-width="34" stroke-linecap="round">'
                '<path d="M232 372 V300 a88 88 0 0 1 176 0 V372"/></g>'
                '<rect x="176" y="372" width="288" height="252" rx="30" fill="none" stroke="#e8ff1e" stroke-width="34"/>'
                '<circle cx="320" cy="474" r="30" fill="#e8ff1e"/>'
                '<rect x="306" y="490" width="28" height="80" rx="10" fill="#e8ff1e"/>')


def m_depth():
    return wrap('<g fill="#123a4c">'
                '<rect x="70" y="250" width="150" height="46" rx="6"/>'
                '<rect x="70" y="342" width="250" height="46" rx="6"/>'
                '<rect x="70" y="434" width="360" height="46" rx="6"/></g>'
                '<rect x="70" y="526" width="460" height="46" rx="6" fill="#3f92a8"/>'
                '<rect x="70" y="618" width="560" height="46" rx="6" fill="#e8ff1e"/>')


def m_vault():
    spokes = ''
    for (x1, y1, x2, y2) in [(320, 300, 320, 240), (320, 600, 320, 660), (170, 450, 110, 450), (470, 450, 530, 450),
                             (426, 344, 468, 302), (214, 344, 172, 302), (426, 556, 468, 598), (214, 556, 172, 598)]:
        spokes += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'
    return wrap('<circle cx="320" cy="450" r="234" fill="none" stroke="#123a4c" stroke-width="44"/>'
                '<circle cx="320" cy="450" r="150" fill="none" stroke="#e8ff1e" stroke-width="30"/>'
                f'<g stroke="#e8ff1e" stroke-width="20" stroke-linecap="round">{spokes}</g>'
                '<circle cx="320" cy="450" r="34" fill="#e8ff1e"/>')


def m_table():
    return wrap('<path d="M40 330 Q 320 170 600 330" fill="none" stroke="#123a4c" stroke-width="28" stroke-linecap="round"/>'
                '<circle cx="320" cy="540" r="150" fill="none" stroke="#e8ff1e" stroke-width="18" stroke-dasharray="34 30"/>'
                '<circle cx="320" cy="540" r="96" fill="none" stroke="#e8ff1e" stroke-width="34"/>'
                '<circle cx="320" cy="540" r="20" fill="#e8ff1e"/>')


def m_code():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">'
                '<path d="M258 300 L150 450 L258 600"/>'
                '<path d="M382 300 L490 450 L382 600"/></g>'
                '<path d="M356 262 L284 638" stroke="#3f92a8" stroke-width="24" stroke-linecap="round"/>')


def m_flywheel():
    return wrap('<ellipse cx="320" cy="450" rx="230" ry="230" fill="none" stroke="#2a2a2a" stroke-width="2" stroke-dasharray="6 8"/>'
                '<g fill="#e8ff1e"><rect x="304" y="196" width="30" height="30"/><rect x="536" y="434" width="30" height="30"/>'
                '<rect x="304" y="674" width="30" height="30"/><rect x="72" y="434" width="30" height="30"/></g>'
                '<circle cx="452" cy="245" r="12" fill="#e8ff1e"/>')


def m_cascade():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">'
                '<path d="M140 250 L300 340 L140 430"/>'
                '<path d="M240 400 L430 500 L240 600"/>'
                '<path d="M340 560 L560 670 L340 780"/></g>')


def m_net():
    return wrap('<g stroke="#e8ff1e" stroke-width="18" fill="none" stroke-linejoin="round">'
                '<path d="M320 170 L520 450 L320 730 L120 450 Z"/>'
                '<path d="M320 170 L320 730 M120 450 L520 450"/></g>'
                '<g fill="#e8ff1e"><circle cx="320" cy="170" r="16"/><circle cx="520" cy="450" r="16"/>'
                '<circle cx="320" cy="730" r="16"/><circle cx="120" cy="450" r="16"/></g>')


MOTIFS = {'lock': m_lock, 'depth': m_depth, 'vault': m_vault, 'table': m_table, 'code': m_code,
          'flywheel': m_flywheel, 'cascade': m_cascade, 'net': m_net}

# (kicker, headline_html, sub, motif, [size])
CARDS = [
    ("LOCKED ON-CHAIN", 'FEES LOCKED<br>TO $PUDL.', "100% routed on-chain. The config is revoked — unchangeable.", 'lock'),
    ("NO GIMMICKS", 'NO BUYBACK.<br>NO BURN.', "Fees become liquidity. The pool only gets deeper.", 'depth'),
    ("TRANSPARENT BY DEFAULT", 'WATCH THE<br>TREASURY.', "One public wallet. Every fee lands there, on-chain.", 'vault'),
    ("BE THE HOUSE", 'OTHER SIDE<br>OF THE TABLE.', "The house doesn't gamble. It collects.", 'table'),
    ("COMPOUNDING DEPTH", 'DEEPER<br>EVERY DAY.', "More volume → deeper $PUDL → harder to dump.", 'flywheel'),
    ("THE EDGE", 'THE EDGE THE<br>PROS KEPT.', "For years the fee went to bots. Now it's yours.", 'cascade'),
    ("OPEN SOURCE", 'READ THE<br>CODE.', "Nothing hidden. github.com/realdoomsman/pudlpudl", 'code'),
    ("THE WHOLE POINT", 'STOP BEING<br>EXIT LIQUIDITY.', "Be the liquidity, not the liquidated. One click.", 'net', 92),
]

TEMPLATE = '''<title>PUDL card</title>{fonts}<style>
  html,body{{margin:0;padding:0;background:#000}}
  .card{{position:relative;width:1600px;height:900px;background:#000;overflow:hidden;
    font-family:'Inter',system-ui,sans-serif;color:#fff}}
  .frame{{position:absolute;inset:34px;border:1px dashed rgba(255,255,255,.13);pointer-events:none}}
  .motif{{position:absolute;top:80px;right:70px;width:600px;height:740px;opacity:.92}}
  .top{{position:absolute;top:70px;left:78px;right:78px;display:flex;justify-content:space-between;align-items:center}}
  .kicker{{font-family:'Space Mono',monospace;text-transform:uppercase;font-size:19px;letter-spacing:.26em;color:rgba(255,255,255,.5)}}
  .mark{{display:flex;align-items:center;gap:14px}}
  .mark .wm{{font-family:'Archivo Black';font-size:22px;letter-spacing:.02em}}
  .mark .wm b{{color:#e8ff1e}}
  .body{{position:absolute;left:78px;bottom:150px;max-width:1040px}}
  .headline{{font-family:'Archivo Black';text-transform:uppercase;font-size:{size}px;line-height:.98;
    letter-spacing:-.01em;margin:0}}
  .headline .a{{color:#e8ff1e}}
  .sub{{font-family:'Space Mono',monospace;text-transform:uppercase;font-size:22px;letter-spacing:.12em;
    color:rgba(255,255,255,.62);margin-top:28px}}
  .foot{{position:absolute;left:78px;right:78px;bottom:70px;display:flex;justify-content:space-between;
    align-items:center;font-family:'Space Mono',monospace;font-size:20px;letter-spacing:.16em;
    text-transform:uppercase;border-top:1px dashed rgba(255,255,255,.13);padding-top:20px}}
  .foot .l{{color:rgba(255,255,255,.55)}} .foot .r{{color:#e8ff1e}}
</style>
<div class="card">
  <div class="motif">{motif}</div>
  <div class="frame"></div>
  <div class="top">
    <div class="kicker">{kicker}</div>
    <div class="mark">
      <svg width="34" height="34" viewBox="0 0 100 100"><g fill="none" stroke="#e8ff1e" stroke-linecap="round"><circle cx="50" cy="50" r="33" stroke-width="9"/><circle cx="50" cy="50" r="20" stroke-width="10"/></g><circle cx="50" cy="50" r="7" fill="#e8ff1e"/></svg>
      <span class="wm">PUDL<b>.</b></span>
    </div>
  </div>
  <div class="body">
    <h1 class="headline">{headline}</h1>
    <div class="sub">{sub}</div>
  </div>
  <div class="foot"><span class="l">pudl.fun</span><span class="r">$PUDL</span></div>
</div>'''


def acidify(hl):
    if '<br>' in hl:
        a, b = hl.split('<br>', 1)
        return a + '<br><span class="a">' + b + '</span>'
    return '<span class="a">' + hl + '</span>'


n = 0
for i, card in enumerate(CARDS, 16):
    kicker, hl, sub, motif = card[0], card[1], card[2], card[3]
    size = card[4] if len(card) > 4 else 118
    doc = TEMPLATE.format(fonts=FONTS, kicker=html.escape(kicker), headline=acidify(hl),
                          sub=html.escape(sub), motif=MOTIFS[motif](), size=size)
    with open(os.path.join(OUT, f'post{i:02d}.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
    n += 1
print(f'wrote {n} card HTML files (post16..post{15 + n}) to {OUT}')
