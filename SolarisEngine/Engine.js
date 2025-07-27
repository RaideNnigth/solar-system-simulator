export default class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2");
        if (!this.gl) throw new Error("WebGL not supported");

        // Interstellar objects
        this.planets = [];
        this.moons = [];
        this.sun = null;

        // Orbits Section
        this.orbits = [];

        // Time Section
        this.lastTime = 0;
        this.timeScale = 4;      // Time scale for simulation --- Each second in real time corresponds to 1 hour;
        this.simulationTime = 0; // Simulation time in hours from the beggining of the simulation
        this.paused = true;

        // Resize canvas
        this.resize();
        window.addEventListener("resize", () => this.resize());

        // Clear color and depth
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.enable(this.gl.DEPTH_TEST);

        // Enable blend
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.program = {};
        this.attribLocations = {};
        this.uniformLocations = {};

        this.camera = null;
        this.cameraTargetObject = 'None';
        this.startDate = new Date(Date.UTC(1800, 0, 1, 0, 0, 0));
        this.endDate = new Date(Date.UTC(2030, 0, 1, 0, 0, 0));

        // Mouse controls
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.yaw = 0;
        this.pitch = 0;
        this.radius = 50;
        this.target = [0, 0, 0];

        // Performance house keeping boy
        this.lastClockUpdate = 0;

        this.backGround = null;
    }

    start() {
        /*
        * Canvas Mouse controls (Move Around, Zoom In/Out)
        */
        const canvas = this.canvas;
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.yaw += dx * 0.005;
            this.pitch += dy * -0.005;
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch)); // Limit pitch to avoid gimbal lock
            this.updateCameraPosition();
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.radius += e.deltaY * 0.05;
            this.radius = Math.max(10, Math.min(200, this.radius));
            this.updateCameraPosition();
        }, { passive: false });

        requestAnimationFrame(this.loop.bind(this));
    }

    addMoons(objs) {
        this.moons.push(...objs);
    }

    addPlanets(objs) {
        this.planets.push(...objs);
    }

    addOrbits(orbs) {
        this.orbits.push(...orbs);
    }

    removeObject(obj) {
        const i = this.planets.indexOf(obj);
        if (i !== -1) this.planets.splice(i, 1);
    }

    getAttribLocation(program, name) {
        const loc = this.gl.getAttribLocation(program, name);
        this.attribLocations[name] = loc;
        return loc;
    }

    getUniformLocation(program, name) {
        const loc = this.gl.getUniformLocation(program, name);
        this.uniformLocations[name] = loc;
        return loc;
    }

    setPrograms(programs) {
        this.programs = programs;
    }

    setBackground(background) {
        this.backGround = background;
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    setCurrentTime({ year, month, day, hour = 0, minute = 0 }) {
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
        if (date < this.startDate) {
            this.simulationTime = 0;
        } else if (date > this.endDate) {
            const ms = this.endDate.getTime() - this.startDate.getTime();
            this.simulationTime = ms / (1000 * 3600);
        } else {
            const ms = date.getTime() - this.startDate.getTime();
            this.simulationTime = ms / (1000 * 3600); // Convert milliseconds to hours
        }

        // reset orbits soo we dont have any spikes
        if (this.orbits) {
            for (let orbit of this.orbits) {
                orbit.resetPoints();
            }
        }

        // Also update the simulation clock display immediately
        this.updateSimulationClockUI();
    }

    setSun(sun) {
        this.sun = sun;
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
            throw new Error("Vertex shader compile error");
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
            throw new Error("Fragment shader compile error");
        }

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            throw new Error("Program link error");
        }

        return program;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (this.camera) {
            this.camera.updateProjection(this.canvas.width, this.canvas.height);
        }
    }

    fixCameraOnObject(objectName) {
        const object = this.planets.find(obj => obj.name === objectName);
        if (object) {
            this.cameraTargetObject = object;
        } else {
            console.warn(`Object with name ${objectName} not found.`);
            this.cameraTargetObject = 'None';
        }
    }

    updateCameraPosition() {
        const x = this.radius * Math.cos(this.pitch) * Math.sin(this.yaw);
        const y = this.radius * Math.sin(this.pitch);
        const z = this.radius * Math.cos(this.pitch) * Math.cos(this.yaw);

        this.camera.lookAt([x, y, z], this.target, [0, 1, 0]);
    }

    togglePause() {
        this.paused = this.paused ? false : true; // Toggle pause state
    }

    updateSimulationClockUI() {
        const msFromStart = this.simulationTime * 3600 * 1000;
        const simulatedDate = new Date(this.startDate.getTime() + msFromStart);

        // Format parts
        const year = simulatedDate.getUTCFullYear();
        const day = simulatedDate.getUTCDate().toString().padStart(2, '0');
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const monthIndex = simulatedDate.getUTCMonth();
        const month = monthNames[monthIndex];

        let hours = simulatedDate.getUTCHours();
        const minutes = simulatedDate.getUTCMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;

        // Parse current DOM date
        const yearInUse = parseInt(document.getElementById('year')?.textContent || 0);
        const [dayInUse, monthStr] = (document.getElementById('monthDay')?.textContent || '').split(' ');
        const dayNum = parseInt(dayInUse);
        const monthIndexInUse = monthNames.indexOf((monthStr || "").toUpperCase());

        // If anything failed to parse, fallback to update
        if (isNaN(yearInUse) || isNaN(dayNum) || monthIndexInUse === -1) {
            updateDOM();
            return;
        }

        const startTime = this.startDate.getTime();
        const endTime = this.endDate.getTime();
        const simTime = simulatedDate.getTime();

        // Update only if not at the very start or end
        if (simTime >= startTime && simTime <= endTime) {
            updateDOM();
        }

        function updateDOM() {
            document.getElementById('year').textContent = year;
            document.getElementById('monthDay').textContent = `${day} ${month}`;
            document.getElementById('hourMinute').textContent = `${hours} : ${minutes}`;
            document.getElementById('ampm').textContent = ampm;
        }
    }

    loop(currentTime) {
        // Clear the screen
        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw first the background :D Cool stars
        let program = this.programs['BackGround'];
        this.gl.useProgram(program);
        if (this.backGround) {
            if (this.backGround.uniformLocations?.cameraPosition) {
                const camPos = this.camera.eye;
                this.gl.useProgram(program);
                this.gl.uniform3fv(this.backGround.uniformLocations.cameraPosition, new Float32Array(camPos));
            }
            this.backGround.draw();
        }

        // Update camera position and orientation to look at the target object
        if (this.cameraTargetObject !== 'None') {
            const obj = this.cameraTargetObject;
            this.camera.lookAt(
                [obj.position[0], obj.position[1] + 1, obj.position[2]],
                obj.position,
                [0, 0, -1]
            );
        }

        // Calculate delta time and update simulation time if not paused
        // do it outside of the loop to avoid issues with requestAnimationFrame timing for individual planets
        if (!this.paused) {
            let deltaTime = (currentTime - this.lastTime) / 1000;

            // Cap the delta to 0.1s (~10 FPS)
            deltaTime = Math.min(deltaTime, 0.1);

            let simulationDelta = deltaTime * this.timeScale;
            this.simulationTime += simulationDelta;

            if (currentTime - this.lastClockUpdate > 50) {
                this.updateSimulationClockUI();
                this.lastClockUpdate = currentTime;
            }
        }
        // Store the current time for the next frame (always do it even when paused) to avoid jumping frames
        this.lastTime = currentTime;

        // Draw the sun before planets and moons
        if (this.sun) {
            let program = this.programs['Sun'];
            gl.useProgram(program);
            this.sun.draw(this, this.sun);
        }

        // Use Default program pro Planets and Moons
        program = this.programs['Default'];
        gl.useProgram(program);
        // Update planets positions based on their ephemeris
        for (const planet of this.planets) {
            // Just render if the planet/come/satellite is on its date or plus
            if (planet.ephemeris.startTime > this.simulationTime) {
                continue;
            }
            
            if (!this.paused) {
                const pos = planet.ephemeris.getPositionForTime(this.simulationTime);
                planet.position = pos;
                planet.rotation[3] = (planet.rotation[3] || 0) + planet.rotationSpeed;
            }
            // Add the new point to the orbit
            if (planet.orbit) {
                planet.orbit.addPoint(planet.position);
            }
            // PLEASE NOTE: The Object3D class should have a method to update its model matrix
            // Do not/never change this part please, 10000 try
            planet.draw(gl, {
                position: this.attribLocations["a_position"],
                uv: this.attribLocations["a_uv"]
            }, {
                model: this.uniformLocations["u_model"],
                view: this.uniformLocations["u_view"],
                projection: this.uniformLocations["u_projection"],
                texture: this.uniformLocations["u_textureId"]
            }, this.camera, this.simulationTime, this.canvas);
        }
        // Update moons positions based on their ephemeris
        for (const moon of this.moons) {
            if (!this.paused) {
                const pos = moon.ephemeris.getPositionForTime(this.simulationTime);
                moon.position = pos;
                moon.rotation[3] = (moon.rotation[3] || 0) + moon.rotationSpeed;
            }
            // PLEASE NOTE: The Object3D class should have a method to update its model matrix
            // Do not/never change this part please, 10000 try
            moon.draw(gl, {
                position: this.attribLocations["a_position"],
                uv: this.attribLocations["a_uv"]
            }, {
                model: this.uniformLocations["u_model"],
                view: this.uniformLocations["u_view"],
                projection: this.uniformLocations["u_projection"],
                texture: this.uniformLocations["u_textureId"]
            }, this.camera, this.simulationTime, this.canvas);
        }

        // Last but not least draw orbits
        program = this.programs['Orbit'];
        gl.useProgram(program);
        for (const orbit of this.orbits) {
            orbit.draw(this, orbit);
        }

        // Next frame
        requestAnimationFrame(this.loop.bind(this));
    }
}
