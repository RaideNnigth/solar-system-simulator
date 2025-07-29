import Engine from './SolarisEngine/Engine.js';
import Camera from './SolarisEngine/Camera.js';
import Planet from './SolarisEngine/Planet.js';
import Moon from './SolarisEngine/Moon.js';
import Orbit from './SolarisEngine/Orbit.js';
import Sun from './SolarisEngine/Sun.js';
import Background from './SolarisEngine/Background.js';

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

function loadTXTEphemeris(url) {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => response.text())
            .then(text => {
                resolve(parseHorizonsData(text));
            });
    });
}

function parseHorizonsData(text) {
    const lines = text.split('\n');
    const data = [];
    const KM_TO_AU = 1 / 149597870.7;

    // Julian Date for 1800-01-01 00:00 UT
    const baseJulian = 2378497;

    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];

        if (!line.includes('=')) continue;
        if (!nextLine.includes('X =')) continue;

        const julianMatch = line.match(/^(\d+\.\d+)/);
        const xMatch = nextLine.match(/X\s*=\s*([-\d.E+]+)/);
        const yMatch = nextLine.match(/Y\s*=\s*([-\d.E+]+)/);
        const zMatch = nextLine.match(/Z\s*=\s*([-\d.E+]+)/);

        if (!julianMatch || !xMatch || !yMatch || !zMatch) continue;

        const julian = parseFloat(julianMatch[1]);
        const x = parseFloat(xMatch[1]) * KM_TO_AU;
        const y = parseFloat(yMatch[1]) * KM_TO_AU;
        const z = parseFloat(zMatch[1]) * KM_TO_AU;

        if (baseJulian === null) baseJulian = julian;

        const timeInHours = (julian - baseJulian) * 24;

        data.push({ time: timeInHours, x, y, z });
    }

    return data;
}

// 1. Create engine
const canvas = document.getElementById('canvas');
const engine = new Engine(canvas);

// 2. Load shaders
const vertexShaderSource = await fetch('SolarisEngine/shaderFiles/default.vert.glsl').then(r => r.text());
const fragmentShaderSource = await fetch('SolarisEngine/shaderFiles/default.frag.glsl').then(r => r.text());
const defaultProgram = engine.createProgram(vertexShaderSource, fragmentShaderSource);

// 2.1.2 Corona Sun Shader
const sunVertexShaderSource = await fetch('SolarisEngine/shaderFiles/sun.vert.glsl').then(r => r.text());
const sunFragmentShaderSource = await fetch('SolarisEngine/shaderFiles/sun.frag.glsl').then(r => r.text());
const sunProgram = engine.createProgram(sunVertexShaderSource, sunFragmentShaderSource);

//2.1.3 Create line fader
const orbitVertex = await fetch('SolarisEngine/shaderFiles/orbit.vert.glsl').then(r => r.text());
const orbitFragment = await fetch('SolarisEngine/shaderFiles/orbit.frag.glsl').then(r => r.text());
const orbitProgram = engine.createProgram(orbitVertex, orbitFragment);


//2.1.4 Create background shader
const bgVertex = await fetch('SolarisEngine/shaderFiles/background.vert.glsl').then(r => r.text());
const bgFrag = await fetch('SolarisEngine/shaderFiles/background.frag.glsl').then(r => r.text());
const bgProgram = engine.createProgram(bgVertex, bgFrag);

// 2.2 attach shaders to program list
engine.setPrograms(
    {
        'Default': defaultProgram,
        'Orbit': orbitProgram,
        'Sun': sunProgram,
        'BackGround': bgProgram
    }
);

// 3. Get locations
engine.getAttribLocation(defaultProgram, "a_position");
engine.getAttribLocation(defaultProgram, "a_uv");
engine.getUniformLocation(defaultProgram, "u_model");
engine.getUniformLocation(defaultProgram, "u_view");
engine.getUniformLocation(defaultProgram, "u_projection");
engine.getUniformLocation(defaultProgram, "u_textureId");

// 4. Create camera

const camera = new Camera(
    canvas.width,
    canvas.height,
    [0, 50, 0],        // 50 units above, Y-axis
    [0, 0, 0],         // Looking at the Sun
    [0, 0, -1],        // "Up" is the -Z axis (to avoid gimbal lock)
    0.01,               // Near plane
    1000                // Far plane
);
engine.setCamera(camera);

