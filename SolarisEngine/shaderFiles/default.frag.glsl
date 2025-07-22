#version 300 es
precision mediump float;

uniform sampler2D u_textureId;

in vec2 v_uv;
out vec4 outColor;

void main() {
    outColor = texture(u_textureId, v_uv);
}
