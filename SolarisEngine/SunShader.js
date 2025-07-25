import Shader from './Shader.js';

export default class SunShader extends Shader {
    constructor(gl, program) {
        super(gl, program);

        // Cache attribute and uniform locations
        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.uv = gl.getAttribLocation(program, 'a_uv');

        this.uniformLocations.model = gl.getUniformLocation(program, 'u_model');
        this.uniformLocations.view = gl.getUniformLocation(program, 'u_view');
        this.uniformLocations.projection = gl.getUniformLocation(program, 'u_projection');
        this.uniformLocations.time = gl.getUniformLocation(program, 'u_time');
        this.uniformLocations.resolution = gl.getUniformLocation(program, 'u_resolution');

    }

    draw(engine, object) {
        const gl = engine.gl;
        const camera = engine.camera;
        const simulationTime = engine.simulationTime;
        const canvas = engine.canvas;

        // resize for aspect ratio
        const aspect = canvas.width / canvas.height;
        const height = object.original_size;
        const width = aspect * height;

        object.scale = [width,height , 1];

        const resolutionLocation = gl.getUniformLocation(this.program, "iResolution");
        const mouseLocation = gl.getUniformLocation(this.program, "iMouse");
        const timeLocation = gl.getUniformLocation(this.program, "iTime");

        object.faceCamera(camera);

        // Vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
        gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.position);

        // UV coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, object.uvBuffer);
        gl.vertexAttribPointer(this.attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attribLocations.uv);

        // Set uniforms
        gl.uniformMatrix4fv(this.uniformLocations.model, false, object.modelMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.projection, false, camera.projectionMatrix);
        gl.uniform1f(this.uniformLocations.time, simulationTime);
        gl.uniform2f(this.uniformLocations.resolution, canvas.width, canvas.height);

        // Set additional uniforms
        gl.uniform3f(resolutionLocation, canvas.width, canvas.height, 1.0);
        gl.uniform3f(mouseLocation, engine.lastMouseX, engine.lastMouseY, 0.0);
        gl.uniform1f(timeLocation, simulationTime);

        // Bind texture if available
        if (object.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, object.texture);
            gl.uniform1i(gl.getUniformLocation(this.program, 'iChannel0'), 0);
        }

        // Draw
        if (object.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indexBuffer);
            gl.drawElements(gl.TRIANGLES, object.indexData.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, object.vertexData.length / 3);
        }
    }
}
