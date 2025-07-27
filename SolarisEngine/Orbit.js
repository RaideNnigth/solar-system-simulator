import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export default class Orbit {
    constructor(gl, program, maxTrail = 100) {
        this.gl = gl;
        this.program = program;
        this.modelMatrix = mat4.create();

        this.attribLocations = {
            position: gl.getAttribLocation(program, 'a_position'),
        };
        this.uniformLocations = {
            model: gl.getUniformLocation(program, 'u_model'),
            view: gl.getUniformLocation(program, 'u_view'),
            projection: gl.getUniformLocation(program, 'u_projection'),
        };

        this.vertexBuffer = gl.createBuffer();
        this.vertexCount = 0;

        // This Buffer to control points of the orbit, generated in Planet Object or any other object
        this.points = [];
        this.maxTrail = maxTrail;
        this._needsInit = true;
    }

    addPoint([x, y, z]) {
        if (this._needsInit) {
            this.rawPoints = [[x, y, z]];
            this.points = [x, y, z];
            this._needsInit = false;
            return;
        }

        const minDistance = 0.005;
        for (let i = 0; i < this.points.length; i += 3) {
            const dx = this.points[i] - x;
            const dy = this.points[i + 1] - y;
            const dz = this.points[i + 2] - z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistance * minDistance) {
                return;
            }
        }

        const lastPos = [x, y, z];
        this.rawPoints = this.rawPoints || [];
        this.rawPoints.push(lastPos);

        if (this.rawPoints.length < 4) {
            this.points.push(x, y, z);
        } else {
            const p0 = this.rawPoints[this.rawPoints.length - 4];
            const p1 = this.rawPoints[this.rawPoints.length - 3];
            const p2 = this.rawPoints[this.rawPoints.length - 2];
            const p3 = this.rawPoints[this.rawPoints.length - 1];

            const segments = 4;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const [ix, iy, iz] = this.catmullRom(p0, p1, p2, p3, t);
                this.points.push(ix, iy, iz);
            }
        }

        const maxLength = this.maxTrail * 3;
        const overflow = this.points.length - maxLength;
        if (overflow > 0) {
            this.points.splice(0, overflow);
        }
        this.lastAddPos = [x, y, z];
    }

    resetPoints() {
        this.points = [];
        this.rawPoints = [];
        this._needsInit = true;
    }

    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;

        return [
            0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),

            0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),

            0.5 * ((2 * p1[2]) + (-p0[2] + p2[2]) * t +
                (2 * p0[2] - 5 * p1[2] + 4 * p2[2] - p3[2]) * t2 +
                (-p0[2] + 3 * p1[2] - 3 * p2[2] + p3[2]) * t3)
        ];
    }


    draw(engine) {
        const gl = engine.gl;
        const cam = engine.camera;

        const vertexArray = new Float32Array(this.points);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.DYNAMIC_DRAW);
        this.vertexCount = this.points.length / 3;

        gl.useProgram(this.program);

        gl.uniformMatrix4fv(this.uniformLocations.model, false, this.modelMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.view, false, cam.viewMatrix);
        gl.uniformMatrix4fv(this.uniformLocations.projection, false, cam.projectionMatrix);

        if (this.attribLocations.position !== -1) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.vertexAttribPointer(this.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.attribLocations.position);
        }

        gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCount);
    }
}
