# Generates 15 on-brand PUDL post cards (1600x900) as self-contained HTML.
# Render each to PNG with headless Chrome. Elegans design system.
import os, html

OUT = os.path.dirname(os.path.abspath(__file__))

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Archivo+Black&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap">')

# ---- motifs (right-panel SVGs, ~640 wide on a 900 tall stage) ----
ACID = '#e8ff1e'
def wrap(inner, vb='0 0 640 900'):
    return f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">{inner}</svg>'

def m_ripple():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-linecap="round">'
               '<circle cx="320" cy="450" r="250" stroke-width="34"/>'
               '<circle cx="320" cy="450" r="160" stroke-width="40"/></g>'
               '<circle cx="320" cy="450" r="56" fill="#e8ff1e"/>')

def m_confluence():
    return wrap('<g fill="none" stroke="#3f92a8" stroke-width="20" stroke-linecap="round">'
               '<path d="M120 200 C 260 360 330 400 430 450"/>'
               '<path d="M120 700 C 260 540 330 500 430 450"/></g>'
               '<g fill="none" stroke="#e8ff1e" stroke-width="34" stroke-linecap="round">'
               '<path d="M430 450 L 620 450"/></g>'
               '<rect x="104" y="184" width="30" height="30" fill="#3f92a8"/>'
               '<rect x="104" y="686" width="30" height="30" fill="#3f92a8"/>')

def m_river():
    return wrap('<path d="M40 250 C 220 180 260 360 420 330 C 560 305 580 470 640 430" '
                'fill="none" stroke="#0f3446" stroke-width="96" stroke-linecap="round"/>'
                '<path d="M40 250 C 220 180 260 360 420 330 C 560 305 580 470 640 430" '
                'fill="none" stroke="#e8ff1e" stroke-width="34" stroke-linecap="round"/>'
                '<path d="M20 620 C 200 560 260 720 420 690 C 560 665 600 780 640 760" '
                'fill="none" stroke="#123a4c" stroke-width="70" stroke-linecap="round"/>')

def m_net():
    return wrap('<g stroke="#e8ff1e" stroke-width="18" fill="none" stroke-linejoin="round">'
                '<path d="M320 170 L520 450 L320 730 L120 450 Z"/>'
                '<path d="M320 170 L320 730 M120 450 L520 450"/></g>'
                '<g fill="#e8ff1e"><circle cx="320" cy="170" r="16"/><circle cx="520" cy="450" r="16"/>'
                '<circle cx="320" cy="730" r="16"/><circle cx="120" cy="450" r="16"/></g>')

def m_cascade():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">'
                '<path d="M140 250 L300 340 L140 430"/>'
                '<path d="M240 400 L430 500 L240 600"/>'
                '<path d="M340 560 L560 670 L340 780"/></g>')

def m_flywheel():
    return wrap('<ellipse cx="320" cy="450" rx="230" ry="230" fill="none" stroke="#2a2a2a" stroke-width="2" stroke-dasharray="6 8"/>'
                '<g fill="#e8ff1e"><rect x="304" y="196" width="30" height="30"/><rect x="536" y="434" width="30" height="30"/>'
                '<rect x="304" y="674" width="30" height="30"/><rect x="72" y="434" width="30" height="30"/></g>'
                '<circle cx="452" cy="245" r="12" fill="#e8ff1e"/>')

def m_burn():
    return wrap('<g fill="none" stroke="#e8ff1e" stroke-width="26" stroke-linecap="round">'
                '<path d="M320 210 C 470 340 470 470 320 470 C 170 470 170 340 320 210 Z"/></g>'
                '<path d="M320 300 C 400 370 400 430 320 460 C 240 430 240 370 320 300 Z" fill="#e8ff1e"/>'
                '<path d="M200 560 h240 M170 620 h300 M210 680 h200" stroke="#123a4c" stroke-width="14" stroke-linecap="round"/>')

MOTIFS = {'ripple':m_ripple,'confluence':m_confluence,'river':m_river,'net':m_net,'cascade':m_cascade,'flywheel':m_flywheel,'burn':m_burn}

# ---- 15 cards: (kicker, headline_html, sub, motif) ----
CARDS = [
 ("SOLANA · LIQUIDITY GAME", 'BE THE<br>HOUSE.', "Stop being exit liquidity.", 'ripple'),
 ("THE WORLD", 'RIVERS<br>ARE POOLS.', "Cast a net. Collect the fees.", 'river'),
 ("THE ENGINE", 'FEES FLOW<br>DOWNHILL.', "Real yields → more liquidity → more fees.", 'flywheel'),
 ("NO BARRIER", 'ONE CLICK.<br>NO WALLET.', "Sign in with Google. Deposit SOL. Cast.", 'ripple'),
 ("THE HONEST PART", 'KNOW THE<br>RIVER.', "You provide liquidity. That carries real risk.", 'river'),
 ("DON'T TRUST", 'VERIFY<br>EVERYTHING.', "Open source. Real positions. On-chain.", 'net'),
 ("PAID ON VOLUME", 'PUMPS AND DUMPS<br>BOTH PAY.', "You tax the traffic, not the chart.", 'cascade'),
 ("SPREAD THE RISK", 'MIX THE<br>RIVERS.', "Bundle pools at the confluence.", 'confluence'),
 ("ANY TOKEN", 'PASTE A CA.<br>CAST A NET.', "Fish the freshest launches.", 'net'),
 ("THE CREATOR DEAL", 'FEED THE<br>RIVER.', "Creator fees, streamed to your LPs.", 'confluence'),
 ("THE TOKEN", '$PUDL PAYS<br>THE MOST.', "The flagship river, fed by the flywheel.", 'burn'),
 ("THE EDGE", 'THE FEE IS<br>THE EDGE.', "Traders pay it. LPs keep it. Be the LP.", 'cascade'),
 ("HONEST NUMBERS", 'REAL FEES.<br>NO PROMISES.', "Every figure is on-chain. No invented APR.", 'ripple'),
 ("FISH IT", "DON'T APE<br>THE RIVER.", "Fish it. The house always eats.", 'river'),
 ("START", 'CAST YOUR<br>FIRST NET.', "One click. On pudl.fun.", 'net'),
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
  .mark .rip{{width:34px;height:34px}}
  .mark .wm{{font-family:'Archivo Black';font-size:22px;letter-spacing:.02em}}
  .mark .wm b{{color:#e8ff1e}}
  .body{{position:absolute;left:78px;bottom:150px;max-width:1000px}}
  .headline{{font-family:'Archivo Black';text-transform:uppercase;font-size:118px;line-height:.98;
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
      <svg class="rip" viewBox="0 0 100 100"><g fill="none" stroke="#e8ff1e" stroke-linecap="round"><circle cx="50" cy="50" r="33" stroke-width="9"/><circle cx="50" cy="50" r="20" stroke-width="10"/></g><circle cx="50" cy="50" r="7" fill="#e8ff1e"/></svg>
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
    # wrap the last line (after <br>) in acid
    if '<br>' in hl:
        a,b = hl.split('<br>',1)
        return a + '<br><span class="a">' + b + '</span>'
    return '<span class="a">' + hl + '</span>'

for i,(kicker,hl,sub,motif) in enumerate(CARDS, 1):
    doc = TEMPLATE.format(fonts=FONTS, kicker=html.escape(kicker), headline=acidify(hl),
                          sub=html.escape(sub), motif=MOTIFS[motif]())
    with open(os.path.join(OUT, f'post{i:02d}.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
print(f'wrote {len(CARDS)} card HTML files to {OUT}')