// 5. Load textures resource and ephemeris data
Promise.all([
    loadTextureAsync(engine.gl, 'assets/2k_earth_daymap.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_mars.jpg'),
    loadTextureAsync(engine.gl, 'assets/4k_venus_atmosphere.jpg'),
    loadTextureAsync(engine.gl, 'assets/2k_neptune.jpg'),
    loadTextureAsync(engine.gl, 'assets/2k_uranus.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_saturn.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_jupiter.jpg'),
    loadTextureAsync(engine.gl, 'assets/8k_mercury.jpg'),
    loadTextureAsync(engine.gl, 'assets/iChannel0.png'),
    loadTextureAsync(engine.gl, 'assets/red.jpg'),
    loadTextureAsync(engine.gl, 'assets/background_sky.jpg'),
    loadTextureAsync(engine.gl, 'assets/2k_moon.jpg'),
    loadTXTEphemeris('assets/data/earth-1800-2030.txt'),
    loadTXTEphemeris('assets/data/venus-1800-2030.txt'),
    loadTXTEphemeris('assets/data/mars-1800-2030.txt'),
    loadTXTEphemeris('assets/data/neptune-1800-2030.txt'),
    loadTXTEphemeris('assets/data/uranus-1800-2030.txt'),
    loadTXTEphemeris('assets/data/saturn-1800-2030.txt'),
    loadTXTEphemeris('assets/data/jupiter-1800-2030.txt'),
    loadTXTEphemeris('assets/data/mercury-1800-2030.txt'),
    loadTXTEphemeris('assets/data/voyager-1977-2030.txt'),
    loadTXTEphemeris('assets/data/voyager2-1977-2030.txt'),
    loadTXTEphemeris('assets/data/halley-1800-2030.txt'),
    loadTXTEphemeris('assets/data/moon-1800-2030.txt'),
]).then(
    (
        [
            earthTexture,
            marsTexture,
            venusTexture,
            neptuneTexture,
            uranusTexture,
            saturnTexture,
            jupiterTexture,
            mercuryTexture,
            iChannel0Texture,
            redTexture,
            backGroundTexture,
            moonTexture,
            earthEphemerisData,
            venusEphemerisData,
            marsEphemerisData,
            neptuneEphemerisData,
            uranusEphemerisData,
            saturnEphemerisData,
            jupiterEphemerisData,
            mercuryEphemerisData,
            voyagerEphemerisData,
            voyager2EphemerisData,
            halleyEphemerisData,
            moonEphemerisData
        ]
    ) => {

        // -1.0.0 Convert planet sizes from km to AU
        const scaleFactor = 1000; // Arbitrary scale factor for visualization
        const sunScaleFactor = 20; // Scale factor for the Sun
        const AU = 149597870.7;
        const sunRadiusKm = 696350;
        const earthRadiusKm = 6378;
        const sunRadiusAU = (sunRadiusKm / AU) * sunScaleFactor;
        const earthRadiusAU = (earthRadiusKm / AU) * scaleFactor;
        const venusRadiusKm = 6051.8;
        const venusRadiusAU = (venusRadiusKm / AU) * scaleFactor;
        const marsRadiusKm = 3389.5;
        const marsRadiusAU = (marsRadiusKm / AU) * scaleFactor;
        const neptuneRadiusKm = 24622;
        const neptuneRadiusAU = (neptuneRadiusKm / AU) * scaleFactor;
        const uranusRadiusKm = 25362;
        const uranusRadiusAU = (uranusRadiusKm / AU) * scaleFactor;
        const saturnRadiusKm = 58232;
        const saturnRadiusAU = (saturnRadiusKm / AU) * scaleFactor;
        const jupiterRadiusKm = 69911;
        const jupiterRadiusAU = (jupiterRadiusKm / AU) * scaleFactor;
        const mercuryRadiusKm = 2439.7;
        const mercuryRadiusAU = (mercuryRadiusKm / AU) * scaleFactor;

        const moonRadiusKm = 1737.4;
        const moonRadiusAU = (moonRadiusKm / AU) * scaleFactor;

        const background = new Background(engine.gl, backGroundTexture, bgProgram);
        engine.setBackground(background);

        // 6 Crate my orbits for all objets
        const mercuryOrbit  = new Orbit(engine.gl, orbitProgram, 10);
        const venusOrbit    = new Orbit(engine.gl, orbitProgram, 50);
        const earthOrbit    = new Orbit(engine.gl, orbitProgram, 100);
        const marsOrbit     = new Orbit(engine.gl, orbitProgram, 100);
        const neptuneOrbit  = new Orbit(engine.gl, orbitProgram, 1000);
        const uranusOrbit   = new Orbit(engine.gl, orbitProgram, 1000);
        const saturnOrbit   = new Orbit(engine.gl, orbitProgram, 1000);
        const jupiterOrbit  = new Orbit(engine.gl, orbitProgram, 1000);
        const halleyOrbit   = new Orbit(engine.gl, orbitProgram, 1000);
        const voyager1Orbit = new Orbit(engine.gl, orbitProgram, 1000);
        const voyager2Orbit = new Orbit(engine.gl, orbitProgram, 1000);

        // 6.1 Create the Planets
        const earth   = new Planet('Earth', [earthRadiusAU, earthRadiusAU, earthRadiusAU], earthEphemerisData, earthTexture, engine.gl, earthOrbit, [0, 1, 0], 0.05);
        const mars    = new Planet('Mars', [marsRadiusAU, marsRadiusAU, marsRadiusAU], marsEphemerisData, marsTexture, engine.gl, marsOrbit, [0, 1, 0], 0.05);
        const venus   = new Planet('Venus', [venusRadiusAU, venusRadiusAU, venusRadiusAU], venusEphemerisData, venusTexture, engine.gl, venusOrbit, [0, 1, 0], 0.05);
        const mercury = new Planet('Mercury', [mercuryRadiusAU, mercuryRadiusAU, mercuryRadiusAU], mercuryEphemerisData, mercuryTexture, engine.gl, mercuryOrbit, [0, 1, 0], 0.05);
        const neptune = new Planet('Neptune', [neptuneRadiusAU, neptuneRadiusAU, neptuneRadiusAU], neptuneEphemerisData, neptuneTexture, engine.gl, neptuneOrbit, [0, 1, 0], 0.05);
        const uranus  = new Planet('Uranus', [uranusRadiusAU, uranusRadiusAU, uranusRadiusAU], uranusEphemerisData, uranusTexture, engine.gl, uranusOrbit, [0, 1, 0], 0.05);
        const saturn  = new Planet('Saturn', [saturnRadiusAU, saturnRadiusAU, saturnRadiusAU], saturnEphemerisData, saturnTexture, engine.gl, saturnOrbit, [0, 1, 0], 0.05);
        const jupiter = new Planet('Jupiter', [jupiterRadiusAU, jupiterRadiusAU, jupiterRadiusAU], jupiterEphemerisData, jupiterTexture, engine.gl, jupiterOrbit, [0, 1, 0], 0.05);

        // 6.1.2 Create the Moon's
        const moon = new Moon('Moon', [moonRadiusAU, moonRadiusAU, moonRadiusAU], moonEphemerisData, moonTexture, engine.gl, [0, 0.3, 0], [0, 1, 0], 0.05);

        // 6.2 Create other objects such as comets and satellites -> Called Planet cause I did not want to create another class for now
        const halley   = new Planet('Halley', [earthRadiusAU, earthRadiusAU, earthRadiusAU], halleyEphemerisData, redTexture, engine.gl, halleyOrbit);
        const voyager1 = new Planet('Voyager1', [earthRadiusAU, earthRadiusAU, earthRadiusAU], voyagerEphemerisData, redTexture, engine.gl, voyager1Orbit);
        const voyager2 = new Planet('Voyager2', [earthRadiusAU, earthRadiusAU, earthRadiusAU], voyager2EphemerisData, redTexture, engine.gl, voyager2Orbit);

        // 7 Add Moons to the engine
        engine.addMoons([moon]);

        // 8 Add planets to the engine
        engine.addPlanets(
            [
                earth, mars, venus, mercury,
                neptune, uranus, saturn, jupiter, 
                halley, voyager1, voyager2
            ]
        );

        // 9 Create a Corona effect that always follows camera
        const sun = new Sun(engine.gl, sunProgram, iChannel0Texture, sunRadiusAU)
        engine.setSun(sun);

        // 10 Add Orbits
        engine.addOrbits(
            [
                earthOrbit, marsOrbit, venusOrbit,
                neptuneOrbit, saturnOrbit, jupiterOrbit,
                mercuryOrbit, uranusOrbit, halleyOrbit,
                voyager1Orbit, voyager2Orbit
            ]
        );

    });

