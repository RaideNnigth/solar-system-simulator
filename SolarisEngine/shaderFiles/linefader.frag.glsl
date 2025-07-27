#version 300 es
precision mediump float;

in float v_age;
out vec4 outColor;

void main() {
    vec3 color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), v_age);
    float alpha = 1.0 - v_age;
    outColor = vec4(color, alpha);
}
