uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

varying vec3 vColor;

attribute vec3 aPositionTarget;
attribute float aSize;

uniform vec3 uColorOne;
uniform vec3 uColorTwo;

#include ../includes/simplexNoise3D.glsl;

void main() {
    float noiseOrigin = simplexNoise3d(position * .2);
    float noiseTarget = simplexNoise3d(aPositionTarget * .2);
    float noise = mix(noiseOrigin, noiseTarget, uProgress);
    noise = smoothstep(-1., 1., noise);

    float duration = .4;
    float delay = (1. - duration) * noise;
    float end = delay + duration;
    float progress = smoothstep(delay, end, uProgress);
    vec3 mixedPosition = mix(position, aPositionTarget, progress);

    vec4 modelPosition = modelMatrix * vec4(mixedPosition, 1.);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize = uSize * uResolution.y * aSize;
    gl_PointSize *= (1. / -viewPosition.z);

    vColor = mix(uColorOne, uColorTwo, noise);

}