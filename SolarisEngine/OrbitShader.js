export default class OrbitShader {
    constructor(gl, program) {
        this.gl = gl;
        this.program = customProgram;
        this.attribLocations = {};
        this.uniformLocations = {};

        // Attributes
        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.age = gl.getAttribLocation(program, 'a_age');

        // Uniforms
        this.uniformLocations.model = gl.getUniformLocation(program, 'u_model');
        this.uniformLocations.view = gl.getUniformLocation(program, 'u_view');
        this.uniformLocations.projection = gl.getUniformLocation(program, 'u_projection');
        this.uniformLocations.time = gl.getUniformLocation(program, 'u_time');
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
