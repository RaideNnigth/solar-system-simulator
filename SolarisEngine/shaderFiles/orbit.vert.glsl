#version 300 es
in vec3 a_position;
in float a_age;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_time;

out float v_age;

void main() {
    float ageDiff = u_time - a_age;
    float fadeDuration = 8760.0;
    v_age = clamp(ageDiff / fadeDuration, 0.0, 1.0);

    gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}
