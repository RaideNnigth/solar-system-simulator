import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import Ephemeris from './Ephemeris.js';
import Shader from './Shader.js';

export default class Object3D {
    constructor(
        name = 'Isadora',
        vertexData = [],
        uvData = [],
        indexData = null,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        data,
        shader
    ) {
        this.name = name;
        this.vertexData = vertexData;
        this.uvData = uvData;
        this.indexData = indexData;

        this.position = position;
        this.rotation = rotation;
        this.scale = scale;

        this.modelMatrix = mat4.create();

        this.vertexBuffer = null;
        this.uvBuffer = null;
        this.indexBuffer = null;
        this.texture = null;

        if (data) {
            this.ephemeris = new Ephemeris(data);
        } else {
            this.ephemeris = null;
        }
        if (shader) {
            this.shader = shader;
        } else {
            this.shader = null;
        }
    }

    setBuffers(gl) {
        // Vertex buffer
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

    setTexture(texture) {
        this.texture = texture;
    }

    setEphemeris(data) {
        this.ephemeris = new Ephemeris(data);
    }

    draw(gl, attribLocations, uniformLocations, camera) {

        // Update transforms
        this.updateModelMatrix();

        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.position);

        // UV coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.uv);

        // Uniforms
        gl.uniformMatrix4fv(uniformLocations.model, false, this.modelMatrix);
        gl.uniformMatrix4fv(uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniformLocations.projection, false, camera.projectionMatrix);
        gl.uniform1i(uniformLocations.texture, 0);

        // Draw call
        if (this.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indexData.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertexData.length / 3);
        }

    }
}
