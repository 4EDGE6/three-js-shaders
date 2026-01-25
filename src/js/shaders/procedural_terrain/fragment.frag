uniform vec3 uColorWaterDeep;
uniform vec3 uColorWaterSurface;
uniform vec3 uColorSand;
uniform vec3 uColorGrass;
uniform vec3 uColorSnow;
uniform vec3 uColorRock;

varying vec3 vPosition;
varying float vUpDot;

#include ../includes/simplexNoise2D.glsl 

void main() {
    vec3 color = vec3(1.);

    float surfaceWaterMix = smoothstep(-1., -.1, vPosition.y);
    color = mix(uColorWaterDeep, uColorWaterSurface, surfaceWaterMix);

    float sadMix = step(-.1, vPosition.y);
    color = mix(color, uColorSand, sadMix);

    float grassMix = step(-.06, vPosition.y);
    color = mix(color, uColorGrass, grassMix);

    float rockMix = vUpDot;
    rockMix = 1. - step(.8, rockMix);
    rockMix *= step(-.06, vPosition.y);
    color = mix(color, uColorRock, rockMix);

    float snowThreshold = .45;
    snowThreshold += simplexNoise2D(vPosition.xz * 15.) * .1;
    float snowMix = step(snowThreshold, vPosition.y);
    color = mix(color, uColorSnow, snowMix);

    csm_DiffuseColor = vec4(color, 1.);
}