#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform int iFrame;
out vec4 out_color;

float Noise2d(in vec2 x) {
    float xhash = cos(x.x * 37.0);
    float yhash = cos(x.y * 57.0);
    return fract(415.92653 * (xhash + yhash));
}

float NoisyStarField(in vec2 vSamplePos, float fThreshhold) {
    float StarVal = Noise2d(vSamplePos);
    if (StarVal >= fThreshhold)
        StarVal = pow((StarVal - fThreshhold) / (1.0 - fThreshhold), 6.0);
    else
        StarVal = 0.0;
    return StarVal;
}

float StableStarField(in vec2 vSamplePos, float fThreshhold) {
    float fractX = fract(vSamplePos.x);
    float fractY = fract(vSamplePos.y);
    vec2 floorSample = floor(vSamplePos);    
    float v1 = NoisyStarField(floorSample, fThreshhold);
    float v2 = NoisyStarField(floorSample + vec2(0.0, 1.0), fThreshhold);
    float v3 = NoisyStarField(floorSample + vec2(1.0, 0.0), fThreshhold);
    float v4 = NoisyStarField(floorSample + vec2(1.0, 1.0), fThreshhold);

    return v1 * (1.0 - fractX) * (1.0 - fractY)
         + v2 * (1.0 - fractX) * fractY
         + v3 * fractX * (1.0 - fractY)
         + v4 * fractX * fractY;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;

    vec3 vColor = vec3(0.1, 0.2, 0.4) * fragCoord.y / iResolution.y;

    float StarFieldThreshhold = 0.97;
    float xRate = 0.2;
    float yRate = -0.06;
    vec2 vSamplePos = fragCoord + vec2(xRate, yRate) * float(iFrame);
    float StarVal = StableStarField(vSamplePos, StarFieldThreshhold);

    vColor += vec3(StarVal);

    out_color = vec4(vColor, 1.0);
}