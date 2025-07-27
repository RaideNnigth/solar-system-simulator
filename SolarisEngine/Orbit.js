import Ephemeris from './Ephemeris.js';

export default class Orbit {
    constructor(gl, program, ephemerisData, step = 1, innerSegmentsNumber = 1, orbitPeriodInYears = 1) {
        this.ephemeris = new Ephemeris(ephemerisData);
        this.orbitPeriodInYears = orbitPeriodInYears;
        this.step = step;
        this.innerSegmentsNumber = innerSegmentsNumber;

        // Shaders
        this.gl = gl;
        this.program = program;
        this.attribLocations = {};
        this.uniformLocations = {};

        const { vertexData, ageData } = this.getOrbit(0, 8760 * orbitPeriodInYears);

        this.vertexCount = vertexData.length / 3;

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

        this.ageBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, ageData, gl.STATIC_DRAW);

        // Attributes
        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.age = gl.getAttribLocation(program, 'a_age');

        // Uniforms
        this.uniformLocations.model = gl.getUniformLocation(program, 'u_model');
        this.uniformLocations.view = gl.getUniformLocation(program, 'u_view');
        this.uniformLocations.projection = gl.getUniformLocation(program, 'u_projection');
        this.uniformLocations.time = gl.getUniformLocation(program, 'u_time');
    }

    // from and to will be in hours sinde start of simulation (usally 1800)
    getOrbit(from, to) {
        const vertexList = [];
        const ageList = [];

        for (let i = from; i < to; i += this.step) {
            const a = this.ephemeris.getPositionForTime(i);
            const b = this.ephemeris.getPositionForTime(i + this.step);

            const segmentStep = 1 / this.innerSegmentsNumber;
            for (let j = 0; j <= this.innerSegmentsNumber; j++) {
                const t = j * segmentStep;
                const time = i + t * this.step;
                const p = this.ephemeris.getPositionForTime(time);
                vertexList.push(...p);
                ageList.push(time);
            }
        }

        return {
            vertexData: new Float32Array(vertexList),
            ageData: new Float32Array(ageList)
        };
    }

    draw(engine, object) {
        const gl = engine.gl;
        const camera = engine.camera;
        const simulationTime = engine.simulationTime;

        gl.useProgram(this.program);

        // Set uniforms
        gl.uniformMatrix4fv(this.uniformLocations.model, false, object.modelMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.projectionMatrix);
        gl.uniform1f(this.uniformLocations.time, simulationTime);

        // Vertexes
        gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
        gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.position);

        // Age buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, object.ageBuffer);
        gl.vertexAttribPointer(this.attribLocations.age, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.age);

        // Draw baby
        gl.drawArrays(gl.LINE_STRIP, 0, object.vertexCount);
    }

}
