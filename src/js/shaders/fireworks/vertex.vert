uniform float uSize;
uniform vec2 uResolution;
uniform float uProgress;

attribute float aSize;
attribute float aTimeMultiplier;

#include ../includes/remap.glsl

void main() {
    vec3 newPosition = position;
    float progress = uProgress * aTimeMultiplier;

    float explodingProgress = remap(progress, .0, .1, .0, 1.);
    explodingProgress = clamp(explodingProgress, .0, 1.);
    explodingProgress = 1. - pow(1. - explodingProgress, 3.);
    newPosition *= explodingProgress;

    float fallingProgress = remap(progress, .1, 1., 0., 1.);
    fallingProgress = clamp(fallingProgress, .0, 1.);
    fallingProgress = 1. - pow(1. - fallingProgress, 3.);
    newPosition.y -= fallingProgress * .2;

    float sizeOpeningProgress = remap(progress, .0, .125, .0, 1.);
    float sizeClosingProgress = remap(progress, .125, 1., 1., .0);
    float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
    sizeProgress = clamp(sizeProgress, .0, 1.);

    float twinklingProgress = remap(progress, .2, .8, .0, 1.);
    twinklingProgress = clamp(twinklingProgress, .0, 1.);

    float sizeTwinkling = sin(progress * 30.) * .5 + .5;
    sizeTwinkling = 1. - sizeTwinkling * twinklingProgress;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.);
    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizeTwinkling;
    gl_PointSize *= 1. / -viewPosition.z;

    if(gl_PointSize < 1.)
        gl_Position = vec4(999.9);
}