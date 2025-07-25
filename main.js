import Engine from './SolarisEngine/Engine.js';
import Camera from './SolarisEngine/Camera.js';
import Sphere from './SolarisEngine/Sphere.js';
import RouteLine from './SolarisEngine/RouteLine.js';
import SunShader from './SolarisEngine/SunShader.js';
import BillBoard from './SolarisEngine/BillBoard.js';

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
const sunCoronaVertexShaderSource = await fetch('SolarisEngine/shaderFiles/sun.vert.glsl').then(r => r.text());
const sunCoronaFragmentShaderSource = await fetch('SolarisEngine/shaderFiles/sun.frag.glsl').then(r => r.text());

const sunCoronaProgram = engine.createProgram(sunCoronaVertexShaderSource, sunCoronaFragmentShaderSource);
const sunCoronaShader = new SunShader(engine.gl, sunCoronaProgram);


// 2.2 attach shaders to programlist
engine.setPrograms(
    {
        'Sun': sunCoronaProgram,
        'default': defaultProgram,
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
    loadTXTEphemeris('assets/data/halley-1800-2030.txt')
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
            halleyEphemerisData
        ]
    ) => {

        // -1.0.0 Convert planet sizes from km to AU
        const scaleFactor = 1000; // Arbitrary scale factor for visualization
        const sunScaleFactor = 60; // Scale factor for the Sun
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


        // 6.0.1 Create a sphere for earth planet || Create a route line for Earth
        const earth = new Sphere('Earth', 1, 32, 32, [0, 0, 0], [0, 0, 0], [earthRadiusAU, earthRadiusAU, earthRadiusAU], earthEphemerisData);
        earth.setBuffers(engine.gl);
        earth.setTexture(earthTexture);
        const earthRoute = new RouteLine('EarthRoute', earthEphemerisData, 1);
        earthRoute.setBuffers(engine.gl);

        // 6.0.2 Create a sphere for Venus || Create a route line for Venus
        const venus = new Sphere('Venus', 1, 32, 32, [0, 0, 0], [0, 0, 0], [venusRadiusAU, venusRadiusAU, venusRadiusAU], venusEphemerisData);
        venus.setBuffers(engine.gl);
        venus.setTexture(venusTexture);
        const venusRoute = new RouteLine('VenusRoute', venusEphemerisData, 1);
        venusRoute.setBuffers(engine.gl);

        // 6.0.3 Create a sphere for Mars || Create a route line for Mars
        const mars = new Sphere('Mars', 1, 32, 32, [0, 0, 0], [0, 0, 0], [marsRadiusAU, marsRadiusAU, marsRadiusAU], marsEphemerisData);
        mars.setBuffers(engine.gl);
        mars.setTexture(marsTexture);
        const marsRoute = new RouteLine('MarsRoute', marsEphemerisData, 1);
        marsRoute.setBuffers(engine.gl);

        // 6.0.4 Create a sphere for Neptune
        const neptune = new Sphere('Neptune', 1, 32, 32, [0, 0, 0], [0, 0, 0], [neptuneRadiusAU, neptuneRadiusAU, neptuneRadiusAU], neptuneEphemerisData);
        neptune.setBuffers(engine.gl);
        neptune.setTexture(neptuneTexture);
        const neptuneRoute = new RouteLine('NeptuneRoute', neptuneEphemerisData);
        neptuneRoute.setBuffers(engine.gl);

        // 6.0.5 Create a sphere for Uranus
        const uranus = new Sphere('Uranus', 1, 32, 32, [0, 0, 0], [0, 0, 0], [uranusRadiusAU, uranusRadiusAU, uranusRadiusAU], uranusEphemerisData);
        uranus.setBuffers(engine.gl);
        uranus.setTexture(uranusTexture);
        const uranusRoute = new RouteLine('UranusRoute', uranusEphemerisData);
        uranusRoute.setBuffers(engine.gl);

        // 6.0.6 Create a sphere for Saturn
        const saturn = new Sphere('Saturn', 1, 32, 32, [0, 0, 0], [0, 0, 0], [saturnRadiusAU, saturnRadiusAU, saturnRadiusAU], saturnEphemerisData);
        saturn.setBuffers(engine.gl);
        saturn.setTexture(saturnTexture);
        const saturnRoute = new RouteLine('SaturnRoute', saturnEphemerisData);
        saturnRoute.setBuffers(engine.gl);

        // 6.0.7 Create a sphere for Jupiter
        const jupiter = new Sphere('Jupiter', 1, 32, 32, [0, 0, 0], [0, 0, 0], [jupiterRadiusAU, jupiterRadiusAU, jupiterRadiusAU], jupiterEphemerisData);
        jupiter.setBuffers(engine.gl);
        jupiter.setTexture(jupiterTexture);
        const jupiterRoute = new RouteLine('JupiterRoute', jupiterEphemerisData);
        jupiterRoute.setBuffers(engine.gl);

        // 6.0.8 Create a sphere for Mercury
        const mercury = new Sphere('Mercury', 1, 32, 32, [0, 0, 0], [0, 0, 0], [mercuryRadiusAU, mercuryRadiusAU, mercuryRadiusAU], mercuryEphemerisData);
        mercury.setBuffers(engine.gl);
        mercury.setTexture(mercuryTexture);
        const mercuryRoute = new RouteLine('MercuryRoute', mercuryEphemerisData, 1);
        mercuryRoute.setBuffers(engine.gl);

        // 6.0.99 Create a Corona effect that always follows camera
        const sun = new BillBoard('Sun', sunCoronaShader, sunRadiusAU);
        sun.setBuffers(engine.gl);
        sun.setTexture(iChannel0Texture)
        sun.position = [0, 0, 0];

        // 6.1.0 Create Voyager 1
        const voyager1 = new Sphere('Voyager1', 1, 32, 32, [0, 0, 0], [0, 0, 0], [earthRadiusAU, earthRadiusAU, earthRadiusAU], voyagerEphemerisData);
        voyager1.setBuffers(engine.gl);
        voyager1.setTexture(redTexture);

        // 6.1.2 Create Voyager 1
        const voyager2 = new Sphere('Voyager2', 1, 32, 32, [0, 0, 0], [0, 0, 0], [earthRadiusAU, earthRadiusAU, earthRadiusAU], voyager2EphemerisData);
        voyager2.setBuffers(engine.gl);
        voyager2.setTexture(redTexture);

        // 6.2.0 Create Halley's Comet
        const halley = new Sphere('Halley', 1, 32, 32, [0, 0, 0], [0, 0, 0], [earthRadiusAU, earthRadiusAU, earthRadiusAU], halleyEphemerisData);
        halley.setBuffers(engine.gl);
        halley.setTexture(redTexture);
        const halleyRoute = new RouteLine('HalleyRoute', halleyEphemerisData, 1);
        halleyRoute.setBuffers(engine.gl);

        // 7 Add objects to the engine
        engine.addObject(sun);
        engine.addObject(earthRoute);
        engine.addObject(venusRoute);
        engine.addObject(earth);
        engine.addObject(marsRoute);
        engine.addObject(mars);
        engine.addObject(venus);
        engine.addObject(neptuneRoute);
        engine.addObject(neptune);
        engine.addObject(uranusRoute);
        engine.addObject(uranus);
        engine.addObject(saturnRoute);
        engine.addObject(saturn);
        engine.addObject(jupiterRoute);
        engine.addObject(jupiter);
        engine.addObject(mercuryRoute);
        engine.addObject(mercury);
        engine.addObject(voyager1);
        engine.addObject(halley);
        engine.addObject(halleyRoute);

    });

// 7. Start the loop
engine.start();

// 9. Handle body selection
const bodySelect = document.getElementById('body');
bodySelect.addEventListener('change', () => {
    const selectedBody = bodySelect.value;
    // Look at the selected body
    engine.fixCameraOnObject(
        selectedBody
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
document.querySelector('.forward').onclick = () => engine.setTimeScale(20000);
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

    engine.setCurrentTime({ year, month, day, hour, minute });
});