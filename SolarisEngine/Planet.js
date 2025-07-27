import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import Ephemeris from './Ephemeris.js';

export default class Planet {
    constructor(
        name,
        scale,
        data,
        texture,
        gl,
        rotationAxis = [0, 1, 0],
        rotationSpeed = 0.01,
        radius = 1,
        latitudeBands = 32,
        longitudeBands = 32,
        rotation = [0, 0, 0]
    ) {
        const { vertexData, uvData, indexData } = Planet.createPlanetData(radius, latitudeBands, longitudeBands);
        this.vertexData = vertexData;
        this.uvData = uvData;
        this.indexData = indexData;

        this.name = name;

        this.position = [data[0].x, data[0].y, data[0].z];
        this.rotation = rotation;
        this.rotationAxis = rotationAxis;
        this.rotationSpeed = rotationSpeed;
        this.scale = scale;
        this.texture = texture;
        this.ephemeris = new Ephemeris(data);
        this.modelMatrix = mat4.create();

        // Vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexData), gl.STATIC_DRAW);

        // UV buffer
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvData), gl.STATIC_DRAW);

        // Index buffer
        if (this.indexData && this.indexData.length > 0) {
            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexData), gl.STATIC_DRAW);
        }
    }

    static createPlanetData(radius, latitudeBands, longitudeBands) {
        const vertexData = [];
        const uvData = [];
        const indexData = [];

        for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            const theta = latNumber * Math.PI / latitudeBands;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                const phi = longNumber * 2 * Math.PI / longitudeBands;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;

                const u = 1 - (longNumber / longitudeBands);
                const v = 1 - (latNumber / latitudeBands);

                vertexData.push(radius * x);
                vertexData.push(radius * y);
                vertexData.push(radius * z);
                uvData.push(u, v);
            }
        }

        for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
                const first = (latNumber * (longitudeBands + 1)) + longNumber;
                const second = first + longitudeBands + 1;

                indexData.push(first, second, first + 1);
                indexData.push(second, second + 1, first + 1);
            }
        }

        return { vertexData, uvData, indexData };
    }

    updateModelMatrix() {
        const t = this.position;
        const s = this.scale;
        const m = this.modelMatrix;

        mat4.identity(m);
        mat4.translate(m, m, t);
        mat4.rotate(m, m, this.rotation[3] || 0, this.rotationAxis);
        mat4.scale(m, m, s);
    }

    draw(gl, attribLocations, uniformLocations, camera) {
        this.updateModelMatrix();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(attribLocations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.uv);

        gl.uniformMatrix4fv(uniformLocations.model, false, this.modelMatrix);
        gl.uniformMatrix4fv(uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniformLocations.projection, false, camera.projectionMatrix);
        gl.uniform1i(uniformLocations.texture, 0);

        if (this.indexBuffer && Array.isArray(this.indexData) && this.indexData.length > 0) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.indexData.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, this.vertexData.length / 3);
        }
    }
}
