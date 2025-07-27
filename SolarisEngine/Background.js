export default class Background {
    constructor(gl, texture, program) {
        this.gl = gl;
        this.texture = texture;
        this.attribLocations = {};
        this.uniformLocations = {};

        const vertices = new Float32Array([
            -1, -1,  0, 0,
             1, -1,  1, 0,
            -1,  1,  0, 1,
             1,  1,  1, 1,
        ]);

        const indices = new Uint16Array([0, 1, 2, 2, 1, 3]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.uv = gl.getAttribLocation(program, 'a_uv');
        this.uniformLocations.texture = gl.getUniformLocation(program, 'u_texture');
        this.uniformLocations.cameraPosition = gl.getUniformLocation(program, 'u_cameraPosition');
        this.program = program;
    }

    draw() {
        const gl = this.gl;
        const program = this.program;
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.attribLocations.position, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(this.attribLocations.position);

        gl.vertexAttribPointer(this.attribLocations.uv, 2, gl.FLOAT, false, 16, 8);
        gl.enableVertexAttribArray(this.attribLocations.uv);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniformLocations.texture, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.disable(gl.DEPTH_TEST);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.enable(gl.DEPTH_TEST);
    }
}
