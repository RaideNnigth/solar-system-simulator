import Object3D from './Object3D.js';

export default class RouteRibbon extends Object3D {
    constructor(name, ephemerisData, sampleStep = 50, thickness = 0.01) {
        const vertexData = [];
        const uvData = []; // Optional
        this.ephemerisData = ephemerisData;
        this.sampleStep = sampleStep;
        this.thickness = thickness;
        this.name = name;

        // We'll generate vertex data later per frame based on camera
        super(name, vertexData, uvData);
    }

    updateGeometry(camera) {
        const vertexData = [];

        for (let i = 0; i < this.ephemerisData.length - this.sampleStep; i += this.sampleStep) {
            const p0 = this.ephemerisData[i];
            const p1 = this.ephemerisData[i + this.sampleStep];

            const dir = normalize(subtract(p1, p0));
            const toCam = normalize(subtract(camera.position, p0));
            const side = scale(normalize(cross(dir, toCam)), this.thickness / 2);

            const a = add(p0, side);
            const b = subtract(p0, side);
            const c = add(p1, side);
            const d = subtract(p1, side);

            // Triangle 1
            vertexData.push(...a, ...b, ...c);
            // Triangle 2
            vertexData.push(...c, ...b, ...d);
        }

        this.vertexData = new Float32Array(vertexData);
        this.updateBuffers(this.gl);
    }

    draw(gl, attribLocations, uniformLocations, camera) {
        this.gl = gl;

        this.updateGeometry(camera);
        this.updateModelMatrix();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.position);

        gl.uniformMatrix4fv(uniformLocations.model, false, this.modelMatrix);
        gl.uniformMatrix4fv(uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniformLocations.projection, false, camera.projectionMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, this.vertexData.length / 3);
    }

    subtract(a, b) {
        return [a.x - b.x, a.y - b.y, a.z - b.z];
    }

    add(a, b) {
        return [a.x + b[0], a.y + b[1], a.z + b[2]];
    }

    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ];
    }

    normalize(v) {
        const len = Math.hypot(...v);
        return len === 0 ? [0, 0, 0] : v.map(val => val / len);
    }

    scale(v, s) {
        return v.map(val => val * s);
    }
}
