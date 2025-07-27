import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export default class Sun {
    constructor(gl, program, texture, original_size) {
        const height = 1.0;
        const width = 1.0;

        this.gl = gl;
        this.program = program;
        this.attribLocations = {};
        this.uniformLocations = {};

        this.original_size = original_size;
        this.name = 'Sun';
        this.vertexData = [
            -width, -height, 0,
            width, -height, 0,
            width, height, 0,
            -width, height, 0
        ];
        this.uvData = [0, 0, 1, 0, 1, 1, 0, 1];
        this.indexData = [0, 1, 2, 0, 2, 3];

        this.position = [0, 0, 0];
        this.rotation = [0, 0, 0];
        this.scale = [1, 1, 1];

        this.modelMatrix = mat4.create();

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);

        // UV buffer
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvData), gl.STATIC_DRAW);

        // Index buffer (optional)
        if (this.indexData) {
            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
        }
        this.texture = texture;

        // Cache attribute and uniform locations
        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.uv = gl.getAttribLocation(program, 'a_uv');

        this.uniformLocations.model = gl.getUniformLocation(program, 'u_model');
        this.uniformLocations.view = gl.getUniformLocation(program, 'u_view');
        this.uniformLocations.projection = gl.getUniformLocation(program, 'u_projection');
        this.uniformLocations.time = gl.getUniformLocation(program, 'u_time');
        this.uniformLocations.resolution = gl.getUniformLocation(program, 'u_resolution');


    }

    faceCamera(camera) {
        const m = this.modelMatrix;
        mat4.identity(m);
        mat4.translate(m, m, this.position);
        const toCamera = vec3.create();
        vec3.subtract(toCamera, camera.position, this.position);
        vec3.normalize(toCamera, toCamera);
        const up = [0, 1, 0];
        const right = vec3.create();
        vec3.cross(right, up, toCamera);
        vec3.normalize(right, right);
        const newUp = vec3.create();
        vec3.cross(newUp, toCamera, right);
        const rotMatrix = mat4.fromValues(
            right[0], right[1], right[2], 0,
            newUp[0], newUp[1], newUp[2], 0,
            toCamera[0], toCamera[1], toCamera[2], 0,
            0, 0, 0, 1
        );
        mat4.multiply(m, m, rotMatrix);
        mat4.scale(m, m, this.scale);
    }

    updateModelMatrix() {
        const t = this.position;
        const r = this.rotation;
        const s = this.scale;
        let m = this.modelMatrix;

        mat4.identity(m);
        mat4.translate(m, m, t);
        mat4.rotateZ(m, m, r[2]);
        mat4.rotateY(m, m, r[1]);
        mat4.rotateX(m, m, r[0]);
        mat4.scale(m, m, s);
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

        object.scale = [width, height, 1];

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
