import gsap from 'gsap'
import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="experience-shell">
    <video id="bg-video" autoplay muted loop playsinline></video>
    <canvas id="particle-canvas"></canvas>

    <div class="hud hud-left">
      <div class="panel-title">SYSTEM STATUS</div>
      <div class="panel-grid">
        <div>
          <span>STABILIZATION</span>
          <strong id="stability-value">100%</strong>
        </div>
        <div>
          <span>TEMP</span>
          <strong id="temp-value">42° C</strong>
        </div>
      </div>
      <div class="mini-wave">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <div class="hud hud-right">
      <div class="panel-title">VECTOR FLOW</div>
      <div class="bar-group">
        <label>THRUST</label>
        <div class="bar"><span id="thrust-bar" style="width: 72%"></span></div>
      </div>
      <div class="bar-group">
        <label>FLOW</label>
        <div class="bar"><span id="flow-bar" style="width: 56%"></span></div>
      </div>
      <div class="bar-group">
        <label>CORE</label>
        <div class="bar"><span id="core-bar" style="width: 88%"></span></div>
      </div>
    </div>

    <div class="status-panel">
      <div class="status-topline">
        <span class="status-label">GN DRIVE</span>
        <button id="mode-toggle" type="button" aria-pressed="false">TRANS-AM</button>
      </div>

      <div class="status-readout">
        <div>
          <span class="label">MODE</span>
          <strong id="mode-label">NORMAL</strong>
        </div>
        <div>
          <span class="label">CORE</span>
          <strong id="core-label">STABLE</strong>
        </div>
      </div>

      <svg class="signal-wave" viewBox="0 0 420 120" preserveAspectRatio="none" aria-label="signal waveform">
        <path id="wave-path" d="M0,70 L18,58 L36,72 L54,48 L72,62 L90,34 L108,57 L126,50 L144,40 L162,48 L180,61 L198,54 L216,44 L234,35 L252,60 L270,58 L288,50 L306,46 L324,66 L342,52 L360,42 L378,58 L396,70 L420,64" />
      </svg>
    </div>
  </div>
