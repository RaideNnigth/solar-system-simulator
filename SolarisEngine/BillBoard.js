import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';
import Object3D from './Object3D.js';

export default class BillBoard extends Object3D {
    constructor(name, shader, original_size) {
        const height = 1.0;
        const width = 1.0;
        const vertexData = [
            -width, -height, 0,
            width, -height, 0,
            width, height, 0,
            -width, height, 0
        ];
        const uvData = [0, 0, 1, 0, 1, 1, 0, 1];
        const indexData = [0, 1, 2, 0, 2, 3];
        super(name, vertexData, uvData, indexData, [0, 0, 0], [0, 0, 0], [1, 1, 1], null, shader);
        this.original_size = original_size;
    }

}
