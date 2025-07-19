precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

#define iTime u_time
#define iResolution vec3(u_resolution, 1.0)

vec4 NC0 = vec4(0.0,157.0,113.0,270.0);
vec4 NC1 = vec4(1.0,158.0,114.0,271.0);
vec4 WS = vec4(0.25);

vec4 hash4(vec4 n) { return fract(sin(n)*1399763.5453123); }

float noise4q(vec4 x) {
    vec4 n3 = vec4(0.0, 0.25, 0.5, 0.75);
    vec4 p2 = floor(x.wwww + n3);
    vec4 b = floor(x.xxxx + n3) + floor(x.yyyy + n3) * 157.0 + floor(x.zzzz + n3) * 113.0;
    vec4 p1 = b + fract(p2 * 0.00390625) * vec4(164352.0, -164352.0, 163840.0, -163840.0);
    p2 = b + fract((p2 + 1.0) * 0.00390625) * vec4(164352.0, -164352.0, 163840.0, -163840.0);
    vec4 f1 = fract(x.xxxx + n3);
    vec4 f2 = fract(x.yyyy + n3);
    f1 = f1 * f1 * (3.0 - 2.0 * f1);
    f2 = f2 * f2 * (3.0 - 2.0 * f2);
    vec4 n1 = vec4(0.0, 1.0, 157.0, 158.0);
    vec4 n2 = vec4(113.0, 114.0, 270.0, 271.0);  
    vec4 vs1 = mix(hash4(p1), hash4(n1.yyyy + p1), f1);
    vec4 vs2 = mix(hash4(n1.zzzz + p1), hash4(n1.wwww + p1), f1);
    vec4 vs3 = mix(hash4(p2), hash4(n1.yyyy + p2), f1);
    vec4 vs4 = mix(hash4(n1.zzzz + p2), hash4(n1.wwww + p2), f1);
    vs1 = mix(vs1, vs2, f2);
    vs3 = mix(vs3, vs4, f2);
    vs2 = mix(hash4(n2.xxxx + p1), hash4(n2.yyyy + p1), f1);
    vs4 = mix(hash4(n2.zzzz + p1), hash4(n2.wwww + p1), f1);
    vs2 = mix(vs2, vs4, f2);
    vs4 = mix(hash4(n2.xxxx + p2), hash4(n2.yyyy + p2), f1);
    vec4 vs5 = mix(hash4(n2.zzzz + p2), hash4(n2.wwww + p2), f1);
    vs4 = mix(vs4, vs5, f2);
    f1 = fract(x.zzzz + n3);
    f2 = fract(x.wwww + n3);
    f1 = f1 * f1 * (3.0 - 2.0 * f1);
    f2 = f2 * f2 * (3.0 - 2.0 * f2);
    vs1 = mix(vs1, vs2, f1);
    vs3 = mix(vs3, vs4, f1);
    vs1 = mix(vs1, vs3, f2);
    float r = dot(vs1, vec4(0.25));
    return r * r * (3.0 - 2.0 * r);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec4 fragColor = vec4(0.0);

    vec2 p = (-iResolution.xy + 2.0 * fragCoord) / iResolution.y;
    float time = iTime;

    vec2 rotate = vec2(time * 0.025, -0.6);
    vec2 sins = sin(rotate);
    vec2 coss = cos(rotate);

    mat3 mr = mat3(
        vec3(coss.x, 0.0, sins.x),
        vec3(0.0, 1.0, 0.0),
        vec3(-sins.x, 0.0, coss.x)
    );

    mr = mat3(
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, coss.y, sins.y),
        vec3(0.0, -sins.y, coss.y)
    ) * mr;

    vec3 ray = normalize(vec3(p, 2.0));
    vec3 pos = vec3(0.0, 0.0, 3.0);

    float b = dot(ray, pos);
    float c = dot(pos, pos) - b * b;

    vec3 r1 = vec3(0.0);
    float s = 0.0;
    float d = 0.03125;
    float d2 = 0.5 / (d * d);
    float ar = 5.0;
    float r = 1.0;

    for (int i = 0; i < 3; i++) {
        float rq = r * r;
        if (c < rq) {
            float l1 = sqrt(rq - c);
            r1 = ray * (b - l1) - pos;
            r1 = r1 * mr;
            s += abs(noise4q(vec4(r1 * d2, time * ar)) * d);
        }
        ar -= 2.0;
        d *= 4.0;
        d2 *= 0.0625;
        r -= r * 0.02;
    }

    s = pow(min(1.0, s * 2.4), 2.0);
    fragColor = vec4(mix(vec3(1.0, 1.0, 0.0), vec3(1.0), pow(s, 60.0)) * s, 1.0);

    gl_FragColor = clamp(fragColor, 0.0, 1.0);
}