// 7. Start the loop
engine.start();

// 9. Handle body selection
const confirm = document.getElementById('confirm');
confirm.addEventListener('click', () => {
    const bodySelect = document.getElementById('body');
    const selectedBody = bodySelect.value;
    const orbitMode = document.getElementById('orbit').checked;
    // Look at the selected body
    engine.fixCameraOnObject(
        selectedBody, orbitMode
    );
});

// 11. Menu handling
document.querySelector('.toggle-pause-btn').onclick = () => {
    engine.togglePause();
    if (engine.paused) {
        document.querySelector('.toggle-pause-btn').textContent = '▶';
    } else {
        document.querySelector('.toggle-pause-btn').textContent = '⏸';
    }
}
document.querySelector('.backward').onclick = () => engine.setTimeScale(-500);
document.querySelector('.forward').onclick = () => engine.setTimeScale(15000);
document.querySelector('.stop').onclick = () => engine.setTimeScale(1);

document.getElementById('applyTimeBtn').addEventListener('click', () => {
    const year = parseInt(document.getElementById('setYear').value);
    const month = parseInt(document.getElementById('setMonth').value);
    const day = parseInt(document.getElementById('setDay').value);
    const hour = parseInt(document.getElementById('setHour').value);
    const minute = parseInt(document.getElementById('setMinute').value);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        alert('Please enter a valid date and time.');
        return;
    }

    engine.setTargetTime({ year, month, day, hour, minute });
});