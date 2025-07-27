import Shader from './Shader.js';

export default class BackgroundShader extends Shader {
    constructor(gl, program) {
        super(gl, program);

        this.attribLocations.position = gl.getAttribLocation(program, 'a_position');
        this.attribLocations.uv = gl.getAttribLocation(program, 'a_uv');
        this.uniformLocations.texture = gl.getUniformLocation(program, 'u_texture');
        this.uniformLocations.cameraPosition = gl.getUniformLocation(program, 'u_cameraPosition');
    }
}
