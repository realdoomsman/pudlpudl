'use client'

import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { RiverCanvas } from '@/components/RiverCanvas'
import { useRivers } from '@/lib/hooks/useRivers'
import { fmtUsd } from '@/lib/rivers'

export default function Home() {
  const { snapshot } = useRivers()
  const rivers = snapshot?.rivers ?? []
  const top = rivers.slice(0, 6)
  const topYield = rivers[0]?.totalPer1k ?? 0

  return (
    <div className="min-h-screen text-white">
      <Nav />

      {/* the dashed editorial column */}
      <div className="mx-auto max-w-[1180px] border-x border-dash">
        {/* ---------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden">
          <RiverCanvas rivers={rivers} className="absolute inset-0 w-full h-full opacity-40" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#000 6%,rgba(0,0,0,.5) 45%,#000 98%)' }} />
          <div className="relative px-5 md:px-9 pt-14 md:pt-20 pb-14">
            <span className="eyebrow inline-block text-acid border border-acid/35 bg-acid/[0.09] px-2.5 py-1.5">
              Stop being exit liquidity
            </span>
            <h1 className="display text-white text-5xl md:text-7xl mt-6 max-w-3xl">Be the house.</h1>
            <p className="mt-6 max-w-xl text-white/60 text-[15px] leading-relaxed">
              Every trade on Solana pays a fee, and somebody collects it. That somebody is the
              liquidity provider — the house. PUDL turns the memecoin market into a world of rivers,
              lets you cast liquidity where the volume floods, and collects that fee for you. In
              pumps <span className="text-white">and</span> dumps. Panic is volume too.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <Link href="/rivers" className="bg-acid text-acidink eyebrow px-5 py-3 hover:bg-acidhover transition-colors">
                Enter the rivers →
              </Link>
              <Link href="/board" className="border border-hair bg-surface text-white/70 eyebrow px-5 py-3 hover:text-acid hover:border-acid/35 transition-colors">
                The board
              </Link>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- live stats */}
        <section className="border-t border-dash">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border-t border-line">
            <Stat k="Fees paid · 24h" v={snapshot ? fmtUsd(snapshot.totalFees24h) : '—'} accent />
            <Stat k="Volume · 24h" v={snapshot ? fmtUsd(snapshot.totalVol24h) : '—'} />
            <Stat k="Live meme rivers" v={snapshot ? String(rivers.length) : '—'} />
            <Stat k="Top yield · per $1k" v={topYield ? fmtUsd(topYield) : '—'} accent />
          </div>
        </section>

        {/* --------------------------------------------------------------- what lives here */}
        <section className="border-t border-dash">
          <div className="px-5 md:px-9 pt-11">
            <div className="esub mb-4">What lives here</div>
            <h2 className="display text-3xl md:text-[40px]">Two things. Rivers and nets.</h2>
            <p className="mt-4 max-w-2xl text-white/55 text-[15px] leading-relaxed">
              A river is a real trading pool. A net is your liquidity parked in it. Fish are the fees
              swimming downstream into whoever cast a net across the current.
            </p>
          </div>
          <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-px bg-line border-t border-line">
            <Wi k="A river" kc="text-interneuron">
              <b>A live memecoin pool.</b>
              <p>
                Every river on the map is a real Raydium pool — its width is 24h volume, its colour is
                how hard it&rsquo;s running. Every swap through it pays a trading fee. PUDL hides the
                boring stable pairs and ranks the rest by the fee they actually paid per $1,000 parked.
              </p>
            </Wi>
            <Wi k="A net" kc="text-acid">
              <b>Your liquidity in the current.</b>
              <p>
                Cast a net and your SOL becomes a concentrated liquidity position across a price band.
                While the price trades through your band, you collect a cut of every single trade —
                the house&rsquo;s edge. Pull it out whenever you want.
              </p>
            </Wi>
            <Wi k="A home" kc="text-sensory">
              <b>Where your fees pool.</b>
              <p>
                Every net you cast flows into your home. Keep it solo, or open it to a crew and pool
                nets together — the take is split by what each of you put in. Your earnings follow you
                if you leave.
              </p>
            </Wi>
          </div>
        </section>

        {/* --------------------------------------------------------------- how it works */}
        <section className="border-t border-dash">
          <div className="px-5 md:px-9 pt-11">
            <div className="esub mb-4">How it works</div>
            <h2 className="display text-3xl md:text-[40px]">Sign in, deposit, cast, collect.</h2>
          </div>
          <div className="mt-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line border-t border-line">
            <Feat k="Sign in with Google" kc="text-sensory">
              <b>No wallet, no seed phrase.</b>
              <p>
                Continue with Google and a Solana wallet is minted for you and held encrypted. No
                extensions, no wallet-connect, no twelve words to lose. Deposit SOL to your address and
                withdraw any time — every action is signed as you, server-side.
              </p>
            </Feat>
            <Feat k="Cast a net" kc="text-acid">
              <b>One click opens a real position.</b>
              <p>
                Pick a river, choose how tight your net is, and PUDL opens a genuine Raydium
                concentrated-liquidity position with your SOL — internally, no Raydium tab, no
                approvals. Tighter nets catch more fees but break faster when price rips out of range.
              </p>
            </Feat>
            <Feat k="Collect real fees" kc="text-acid">
              <b>A cut of every trade that crosses you.</b>
              <p>
                While the market trades through your band you earn a share of its fees — on the way up
                and on the way down. You don&rsquo;t predict direction; you get paid for volume.
                Reap your fees or pull the whole net whenever you like.
              </p>
            </Feat>
            <Feat k="Paste any token" kc="text-interneuron">
              <b>Find a pool by contract address.</b>
              <p>
                Got a token nobody&rsquo;s mapped yet? Paste its contract address and PUDL finds every
                pool it trades in, ranked by real yield, and lets you cast a net on the spot — the same
                internal flow as the featured rivers.
              </p>
            </Feat>
            <Feat k="Honest numbers" kc="text-acid">
              <b>Real rates, never a promise.</b>
              <p>
                Every yield you see is a backward-looking figure computed from the fees a pool actually
                paid on-chain in the last 24 hours — not an APY we made up. Your realised take shows up
                live in <span className="text-white/80">My Nets</span>, in SOL, as it lands.
              </p>
            </Feat>
            <Feat k="Be the house" kc="text-motor">
              <b>The fee is the edge.</b>
              <p>
                Traders pay the fee; liquidity providers keep it. That&rsquo;s been true on every AMM
                since day one — PUDL just makes you one of them in a single click, and shows you exactly
                where the fees are flooding right now.
              </p>
            </Feat>
          </div>
        </section>

        {/* --------------------------------------------------------------- the risk */}
        <section className="border-t border-dash">
          <div className="px-5 md:px-9 py-11">
            <div className="esub mb-4">The risk</div>
            <h2 className="display text-3xl md:text-[40px]">You&rsquo;re providing liquidity, not betting.</h2>
            <p className="mt-4 max-w-2xl text-white/55 text-[15px] leading-relaxed">
              A net earns while price stays in its range. If a memecoin dumps out of your range you stop
              earning and end up holding the weaker side of the pair — the coin that just crashed. That&rsquo;s
              impermanent loss, and it&rsquo;s the real cost of being the house. Wider nets survive bigger
              moves and earn less; tighter nets earn more and get shredded faster. PUDL shows you the honest
              rate and the range — the call is yours.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------------- live rivers */}
        {top.length > 0 && (
          <section className="border-t border-dash">
            <div className="px-5 md:px-9 pt-11">
              <div className="esub mb-4">Live · the rivers</div>
              <h2 className="display text-3xl md:text-[40px]">Flooding right now.</h2>
            </div>
            <div className="mt-8 border-t border-line">
              {top.map((r, i) => (
                <Link
                  key={r.id}
                  href="/rivers"
                  className="flex items-center gap-3 px-5 md:px-9 py-3.5 border-b border-line hover:bg-white/[0.03] transition-colors"
                >
                  <span className="w-6 mono text-[11px] text-white/30 tnum">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex -space-x-1.5 shrink-0">
                    {[r.logoA, r.logoB].map((s, k) =>
                      s ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={k} src={s} alt="" className="w-6 h-6 rounded-full border border-black object-cover bg-pudl-gray-800" />
                      ) : (
                        <div key={k} className="w-6 h-6 rounded-full border border-black bg-pudl-gray-800" />
                      ),
                    )}
                  </div>
                  <span className="text-[13px] font-semibold flex-1 truncate">{r.name}</span>
                  <span className="mono text-[11px] text-white/40 tnum hidden sm:block">{fmtUsd(r.vol24h)} vol</span>
                  <span className="mono text-[13px] font-bold tnum text-acid">
                    {fmtUsd(r.totalPer1k)}<span className="text-white/30">/1k</span>
                  </span>
                </Link>
              ))}
            </div>
            <div className="px-5 md:px-9 py-8">
              <Link href="/rivers" className="bg-acid text-acidink eyebrow px-5 py-3 hover:bg-acidhover transition-colors inline-block">
                Enter the world →
              </Link>
            </div>
          </section>
        )}

        {/* --------------------------------------------------------------- footer */}
        <footer className="border-t border-dash px-5 md:px-9 py-8 flex flex-wrap items-center justify-between gap-4">
          <span className="display text-[13px] bg-acid text-acidink px-2 pt-[5px] pb-1">PUDL</span>
          <span className="eyebrow text-white/35">Be the house · Solana · real fees only</span>
        </footer>
      </div>
    </div>
  )
}

function Stat({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-4 py-4">
      <div className="eyebrow text-white/35 mb-1.5">{k}</div>
      <div className={`text-xl md:text-2xl font-bold mono tnum ${accent ? 'text-acid' : 'text-white'}`}>{v}</div>
    </div>
  )
}

function Wi({ k, kc, children }: { k: string; kc: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface p-7">
      <div className={`eyebrow ${kc} mb-2.5`}>{k}</div>
      <div className="[&>b]:block [&>b]:text-[16px] [&>b]:font-bold [&>b]:mb-2 [&>p]:text-white/55 [&>p]:text-[14px] [&>p]:leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Feat({ k, kc, children }: { k: string; kc: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface p-7">
      <div className={`eyebrow ${kc} mb-2.5`}>{k}</div>
      <div className="[&>b]:block [&>b]:text-[16px] [&>b]:font-bold [&>b]:mb-2 [&>p]:text-white/55 [&>p]:text-[14px] [&>p]:leading-relaxed">
        {children}
      </div>
    </div>
  )
}
