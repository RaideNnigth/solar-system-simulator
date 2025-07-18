import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export default class Camera {
    constructor(
        width = 1,
        height = 1,
        position = [0, 0, 10],
        target = [0, 0, 0],
        up = [0, 1, 0]
    ) {
        this.fov = Math.PI / 4;
        this.aspect = width / height;
        this.near = 0.1;
        this.far = 100;
        this.projectionMatrix = mat4.create();
        this.viewMatrix = mat4.create();

        this.position = position;
        this.target = target;
        this.up = up;

        this.updateProjectionMatrix();
        this.updateCameraMatrix();
    }

    updateProjection(width, height) {
        this.aspect = width / height;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
    }

    setFov(fov) {
        this.fov = fov;
        this.updateProjectionMatrix();
    }

    setPosition(position) {
        this.position = position;
        this.updateCameraMatrix();
    }

    setTarget(target) {
        this.target = target;
        this.updateCameraMatrix();
    }

    setUp(up) {
        this.up = up;
        this.updateCameraMatrix();
    }

    lookAt(position, target, up = this.up) {
        this.position = position;
        this.target = target;
        this.up = up;
        this.updateCameraMatrix();
    }

    panCamera(dx, dy, dz) {
        this.setPosition([
            this.position[0] + dx,
            this.position[1] + dy,
            this.position[2] + dz
        ]);
        this.setTarget([
            this.target[0] + dx,
            this.target[1] + dy,
            this.target[2] + dz
        ]);
    }

    orbitAroundTarget(angleDeltaY, angleDeltaX, distance = null) {
        const dx = this.position[0] - this.target[0];
        const dy = this.position[1] - this.target[1];
        const dz = this.position[2] - this.target[2];

        const radius = distance !== null ? distance : Math.sqrt(dx*dx + dy*dy + dz*dz);

        let theta = Math.atan2(dx, dz);
        let phi = Math.acos(dy / radius);

        theta += angleDeltaY;
        phi += angleDeltaX;

        const EPS = 0.0001;
        phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

        const x = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);

        this.position = [
            this.target[0] + x,
            this.target[1] + y,
            this.target[2] + z
        ];

        this.updateCameraMatrix();
    }

    updateCameraMatrix() {
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    }
}
