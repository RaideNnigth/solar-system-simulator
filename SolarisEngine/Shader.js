export default class Shader {
    constructor(gl, customProgram) {
        this.gl = gl;
        this.program = customProgram;
        this.attribLocations = {};
        this.uniformLocations = {};
    }

    draw(engine, object) {
        // engine.gl, engine.camera, engine.simulationTime, engine.canvas, etc.
        // Implementação genérica ou abstracta
    }
}