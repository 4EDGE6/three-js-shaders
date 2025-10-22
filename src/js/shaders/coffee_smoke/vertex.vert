uniform float uTime;
uniform sampler2D uPerlinTexture;

varying vec2 vUv;

#include ../includes/rotate2D.glsl

void main() {
    vec3 newPos = position;

    float twistPerlin = texture2D(uPerlinTexture, vec2(0.5, uv.y * .2 - uTime * .005)).r;

    float angle = twistPerlin * 10.;
    newPos.xz = rotate2D(newPos.xz, angle);

    vec2 windOffset = vec2(texture2D(uPerlinTexture, vec2(.25, uTime * .001)).r - .5, texture2D(uPerlinTexture, vec2(.75, uTime * .001)).r - .5);
    windOffset *= pow(uv.y, 2.) * 10.;
    newPos.xz += windOffset;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.);
    vUv = uv;
}