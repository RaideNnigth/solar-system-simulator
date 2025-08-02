export default class Background {
    constructor(gl, program) {
        this.quad = new Float32Array([
            -1, -1,
            1, -1,
            -1,  1,
            1,  1,
        ]);

        this.positionLoc = gl.getAttribLocation(program, "a_position");
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.quad, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.positionLoc);
        gl.vertexAttribPointer(this.positionLoc, 2, gl.FLOAT, false, 0, 0);

        this.uResolution = gl.getUniformLocation(program, "iResolution");
        this.uFrame = gl.getUniformLocation(program, "iFrame");

        this.gl = gl;
        this.program = program;
    }

    draw(frame) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.quad, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionLoc);
        this.gl.vertexAttribPointer(this.positionLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniform2f(this.uResolution, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.uniform1i(this.uFrame, frame++);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}
