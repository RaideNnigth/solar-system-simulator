#version 300 es
in vec3 a_position;
in float a_age;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out float v_age;

void main() {
    v_age = a_age;
    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
