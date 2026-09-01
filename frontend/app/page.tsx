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
            <p className="mt-6 max-w-lg text-white/70 text-lg leading-relaxed">
              Every trade pays a fee. <span className="text-white font-semibold">PUDL makes you the one collecting it</span> — one click, in pumps and dumps.
            </p>
            <p className="mt-2 max-w-lg text-white/45 text-[13px]">
              Sign in with Google · deposit SOL · cast into a pool · earn real fees.
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
              <p><span className="text-white">Width = 24h volume.</span> Ranked by real yield per $1k. Boring stable pairs hidden.</p>
            </Wi>
            <Wi k="A net" kc="text-acid">
              <b>Your liquidity in the current.</b>
              <p>Your SOL earns a cut of <span className="text-white">every trade</span> that crosses your range. Pull out anytime.</p>
            </Wi>
            <Wi k="A home" kc="text-sensory">
              <b>Where your fees pool.</b>
              <p>Solo, or a <span className="text-white">co-op crew</span> that splits the take by what each put in.</p>
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
              <p>A Solana wallet, held encrypted for you. <span className="text-white">Deposit and withdraw</span> anytime.</p>
            </Feat>
            <Feat k="Cast a net" kc="text-acid">
              <b>One click opens a real position.</b>
              <p>Genuine on-chain liquidity with your SOL. <span className="text-white">No Raydium tab, no approvals.</span></p>
            </Feat>
            <Feat k="Collect real fees" kc="text-acid">
              <b>Paid for volume, not direction.</b>
              <p>A cut of every trade through your range — <span className="text-white">up-days and panic-days alike.</span></p>
            </Feat>
            <Feat k="Paste any token" kc="text-interneuron">
              <b>Find a pool by address.</b>
              <p>Paste a contract address → its pools, ranked by yield, castable on the spot.</p>
            </Feat>
            <Feat k="Honest numbers" kc="text-acid">
              <b>Real rates, never a promise.</b>
              <p>Every figure is <span className="text-white">real on-chain fees</span> from the last 24h. Your take shows live in SOL.</p>
            </Feat>
            <Feat k="Be the house" kc="text-motor">
              <b>The fee is the edge.</b>
              <p>Traders pay it, LPs keep it. PUDL makes you the LP — <span className="text-white">in one click.</span></p>
            </Feat>
          </div>
        </section>

        {/* --------------------------------------------------------------- the risk */}
        <section className="border-t border-dash">
          <div className="px-5 md:px-9 py-11">
            <div className="esub mb-4">The risk</div>
            <h2 className="display text-3xl md:text-[40px]">You&rsquo;re providing liquidity, not betting.</h2>
            <p className="mt-4 max-w-2xl text-white/55 text-[15px] leading-relaxed">
              If a coin dumps out of your range, you stop earning and hold the weaker side —{' '}
              <span className="text-white">impermanent loss</span>, the real cost of being the house. Wider
              nets survive bigger moves and earn less; tighter nets earn more and break faster.
            </p>
          </div>
        </section>

        {/* --------------------------------------------------------------- the flywheel */}
        <section className="border-t border-dash">
          <div className="px-5 md:px-9 pt-11">
            <div className="esub mb-4">The $PUDL flywheel</div>
            <h2 className="display text-3xl md:text-[40px]">Fees flow downhill.</h2>
            <p className="mt-4 max-w-2xl text-white/55 text-[15px] leading-relaxed">
              Every trade pays a fee. PUDL routes that fee back into the rivers instead of into
              someone&rsquo;s pocket &mdash; so providing liquidity pays the people who show up, and the
              whole thing compounds.
            </p>
          </div>
          <div className="mt-9 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border-t border-line">
            <Flow n="01" k="Creator fees to the river">
              A token launched through PUDL pledges its creator fees as a <b>boost streamed to its LPs</b>.
              Deep liquidity is what makes a launch survive &mdash; so creators buy it instead of pocketing cash.
            </Flow>
            <Flow n="02" k="Liquidity gets deeper">
              Real yield pulls in more nets. More liquidity means tighter spreads and more volume &mdash;
              <b> more fees for everyone casting there.</b>
            </Flow>
            <Flow n="03" k="Protocol cut to $PUDL">
              PUDL takes a small cut of the flow to <b>buy back &amp; burn $PUDL</b> and flood the $PUDL
              flagship river &mdash; the one that pays the most.
            </Flow>
            <Flow n="04" k="The loop tightens">
              Best yields, more LPs, more volume, bigger boosts &amp; a bigger burn &mdash; $PUDL worth more
              and paying most, so <b>more people want in.</b>
            </Flow>
          </div>
          <div className="px-5 md:px-9 py-7 border-t border-line">
            <p className="max-w-2xl text-white/45 text-[13px] leading-relaxed">
              <span className="text-acid eyebrow">Honest by design.</span>{' '}
              You earn by <span className="text-white">providing liquidity</span>, never by passively holding
              $PUDL. The flagship river and creator boosts light up <span className="text-white">when the token
              launches</span> &mdash; no fake yields until then, and every number on this site is real on-chain fees.
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

function Flow({ n, k, children }: { n: string; k: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface p-7">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="mono text-[11px] text-acid tnum">{n}</span>
        <span className="eyebrow text-white/70">{k}</span>
      </div>
      <p className="text-white/55 text-[14px] leading-relaxed [&>b]:text-white [&>b]:font-semibold">{children}</p>
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