`

const modeToggle = document.querySelector('#mode-toggle')
const modeLabel = document.querySelector('#mode-label')
const coreLabel = document.querySelector('#core-label')
const stabilityValue = document.querySelector('#stability-value')
const tempValue = document.querySelector('#temp-value')
const thrustBar = document.querySelector('#thrust-bar')
const flowBar = document.querySelector('#flow-bar')
const coreBar = document.querySelector('#core-bar')
const wavePath = document.querySelector('#wave-path')
const video = document.querySelector('#bg-video')

const videoUrl = new URL('../assets/gn-drive-loop.mp4', import.meta.url)
video.src = videoUrl.href
video.play().catch(() => {})

const state = {
  mode: 'normal',
  phase: 0,
  temp: 42,
  stability: 100,
  thrust: 72,
  flow: 56,
  core: 88,
}

function updateWave() {
  const points = []
  const baseAmp = state.mode === 'transam' ? 26 : 18
  const baseShift = state.mode === 'transam' ? 1.7 : 1
  for (let i = 0; i <= 420; i += 9) {
    const x = i
    const y = 62 + Math.sin(i * 0.12 + state.phase * baseShift) * baseAmp + Math.sin(i * 0.045 + state.phase * 1.7) * 10
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
  }
  wavePath.setAttribute('d', points.join(' '))
}

function applyMode(nextMode) {
  state.mode = nextMode
  const isTransAM = nextMode === 'transam'
  const accent = isTransAM ? '#ff0055' : '#00ff88'
  const glow = isTransAM ? 'rgba(255, 0, 85, 0.6)' : 'rgba(0, 255, 136, 0.5)'

  state.temp = isTransAM ? 185 : 42
  state.stability = isTransAM ? 100 : 100
  state.thrust = isTransAM ? 94 : 72
  state.flow = isTransAM ? 86 : 56
  state.core = isTransAM ? 100 : 88

  modeLabel.textContent = isTransAM ? 'TRANS-AM' : 'NORMAL'
  coreLabel.textContent = isTransAM ? 'OVERDRIVE' : 'STABLE'
  stabilityValue.textContent = isTransAM ? 'OVERDRIVE' : '100%'
  tempValue.textContent = isTransAM ? '185° C' : '42° C'
  thrustBar.style.width = `${state.thrust}%`
  flowBar.style.width = `${state.flow}%`
  coreBar.style.width = `${state.core}%`

  gsap.to(document.documentElement, {
    duration: 1.2,
    '--accent-color': accent,
    '--accent-glow': glow,
    ease: 'sine.inOut',
  })

  gsap.to(video, {
    duration: 1.2,
    filter: isTransAM
      ? 'hue-rotate(140deg) saturate(2.8) contrast(1.25) brightness(1.08)'
      : 'hue-rotate(0deg) saturate(1.25) contrast(1.1) brightness(0.95)',
    playbackRate: isTransAM ? 2.5 : 1,
    ease: 'sine.inOut',
  })

  gsap.fromTo(
    '.status-panel',
    { boxShadow: '0 0 0 rgba(0,0,0,0)' },
    { duration: 1.1, boxShadow: isTransAM ? '0 0 28px rgba(255, 0, 85, 0.35)' : '0 0 28px rgba(0, 255, 136, 0.2)', ease: 'sine.inOut' }
  )

  modeToggle.textContent = isTransAM ? 'NORMAL MODE' : 'TRANS-AM'
  modeToggle.setAttribute('aria-pressed', String(isTransAM))
}

modeToggle.addEventListener('click', () => {
  applyMode(state.mode === 'normal' ? 'transam' : 'normal')
})

function animateParticles() {
  const canvas = document.querySelector('#particle-canvas')
  const ctx = canvas.getContext('2d')
  const particles = []

  const nozzle = {
    x: 0,
    y: 0,
    radius: 120,
  }

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    nozzle.x = window.innerWidth * 0.78
    nozzle.y = window.innerHeight * 0.46
    nozzle.radius = Math.min(window.innerWidth, window.innerHeight) * 0.16

    particles.length = 0
    const total = 180
    for (let i = 0; i < total; i += 1) {
      particles.push({
        x: nozzle.x + (Math.random() - 0.5) * 90,
        y: nozzle.y + (Math.random() - 0.5) * 120,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 2.4 + 1,
        alpha: Math.random() * 0.7 + 0.2,
        life: Math.random() * 100,
      })
    }
  }

  function draw() {
    const w = window.innerWidth
    const h = window.innerHeight
    ctx.clearRect(0, 0, w, h)

    const color = state.mode === 'normal' ? '#00ff88' : '#ff0055'
    const boost = state.mode === 'transam' ? 1.8 : 1

    for (const p of particles) {
      const dx = p.x - nozzle.x
      const dy = p.y - nozzle.y
      const dist = Math.hypot(dx, dy) || 1

      const swirl = 0.12 + (state.phase * 0.7)
      const angle = Math.atan2(dy, dx) + swirl
      const drift = (nozzle.radius * 0.9) / dist

      p.vx += Math.cos(angle) * 0.08 * boost + (Math.random() - 0.5) * 0.05
      p.vy += Math.sin(angle) * 0.08 * boost + (Math.random() - 0.5) * 0.05
      p.vx *= 0.985
      p.vy *= 0.985

      p.x += p.vx * (5 + drift * 3) * boost
      p.y += p.vy * (5 + drift * 3) * boost

      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || dist > nozzle.radius * 2.8) {
        p.x = nozzle.x + (Math.random() - 0.5) * 28
        p.y = nozzle.y + Math.random() * 30 - 15
        p.vx = (Math.random() - 0.5) * 2.5
        p.vy = -Math.random() * 2.2 - 0.5
      }

      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18)
      const alphaHex = Math.floor(p.alpha * 255).toString(16).padStart(2, '0')
      glow.addColorStop(0, `${color}${alphaHex}`)
      glow.addColorStop(0.25, color)
      glow.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.beginPath()
      ctx.fillStyle = glow
      ctx.arc(p.x, p.y, p.radius * (state.mode === 'transam' ? 7 : 5.5), 0, Math.PI * 2)
      ctx.fill()
    }

    requestAnimationFrame(draw)
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  requestAnimationFrame(draw)
}

function tick() {
  state.phase += 0.08
  const waveBias = state.mode === 'transam' ? 1.65 : 1
  const pulsingTemp = state.mode === 'transam' ? 180 + Math.sin(state.phase * 2.2) * 12 : 42 + Math.sin(state.phase * 1.6) * 3
  const pulsingStability = state.mode === 'transam' ? 100 - Math.sin(state.phase * 2.3) * 8 : 100 - Math.sin(state.phase * 1.2) * 4

  tempValue.textContent = `${Math.round(pulsingTemp)}° C`
  stabilityValue.textContent = state.mode === 'transam' ? `${Math.round(pulsingStability)}%` : '100%'
  stabilityValue.textContent = state.mode === 'transam' ? 'OVERDRIVE' : '100%'

  const targetThrust = state.mode === 'transam' ? 94 : 72
  const targetFlow = state.mode === 'transam' ? 86 : 56
  const targetCore = state.mode === 'transam' ? 100 : 88

  thrustBar.style.width = `${targetThrust + Math.sin(state.phase * 2.4) * 4}%`
  flowBar.style.width = `${targetFlow + Math.cos(state.phase * 1.8) * 6}%`
  coreBar.style.width = `${targetCore + Math.sin(state.phase * 2.7) * 5}%`

  if (state.mode === 'transam') {
    tempValue.textContent = '185° C'
    stabilityValue.textContent = 'OVERDRIVE'
  }

  updateWave()
  requestAnimationFrame(tick)
}

applyMode('normal')
animateParticles()
tick()
