'use client'

// The PUDL world — an aerial relief plate you look down onto. Desaturated
// habitat washes, drawn contour isolines (the land is nearly flat, so the
// relief is inked, not shaded), and winding RIVERS that are the live pools:
// width is volume, they flow from the uplands down to the sea. HOMES sit on the
// banks where fees pool; your home glows acid. Nothing glows, nothing is glossy.
// Ported from the Elegans monograph-terrain approach (connectomes/site/world3d.js).

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, extend, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Html, Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import type { River } from '@/lib/rivers'
import type { MyNet } from '@/lib/pudl'
import { fmtUsd } from '@/lib/rivers'

// -------- palette (desaturated monograph washes + one acid accent) --------
const C = {
  DEEP: '#1c3140', SHALLOW: '#3f6377', MEADOW: '#5f6f4d', PLAIN: '#7a7150',
  STRAND: '#a89e84', UPLAND: '#6d7076', BONE: '#e8e2d4', INK: '#0d1116',
  INK2: '#39424c', SUN: '#fff4e2', SKY: '#bdd3ea', ACID: '#e8ff1e', ROOF: '#5b5347',
}
const col = (h: string) => new THREE.Color(h)

const W = 200 // world size
const SEG = 200 // terrain segments
const HMAX = 15 // height band
const SEA_Y = 2.0

// ---------------- procedural heightfield (fBm) + shared sampler ----------------
function hash2(ix: number, iz: number) {
  let h = (ix * 374761393 + iz * 668265263) ^ 0x9e3779b9
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}
function vnoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = x - ix, fz = z - iz
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1)
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}
function useHeight() {
  return useMemo(() => {
    const N = SEG + 1
    const grid = new Float32Array(N * N)
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = (i / SEG) * W - W / 2
        const z = (j / SEG) * W - W / 2
        // fBm
        let f = 0, amp = 0.5, freq = 1 / 42
        for (let o = 0; o < 4; o++) { f += vnoise(x * freq + 10, z * freq + 10) * amp; amp *= 0.5; freq *= 2 }
        // tilt: -X is the sea, +X the uplands → rivers run downhill toward -X
        const tilt = (x + W / 2) / W // 0..1
        // a few big rolling hills on top of the fBm
        const hills = Math.sin(x / 34 + 1.5) * Math.cos(z / 40) * 3.2
        let h = SEA_Y - 3 + tilt * (HMAX + 1) + (f - 0.5) * 12 + hills
        // carve a sea basin along the low edge
        if (h < SEA_Y) h = SEA_Y - 0.6 - (SEA_Y - h) * 0.4
        grid[j * N + i] = h
      }
    }
    const heightAt = (x: number, z: number) => {
      const gx = ((x + W / 2) / W) * SEG
      const gz = ((z + W / 2) / W) * SEG
      const i = Math.max(0, Math.min(SEG - 1, Math.floor(gx)))
      const j = Math.max(0, Math.min(SEG - 1, Math.floor(gz)))
      const fx = gx - i, fz = gz - j
      const a = grid[j * N + i], b = grid[j * N + i + 1], c = grid[(j + 1) * N + i], d = grid[(j + 1) * N + i + 1]
      return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz
    }
    return { grid, heightAt, N }
  }, [])
}

function biomeColor(h: number, out: THREE.Color) {
  if (h < SEA_Y + 0.8) return out.copy(col(C.STRAND))
  if (h < 6) return out.copy(col(C.MEADOW))
  if (h < 10) return out.copy(col(C.PLAIN))
  return out.copy(col(C.UPLAND))
}

