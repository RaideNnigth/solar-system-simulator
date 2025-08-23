# 🌌 Solar System Simulator

An interactive **WebGL2** Solar System simulator built with plain JavaScript.  
It renders planets, the Moon, and their orbits based on ephemeris data (1800–2030), allowing free camera navigation and time control.

<img width="1915" height="905" alt="image" src="https://github.com/user-attachments/assets/e66b4bb0-648e-4856-bb81-0b2fb81e2fbb" />

---

## ✨ Features
- Real-time 3D visualization of the Solar System.
- Planets, Moon, and Sun rendered with high-resolution realistic textures.
- Orbits calculated from real ephemeris data (NASA/Horizons).
- Time control (fast-forward, rewind, accelerate, pause).
- Orbiting camera for full scene exploration.
- **GLSL shaders** for advanced effects (Sun, background, orbits).

---

## 🗂️ Project Structure
```
.
├── index.html          # Main entry point
├── main.js             # Simulator bootstrap
├── style.css           # UI styles
├── SolarisEngine/      # Core rendering engine
│   ├── Engine.js       # Main simulation & render loop
│   ├── Camera.js       # Orbiting camera controls
│   ├── Planet.js       # Planet class
│   ├── Moon.js         # Moon class
│   ├── Sun.js          # Sun rendering with shaders
│   ├── Orbit.js        # Orbit rendering
│   ├── Ephemeris.js    # Ephemeris data parser & interpolation
│   ├── Shader.js       # Shader abstraction for WebGL
│   └── shaderFiles/    # GLSL shader sources
│       ├── background.vert.glsl
│       ├── background.frag.glsl
│       ├── sun.vert.glsl
│       ├── sun.frag.glsl
│       └── ...
├── assets/             # Textures and images
│   ├── 8k\_mars.jpg
│   ├── 8k\_jupiter.jpg
│   ├── 2k\_earth\_daymap.jpg
│   └── background\_sky.jpg
└── assets/data/        # Ephemeris data files
├── earth-1800-2030.txt
├── mars-1800-2030.txt
├── halley-1800-2030.txt
└── ...

````

---

## 🚀 Getting Started

### 1. Requirements
- A browser with **WebGL2** support (Chrome, Firefox, Edge).
- A local web server (needed to load textures and `.txt` data files).

### 2. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/solar-system-simulator.git
cd solar-system-simulator
````

### 3. Run locally

You can serve it with a simple local server:

**With Python (3.x):**

```bash
python -m http.server 8080
```

**With Node.js (http-server):**

```bash
npm install -g http-server
http-server .
```

Then open in your browser:

```
http://localhost:8080
```

---

## 🎮 Controls

* **Mouse drag** → Rotate the camera.
* **Scroll wheel** → Zoom in/out.
* **Time slider** → Control simulation speed.
* **Play/Pause button** → Freeze or resume time.

---

## 🔬 Ephemeris Data

Files inside `assets/data/` contain astronomical positions in the format:

```
year, day, hour, x, y, z (in AU)
```

The engine (`Ephemeris.js`) interpolates these values to update planet positions in real time.

---

## 🖼️ Shaders

Custom GLSL shaders power the rendering:

* **Sun** (`sun.frag.glsl`, `sun.vert.glsl`) → solar corona effects.
* **Orbits** (`orbit.*.glsl`) → fading orbital trails.
* **Background** (`background.*.glsl`) → dynamic starfield.

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

## 👨‍💻 Author

Developed by **Gustavo Pinzon Pereira** as a study project in WebGL, 3D simulation, and computational astronomy.

```

---

Do you want me to also include **preview images or GIFs** in the README (so people see the simulator right away), or should I keep it clean with text only?
```
