uniform float uPositionFrequency;
uniform float uStrenghth;
uniform float uWarpFrequency;
uniform float uWarpStrength;
uniform float uTime;

varying vec3 vPosition;
varying float vUpDot;

#include ../includes/simplexNoise2D.glsl 

float getElevation(vec2 position) {

    float elevation = 0.0;

    vec2 warpedPosition = position;
    warpedPosition += uTime * .2;
    warpedPosition += simplexNoise2D(warpedPosition * uPositionFrequency * uWarpFrequency) * uWarpStrength;

    elevation += simplexNoise2D(warpedPosition * uPositionFrequency) / 2.0;
    elevation += simplexNoise2D(warpedPosition * uPositionFrequency * 2.0) / 4.0;
    elevation += simplexNoise2D(warpedPosition * uPositionFrequency * 4.0) / 8.0;

    float elevationSign = sign(elevation);
    elevation = pow(abs(elevation), 2.0) * elevationSign;
    elevation *= uStrenghth;

    return elevation;
}

void main() {
    float shift = .01;
    vec3 positionA = position + vec3(shift, .0, .0);
    vec3 positionB = position + vec3(.0, .0, -shift);

    float elevation = getElevation(csm_Position.xz);
    csm_Position.y += elevation;
    positionA.y = getElevation(positionA.xz);
    positionB.y = getElevation(positionB.xz);

    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = cross(toA, toB);

    vPosition = csm_Position;
    vPosition.xz += uTime * .2;
    vUpDot = dot(csm_Normal, vec3(0., 1., 0.));
};