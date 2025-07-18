import Engine from './SolarisEngine/Engine.js';
import Camera from './SolarisEngine/Camera.js';
import Sphere from './SolarisEngine/Sphere.js';
import RouteLine from './SolarisEngine/RouteLine.js';

function loadTextureAsync(gl, url) {
    return new Promise((resolve, reject) => {
        const texture = gl.createTexture();
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            resolve(texture);
        };
        image.onerror = reject;
        image.src = url;
    });
}

function loadCSVEphemeris(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(text => {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                // remove header
                lines.shift(); // Assuming the first line is a header
                const startYear = parseInt(lines[0].split(',')[0]) || 2023; // Default to 2023 if not specified

                const data = lines.map(line => {
                    const [year, day, hour, x, y, z] = line.split(',').map(Number);
                    const totalHours = (year - startYear) * 8760 + (day - 1) * 24 + hour;
                    return { time: totalHours, x, y, z };
                });
                resolve(data);
            })
            .catch(reject);
    });
}


// 1. Create engine
const canvas = document.getElementById('canvas');
const engine = new Engine(canvas);

// 2. Load shaders
engine.createProgram(
    `
precision mediump float;

attribute vec3 a_position;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

varying vec2 v_uv;

void main() {
    v_uv = a_uv;
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
`,
    `
precision mediump float;

uniform sampler2D u_textureId;
varying vec2 v_uv;

void main() {
    gl_FragColor = texture2D(u_textureId, v_uv);
}
`
);

// 3. Get locations
engine.getAttribLocation("a_position");
engine.getAttribLocation("a_uv");
engine.getUniformLocation("u_model");
engine.getUniformLocation("u_view");
engine.getUniformLocation("u_projection");
engine.getUniformLocation("u_textureId");

// 4. Create camera

const camera = new Camera(
    canvas.width,
    canvas.height,
    [0, 50, 0],       // 50 units above, Y-axis
    [0, 0, 0],        // Looking at the Sun
    [0, 0, -1]        // "Up" is the -Z axis (to avoid gimbal lock)
);
engine.setCamera(camera);

// 5. Load textures
Promise.all([
    loadTextureAsync(engine.gl, 'assets/2k_earth_daymap.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_mars.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_sun.jpg'),
    loadCSVEphemeris('assets/data/earth_ephemeris.csv'),
    loadCSVEphemeris('assets/data/venus_ephemeris.csv'),
]).then(([earthTexture, marsTexture, sunTexture, earthEphemerisData, venusEphemerisData]) => {

    // -1.0.0 Convert planet sizes from km to AU
    const scaleFactor = 1; // Arbitrary scale factor for visualization
    const AU = 149597870.7;
    const sunRadiusKm = 696350;
    const earthRadiusKm = 6378;
    const sunRadiusAU = (sunRadiusKm / AU) * 10;
    const earthRadiusAU = (earthRadiusKm / AU) * 1000;


    // 6.0.1 Create a sphere for earth planet
    const earth = new Sphere('Earth', 1, 32, 32, [0, 0, 0], [0, 0, 0], [earthRadiusAU, earthRadiusAU, earthRadiusAU], earthEphemerisData);
    earth.setBuffers(engine.gl);
    earth.setTexture(earthTexture);

    // 6.0.2 Create a route line for Earth
    const earthRoute = new RouteLine('EarthRoute', earthEphemerisData);
    earthRoute.setBuffers(engine.gl);

    // 6.0.3 Create a route line for Venus
    const venusRoute = new RouteLine('VenusRoute', venusEphemerisData);
    venusRoute.setBuffers(engine.gl);

    // 6.0.2 Create a sphere for Sun
    const sun = new Sphere('Sun', 1.5, 32, 32, [0, 0, 0], [0, 0, 0], [sunRadiusAU, sunRadiusAU, sunRadiusAU]);
    sun.setBuffers(engine.gl);
    sun.setTexture(sunTexture);

    engine.addObject(earthRoute);
    engine.addObject(venusRoute);
    engine.addObject(earth);
    engine.addObject(sun);

    // 7. Start the loop
    engine.start();
});

// 9. Handle time scale
const timeScaleSlider = document.getElementById('timeScale');
timeScaleSlider.addEventListener('input', () => {
    const scale = parseFloat(timeScaleSlider.value);
    engine.setTimeScale(scale);
});

// 10. Handle body selection
const bodySelect = document.getElementById('body');
bodySelect.addEventListener('change', () => {
    const selectedBody = bodySelect.value;
    // Look at the selected body
    engine.fixCameraOnObject(
        selectedBody
    );
});

// 11. Handle camera position, zoom and yaw
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;
let pitch = 0;
let radius = 50;
let target = [0, 0, 0];

function updateCameraPosition() {
    const x = radius * Math.cos(pitch) * Math.sin(yaw);
    const y = radius * Math.sin(pitch);
    const z = radius * Math.cos(pitch) * Math.cos(yaw);

    camera.lookAt([x, y, z], target, [0, 1, 0]);
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    yaw += dx * 0.005;
    pitch += dy * -0.005;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // Limit pitch to avoid gimbal lock
    updateCameraPosition();
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius += e.deltaY * 0.05; // Zoom in/out
    radius = Math.max(10, Math.min(200, radius)); // Limit zoom range
    updateCameraPosition();
});