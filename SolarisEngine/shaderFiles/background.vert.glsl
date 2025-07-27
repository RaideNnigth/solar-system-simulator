#version 300 es
in vec2 a_position;
in vec2 a_uv;

uniform vec3 u_cameraPosition;

out vec2 v_uv;

void main() {
    v_uv = a_uv + u_cameraPosition.xy * 0.01;
    gl_Position = vec4(a_position, 0.0, 1.0);
}