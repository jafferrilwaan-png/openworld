# OpenWorld 3D

![OpenWorld 3D — Cyberpunk Metropolis](./public/preview.jpg)

**OpenWorld 3D** is a next-generation open-world driving and exploration game running directly in the browser, powered by **WebGPU**, **Three.js**, and **Rapier 3D Physics**.

Explore a rain-drenched cyberpunk metropolis, command multiple high-performance vehicles, trigger cinematic bullet-time slow motion, and discover interactive city kiosks.

| | |
|---|---|
| **Author** | [Jaffer Rilwaan](https://github.com/jafferrilwaan-png) |
| **Repository** | [github.com/jafferrilwaan-png/openworld](https://github.com/jafferrilwaan-png/openworld) |
| **Engine & Stack** | Three.js (WebGPU + TSL), Vite, Rapier 3D, GSAP |

---

## Key Features

### 🚗 Multi-Vehicle Physics & Driving
- **Multiple Drivable Vehicles:** Take control of the Police Interceptor SUV, Cyberpunk Sports Car, and City Cruisers.
- **Rapier 3D Physics:** Realistic suspension, wheel friction, drift dynamics, and collision response.
- **Dynamic Engine Audio:** Spatial engine revs, gear shifts, and tire squeals that react to your driving.

### ⏱️ Bullet-Time Slow Motion
- Hold the **Right Mouse Button** anytime to enter cinematic time dilation.
- Physics and camera animations smoothly transition into high-intensity slow motion.

### 🎮 Free Fire Style Garage Loading Experience
- Custom tactical loading screen featuring high-energy character artwork, real-time asset loading indicators, and gameplay tips.

### 🏪 Interactive POAP Kiosks & Tanglish Billboards
- Holographic and metallic POAP kiosks stationed across the city with interactive proximity name recognition.
- Stylized Tanglish neon storefront banners seamlessly integrated into the futuristic architecture.

### 🌧️ WebGPU Real-Time Visuals
- Dynamic GPU collision rain that splashes on rooftops, vehicles, and wet ground.
- Live planar reflections on damp asphalt with cinematic bloom and color grading.

---

## Controls

| Action | Control |
|---|---|
| **Drive / Walk Forward** | `W` or `Up Arrow` |
| **Steer / Turn Left** | `A` or `Left Arrow` |
| **Brake / Reverse** | `S` or `Down Arrow` |
| **Steer / Turn Right** | `D` or `Right Arrow` |
| **Handbrake / Drift** | `Spacebar` |
| **Nitro / Sprint** | `Shift` |
| **Bullet-Time (Slow Motion)** | `Right Mouse Button (Hold)` |
| **Switch Camera** | `C` |
| **Look Around** | Click on canvas to lock mouse |
| **Menu / Settings** | `Esc` |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- A modern browser with **WebGPU** support enabled (Google Chrome, Microsoft Edge, or Chromium-based browsers)

### Installation & Run

1. Clone your repository:
   ```bash
   git clone https://github.com/jafferrilwaan-png/openworld.git
   cd openworld
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

---

## Project Structure

```
openworld/
├── public/                 # 3D Models (.glb), textures, audio, fonts & icons
├── src/
│   ├── main.js             # Game entry point and system orchestrator
│   ├── bootstrap/          # WebGPU renderer, canvas & camera setup
│   ├── world/              # Vehicles, city geometry, physics & weather
│   ├── controls/           # Driving controller & walking physics
│   ├── runtime/            # Game loops, camera director & slow-mo manager
│   ├── post/               # Post-processing pipelines & TSL shaders
│   └── ui/                 # Garage loading UI, HUD & interactive panels
├── package.json            # Project configuration & dependencies
└── vite.config.js          # Vite build & development server config
```

---

## License

This project is maintained by [Jaffer Rilwaan](https://github.com/jafferrilwaan-png). Released under the MIT License.
