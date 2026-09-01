# Setting up the PUDL X (Twitter) account — step by step

Everything you need is in this folder. I can't post to X for you (that's your
account to control), but this is the exact sequence. Do it top to bottom.

## 0. The image files (already rendered as PNGs)
- **Profile picture:** `assets/pfp.png` — 1000×1000, shows as a circle.
- **Banner / header:** `assets/banner.png` — 1500×500.
- **Link preview / posts image:** `assets/og.png` — 1200×630.
- **Video:** screen-record `world-explainer.html` full-screen (see `video-script.md`), or use `assets/world.gif` if present.

## 1. Create / edit the profile
1. Handle: pick one that's free — e.g. `@pudldotfun`, `@pudlprotocol`, `@getpudl`, `@bethehouse`. Keep it short.
2. Display name: **PUDL** (or `PUDL 🎣`).
3. **Profile photo →** upload `assets/pfp.png`. Position so the mark is centred in the circle.
4. **Header →** upload `assets/banner.png`. Check the preview: your avatar sits bottom-left, so the wordmark stays clear.
5. **Bio** (pick one from `social-copy.md`, ≤160 chars). Recommended:
   > Stop being exit liquidity. Be the house. Cast a net into memecoin rivers and collect the real trading fees. Sign in with Google. One click. $PUDL
6. **Location:** `the riverbank` (optional flavour). **Link:** your live site URL.

## 2. First post + pin it
1. Post the **pinned thread** from `social-copy.md §2` (5 tweets).
   - Tweet 1: attach the **video** (or `og.png` if the video isn't ready yet).
   - Tweet 5: attach `assets/banner.png` or `assets/og.png`.
2. After posting, open tweet 1 → **⋯ menu → Pin to profile.**

## 3. Seed the timeline (space them out, don't dump all at once)
From `social-copy.md §3`, in this order over the first few days:
1. Post A — "be the house / stop being exit liquidity" (attach video)
2. Post B — rivers & nets explained (attach a screenshot of the world)
3. Post C — the flywheel, "fees flow downhill" (attach `og.png`)
4. Post D — one click / sign in with Google
5. Post E — the risk, told honestly

## 4. Before you point people at the app
- Do the funded test in `TEST-RUNBOOK.md` first. Don't drive traffic to money
  features that haven't had one real transaction through them.
- Replace every `[@handle]` / `[link]` / `[contract address]` placeholder in the
  copy with the real values once you have them.

## Notes
- All copy is written to be honest — no promised returns, impermanent loss stated
  plainly. Keep it that way in replies; it's what builds trust.
- Don't post a token contract address until the token is actually live, and never
  put it anywhere you can't edit if it changes.
