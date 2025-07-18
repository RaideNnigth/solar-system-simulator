import Object3D from './Object3D.js';

export default class Sphere extends Object3D {
    constructor(
        name = 'Sphere',
        radius = 1,
        latitudeBands = 32,
        longitudeBands = 32,
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        scale = [1, 1, 1],
        data
    ) {
        const { vertexData, uvData, indexData } = Sphere.createSphereData(radius, latitudeBands, longitudeBands);
        super(name, vertexData, uvData, indexData, position, rotation, scale, data);
    }

    static createSphereData(radius, latitudeBands, longitudeBands) {
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
}
