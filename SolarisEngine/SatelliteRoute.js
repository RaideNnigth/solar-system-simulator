import Object3D from './Object3D.js';

export default class SatelliteRoute extends Object3D {
    constructor(name, ephemerisData, sampleStep = 50) {
        // Generate vertices from ephemeris
        const vertices = [];

        for (let i = 0; i < ephemerisData.length; i += sampleStep) {
            const point = ephemerisData[i];
            vertices.push(point.x, point.y, point.z);
        }

        const dummyUVs = new Array(vertices.length / 3 * 2).fill(0); // Not used
        super(name, vertices, dummyUVs);

        this.isLine = true;
    }

    draw(gl, attribLocations, uniformLocations, camera, simulationTime) {
        this.gl = gl;
        this.updateModelMatrix();

        let newIndex = this.currentIndex;
        while (
            newIndex < this.ephemerisData.length &&
            this.ephemerisData[newIndex].time <= simulationTime
        ) {
            const pt = this.ephemerisData[newIndex];
            this.vertexData[newIndex * 3] = pt.x;
            this.vertexData[newIndex * 3 + 1] = pt.y;
            this.vertexData[newIndex * 3 + 2] = pt.z;
            newIndex++;
        }

        if (newIndex > this.currentIndex) {
            this.currentIndex = newIndex;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(attribLocations.position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations.position);

        if (attribLocations.uv !== -1) {
            gl.disableVertexAttribArray(attribLocations.uv);
        }

        gl.uniformMatrix4fv(uniformLocations.model, false, this.modelMatrix);
        gl.uniformMatrix4fv(uniformLocations.view, false, camera.viewMatrix);
        gl.uniformMatrix4fv(uniformLocations.projection, false, camera.projectionMatrix);

        gl.drawArrays(gl.LINE_STRIP, 0, this.currentIndex);
    }
}
