#version 300 es
precision highp float;
uniform sampler2D u_previousFrame;
uniform float     u_time;
uniform vec2      u_resolution;

out vec4 outColor;

vec3 drawOrbita(in vec2 fragCoord) {
  vec2 center = u_resolution * 0.5;
  float speed = u_time * 0.1;
  float twoPI = 6.28318530718;
  float angle = mod(speed * twoPI, twoPI);
  vec2 xform = vec2(sin(angle), cos(angle));
  vec2 orbit = u_resolution.yy * 0.4;
  vec2 origin = orbit * xform + center;
  float size = u_resolution.y * 0.125;
  float dist = distance(fragCoord, origin);
  vec3 color = vec3(1.0, 0.5, 0.1) * 0.01;
  return color * size / dist;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec2 uv = fragCoord / u_resolution;
  vec3 col = texture(u_previousFrame, uv).rgb * 0.95;
  col += drawOrbita(fragCoord);
  outColor = vec4(min(col, 1.0), 1.0);
}