// ---------------------------------------------------------------- terrain
function Terrain({ height }: { height: ReturnType<typeof useHeight> }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(W, W, SEG, SEG)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = height.heightAt(x, z)
      pos.setY(i, h)
      biomeColor(h, c)
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [height])

  const mat = useMemo(() => {
    const grad = new THREE.DataTexture(new Uint8Array([90, 165, 240]), 3, 1, THREE.RedFormat)
    grad.minFilter = grad.magFilter = THREE.NearestFilter
    grad.needsUpdate = true
    const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad })
    m.dithering = true
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = 'varying float vWY;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n vWY = (modelMatrix * vec4(transformed,1.0)).y;',
      )
      sh.fragmentShader = 'varying float vWY;\n' + sh.fragmentShader.replace(
        '#include <dithering_fragment>',
        `float w1=fwidth(vWY); float d1=abs(fract(vWY-0.5)-0.5);
         float l1=(1.0-smoothstep(0.0,w1,d1))*(1.0-smoothstep(0.10,0.26,w1));
         gl_FragColor.rgb=mix(gl_FragColor.rgb, vec3(0.224,0.259,0.298), l1*0.30);
         float f5=vWY/5.0; float w5=fwidth(f5); float d5=abs(fract(f5-0.5)-0.5);
         float l5=(1.0-smoothstep(0.0,w5,d5))*(1.0-smoothstep(0.10,0.26,w5));
         gl_FragColor.rgb=mix(gl_FragColor.rgb, vec3(0.051,0.067,0.086), l5*0.45);
         #include <dithering_fragment>`,
      )
    }
    m.customProgramCacheKey = () => 'pudl-terrain'
    return m
  }, [])

  return <mesh geometry={geo} material={mat} receiveShadow />
}

function Sea() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEA_Y, 0]}>
      <planeGeometry args={[W * 1.4, W * 1.4, 1, 1]} />
      <meshBasicMaterial color={C.DEEP} transparent opacity={0.96} />
    </mesh>
  )
}

// ---------------------------------------------------------------- rivers (pools)
interface Reach {
  river: River
  curve: THREE.CatmullRomCurve3
  geo: THREE.BufferGeometry
  home: THREE.Vector3
  owned: boolean
}

function useNetwork(rivers: River[], ownedIds: Set<string>, height: ReturnType<typeof useHeight>): Reach[] {
  return useMemo(() => {
    const top = rivers.slice(0, 18)
    const maxVol = Math.max(...top.map((r) => r.vol24h), 1)
    let seed = 1337
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

    // spread river mouths evenly along the sea edge so they don't converge into
    // one delta; each source sits back in the uplands at a varied distance
    const order = top.map((_, i) => i).sort(() => rnd() - 0.5)

    return top.map((river, i) => {
      const slot = order.indexOf(i)
      const mouthZ = (slot / (top.length - 1) - 0.5) * (W * 0.86)
      const mouth = new THREE.Vector3(-W * 0.48, 0, mouthZ + (rnd() - 0.5) * 6)
      // source back in the uplands, varied reach length + lateral offset
      const reach = 0.55 + rnd() * 0.4
      const src = new THREE.Vector3(-W * 0.48 + W * reach, 0, mouthZ + (rnd() - 0.5) * W * 0.28)
      const pts: THREE.Vector3[] = []
      const steps = 8
      const wind = (rnd() - 0.5) * 2
      for (let s = 0; s <= steps; s++) {
        const t = s / steps
        const x = src.x + (mouth.x - src.x) * t
        const z = src.z + (mouth.z - src.z) * t + Math.sin(t * Math.PI * 2 + wind * 3) * (1 - t * 0.6) * 12 * wind
        pts.push(new THREE.Vector3(x, 0, z))
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      // ribbon
      const width = 1.1 + Math.sqrt(river.vol24h / maxVol) * 6.5
      const div = 60
      const P: number[] = [], UV: number[] = [], IDX: number[] = []
      const up = new THREE.Vector3(0, 1, 0)
      for (let s = 0; s <= div; s++) {
        const t = s / div
        const p = curve.getPoint(t)
        const tan = curve.getTangent(t).setY(0).normalize()
        const nrm = new THREE.Vector3().crossVectors(up, tan).normalize()
        const y = height.heightAt(p.x, p.z)
        const hw = (width / 2) * (0.55 + t * 0.6) // widens toward the mouth
        const l = new THREE.Vector3(p.x + nrm.x * hw, y + 0.12, p.z + nrm.z * hw)
        const r = new THREE.Vector3(p.x - nrm.x * hw, y + 0.12, p.z - nrm.z * hw)
        P.push(l.x, l.y, l.z, r.x, r.y, r.z)
        UV.push(-1, t * 8, 1, t * 8)
        if (s < div) {
          const a = s * 2
          IDX.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
        }
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3))
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2))
      geo.setIndex(IDX)
      geo.computeVertexNormals()
      // home on the bank near the upper third
      const hp = curve.getPoint(0.32)
      const htan = curve.getTangent(0.32).setY(0).normalize()
      const hn = new THREE.Vector3().crossVectors(up, htan).normalize()
      const home = new THREE.Vector3(hp.x + hn.x * (width / 2 + 3), 0, hp.z + hn.z * (width / 2 + 3))
      home.y = height.heightAt(home.x, home.z)
      return { river, curve, geo, home, owned: ownedIds.has(river.id) }
    })
  }, [rivers, ownedIds, height])
}

function waterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFlow: { value: 0.4 },
      uHi: { value: 0 },
      uDeep: { value: col(C.DEEP) },
      uShallow: { value: col(C.SHALLOW) },
      uInk: { value: col(C.INK) },
      uAcid: { value: col(C.ACID) },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime,uFlow,uHi; uniform vec3 uDeep,uShallow,uInk,uAcid;
      void main(){
        float edge=abs(vUv.x);
        vec3 c=mix(uDeep,uShallow,pow(edge,0.7));
        float bank=smoothstep(0.90,0.90+fwidth(edge)*2.0,edge);
        c=mix(c,uInk,bank*0.85);
        float streak=sin(vUv.y*7.0-uTime*uFlow*6.0);
        float streak2=sin(vUv.y*2.3-uTime*uFlow*3.0);
        c+=streak*0.03*(1.0-edge);
        c+=max(streak2,0.0)*0.05*(1.0-abs(vUv.x));
        c=mix(c,uAcid,uHi*(0.5+0.3*max(streak,0.0)));
        gl_FragColor=vec4(c,0.95);
      }`,
  })
}

function Rivers({ network, selected, onSelect }: { network: Reach[]; selected: string | null; onSelect: (r: River, hover: boolean) => void }) {
  const mats = useMemo(() => network.map((rc) => {
    const m = waterMaterial()
    const act = Math.min(Math.log10(1 + rc.river.vol24h / Math.max(rc.river.tvl, 1)) * 0.5, 1.2)
    m.uniforms.uFlow.value = 0.15 + act
    if (rc.owned) m.uniforms.uHi.value = 0.5
    return m
  }), [network])
  const [hover, setHover] = useState<number | null>(null)

  useFrame((s) => {
    for (let i = 0; i < mats.length; i++) {
      mats[i].uniforms.uTime.value = s.clock.elapsedTime
      const rc = network[i]
      const on = selected === rc.river.id || hover === i
      const target = on ? 1 : rc.owned ? 0.5 : 0
      mats[i].uniforms.uHi.value += (target - mats[i].uniforms.uHi.value) * 0.15
    }
  })

  return (
    <group>
      {network.map((rc, i) => (
        <mesh
          key={rc.river.id}
          geometry={rc.geo}
          material={mats[i]}
          renderOrder={2}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(i); document.body.style.cursor = 'crosshair'; onSelect(rc.river, true) }}
          onPointerOut={() => { setHover(null); document.body.style.cursor = 'default' }}
          onClick={(e) => { e.stopPropagation(); onSelect(rc.river, false) }}
        />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- homes
function gableGeo() {
  const body = new THREE.BoxGeometry(2, 1.5, 2.4)
  body.translate(0, 0.75, 0)
  const roof = new THREE.CylinderGeometry(0, 1.55, 1.1, 4, 1)
  roof.rotateY(Math.PI / 4)
  roof.scale(1, 1, 1.1)
  roof.translate(0, 2.05, 0)
  return { body, roof }
}

function Homes({ network }: { network: Reach[] }) {
  const { body, roof } = useMemo(gableGeo, [])
  const others = network.filter((r) => !r.owned)
  const mine = network.filter((r) => r.owned)
  return (
    <group>
      {/* the crowd of homes — instanced, 2 draws */}
      <Instances geometry={body} limit={200} castShadow receiveShadow>
        <meshToonMaterial color={C.BONE} />
        {others.map((rc, i) => (
          <Instance key={i} position={[rc.home.x, rc.home.y, rc.home.z]} rotation={[0, (i * 1.7) % Math.PI, 0]} />
        ))}
      </Instances>
      <Instances geometry={roof} limit={200} castShadow>
        <meshToonMaterial color={C.ROOF} />
        {others.map((rc, i) => (
          <Instance key={i} position={[rc.home.x, rc.home.y, rc.home.z]} rotation={[0, (i * 1.7) % Math.PI, 0]} />
        ))}
      </Instances>
      {/* your homes — acid roof + a leader line so you find them from any angle */}
      {mine.map((rc, i) => (
        <group key={i} position={[rc.home.x, rc.home.y, rc.home.z]}>
          <mesh geometry={body} castShadow receiveShadow><meshToonMaterial color={C.BONE} /></mesh>
          <mesh geometry={roof} castShadow><meshToonMaterial color={C.ACID} /></mesh>
          <line>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 2, 0, 0, 9, 0]), 3]} />
            </bufferGeometry>
            <lineBasicMaterial color={C.ACID} transparent opacity={0.6} />
          </line>
        </group>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- grass
function Grass({ height }: { height: ReturnType<typeof useHeight> }) {
  const geo = useMemo(() => new THREE.ConeGeometry(0.06, 0.5, 5), [])
  const inst = useMemo(() => {
    const arr: [number, number, number, number][] = []
    let seed = 99
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
    for (let k = 0; k < 6500; k++) {
      const x = (rnd() - 0.5) * W * 0.95
      const z = (rnd() - 0.5) * W * 0.95
      const h = height.heightAt(x, z)
      if (h < SEA_Y + 1.2 || h > 8.5) continue
      arr.push([x, h, z, 0.6 + rnd() * 0.8])
    }
    return arr
  }, [height])
  return (
    <Instances geometry={geo} limit={inst.length} castShadow>
      <meshToonMaterial color={C.MEADOW} />
      {inst.map(([x, y, z, s], i) => (
        <Instance key={i} position={[x, y + 0.25 * s, z]} scale={s} />
      ))}
    </Instances>
  )
}

// stylized trees — merged trunk + canopy, instanced, clustered in the meadow
function Trees({ height }: { height: ReturnType<typeof useHeight> }) {
  const geo = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.16, 0.22, 1.3, 5)
    trunk.translate(0, 0.65, 0)
    const canopy = new THREE.ConeGeometry(1.0, 2.4, 6)
    canopy.translate(0, 2.4, 0)
    // color the two parts via vertex colors so one material works
    const merge = (g: THREE.BufferGeometry, c: THREE.Color) => {
      const n = g.attributes.position.count
      const arr = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    }
    merge(trunk, col('#4a3f30'))
    merge(canopy, col('#4f5d3f'))
    trunk.deleteAttribute('uv'); canopy.deleteAttribute('uv')
    trunk.deleteAttribute('normal'); canopy.deleteAttribute('normal')
    const m = mergeSimple([trunk, canopy])
    m.computeVertexNormals()
    return m
  }, [])
  const inst = useMemo(() => {
    const arr: [number, number, number, number][] = []
    let seed = 7
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
    for (let k = 0; k < 620; k++) {
      const x = (rnd() - 0.5) * W * 0.92
      const z = (rnd() - 0.5) * W * 0.92
      const h = height.heightAt(x, z)
      if (h < SEA_Y + 1.4 || h > 11) continue
      arr.push([x, h, z, 0.7 + rnd() * 0.9])
    }
    return arr
  }, [height])
  return (
    <Instances geometry={geo} limit={inst.length} castShadow>
      <meshToonMaterial vertexColors />
      {inst.map(([x, y, z, s], i) => (
        <Instance key={i} position={[x, y, z]} scale={s} rotation={[0, (i * 2.3) % Math.PI, 0]} />
      ))}
    </Instances>
  )
}

// minimal geometry merge (avoids importing BufferGeometryUtils)
function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry()
  let posLen = 0, colLen = 0
  for (const g of geos) { posLen += g.attributes.position.array.length; colLen += (g.attributes.color?.array.length ?? 0) }
  const pos = new Float32Array(posLen), colr = new Float32Array(colLen)
  let po = 0, co = 0
  for (const g of geos) {
    pos.set(g.attributes.position.array as Float32Array, po); po += g.attributes.position.array.length
    if (g.attributes.color) { colr.set(g.attributes.color.array as Float32Array, co); co += g.attributes.color.array.length }
  }
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('color', new THREE.BufferAttribute(colr, 3))
  return out
}

function Scene({ rivers, nets, onCast }: { rivers: River[]; nets: MyNet[]; onCast: (r: River) => void }) {
  const height = useHeight()
  const ownedIds = useMemo(() => new Set(nets.filter((n) => n.status === 'live' || n.status === 'opening').map((n) => n.poolId)), [nets])
  const network = useNetwork(rivers, ownedIds, height)
  const [sel, setSel] = useState<{ r: River; x: number; y: number; z: number } | null>(null)

  const onSelect = (r: River, hover: boolean) => {
    const rc = network.find((n) => n.river.id === r.id)
    const p = rc ? rc.curve.getPoint(0.4) : new THREE.Vector3()
    setSel({ r, x: p.x, y: height.heightAt(p.x, p.z) + 2, z: p.z })
    if (!hover) onCast(r)
  }

  return (
    <>
      <color attach="background" args={[C.BONE]} />
      <fog attach="fog" args={[C.BONE, 150, 460]} />
      <hemisphereLight args={[C.SKY, '#3a2f22', 0.5]} />
      <directionalLight
        color={C.SUN}
        intensity={1.15}
        position={[60, 90, 40]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={110}
        shadow-camera-bottom={-110}
        shadow-camera-near={20}
        shadow-camera-far={320}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />
      <Terrain height={height} />
      <Sea />
      <Grass height={height} />
      <Trees height={height} />
      <Rivers network={network} selected={sel?.r.id ?? null} onSelect={onSelect} />
      <Homes network={network} />

      {sel && (
        <Html position={[sel.x, sel.y, sel.z]} center style={{ pointerEvents: 'none' }} distanceFactor={90} zIndexRange={[8, 0]}>
          <div className="border border-line bg-black/85 backdrop-blur px-2 py-1 whitespace-nowrap -translate-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white">{sel.r.name}</span>
              <span className="mono text-[10px] font-bold tnum" style={{ color: sel.r.boostPer1k > 0 ? '#ffb347' : '#e8ff1e' }}>{fmtUsd(sel.r.totalPer1k)}/1k</span>
            </div>
            <div className="mono text-[8.5px] text-white/40 mt-0.5 uppercase tracking-wider">{fmtUsd(sel.r.vol24h)} vol · click to cast</div>
          </div>
        </Html>
      )}

      <OrbitControls
        target={[0, 2, 0]}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.35}
        maxPolarAngle={1.2}
        minDistance={40}
        maxDistance={260}
        autoRotate
        autoRotateSpeed={0.12}
      />
    </>
  )
}

export function World3D({ rivers, nets = [], onCast }: { rivers: River[]; nets?: MyNet[]; onCast: (r: River) => void }) {
  // r3f sometimes mounts the canvas before the flex container measures — nudge it
  useMemo(() => {
    if (typeof window !== 'undefined') requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
  }, [])
  return (
    <Canvas flat shadows dpr={[1, 2]} camera={{ fov: 46, near: 0.5, far: 1200, position: [76, 98, 88] }} gl={{ antialias: true }}>
      <Scene rivers={rivers} nets={nets} onCast={onCast} />
    </Canvas>
  )
}
