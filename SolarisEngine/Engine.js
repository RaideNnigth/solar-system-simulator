export default class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl");
        if (!this.gl) throw new Error("WebGL not supported");

        this.objects = [];

        this.lastTime = 0;

        this.timeScale = 1;      // Time scale for simulation --- Each second in real time corresponds to 1 hour;
        this.simulationTime = 0; // Simulation time in hours from the beggining of the simulation

        // Resize canvas
        this.resize();
        window.addEventListener("resize", () => this.resize());

        // Clear color and depth
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.program = null;
        this.attribLocations = {};
        this.uniformLocations = {};

        this.camera = null;
        this.cameraTargetObject = 'None';
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (this.camera) {
            this.camera.updateProjection(this.canvas.width, this.canvas.height);
        }
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vertexShader));
            gl.deleteShader(vertexShader);
            throw new Error("Vertex shader compile error");
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fragmentShader));
            gl.deleteShader(fragmentShader);
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

        this.program = program;
        gl.useProgram(this.program);
    }

    getAttribLocation(name) {
        const loc = this.gl.getAttribLocation(this.program, name);
        this.attribLocations[name] = loc;
        return loc;
    }

    getUniformLocation(name) {
        const loc = this.gl.getUniformLocation(this.program, name);
        this.uniformLocations[name] = loc;
        return loc;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    fixCameraOnObject(objectName) {
        const object = this.objects.find(obj => obj.name === objectName);
        if (object) {
            this.cameraTargetObject = object;
        } else {
            console.warn(`Object with name ${objectName} not found.`);
            this.cameraTargetObject = 'None';
        }
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }

    addObject(obj) {
        this.objects.push(obj);
    }

    removeObject(obj) {
        const i = this.objects.indexOf(obj);
        if (i !== -1) this.objects.splice(i, 1);
    }

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(currentTime) {
        const gl = this.gl;
        const deltaTime = (currentTime - this.lastTime) / 1000; // seconds
        this.lastTime = currentTime;

        // Clear the screen
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let simulationDelta = deltaTime * this.timeScale;
        this.simulationTime += simulationDelta;
        if (this.cameraTargetObject !== 'None') {
            const obj = this.cameraTargetObject;
            this.camera.lookAt(
                [obj.position[0], obj.position[1] + 50, obj.position[2]],
                obj.position,
                [0, 0, -1]
            );
        }

        for (const obj of this.objects) {
            if (obj.ephemeris) {
                const pos = obj.ephemeris.getPositionForTime(this.simulationTime);
                obj.position = pos;
            }
            
            // PLEASE NOTE: The Object3D class should have a method to update its model matrix
            // Do not/never change this part please, 10000 try
            obj.draw(gl, {
                position: this.attribLocations["a_position"],
                uv: this.attribLocations["a_uv"]
            }, {
                model: this.uniformLocations["u_model"],
                view: this.uniformLocations["u_view"],
                projection: this.uniformLocations["u_projection"],
                texture: this.uniformLocations["u_textureId"]
            }, this.camera);
        }

        requestAnimationFrame(this.loop.bind(this));
    }
}
