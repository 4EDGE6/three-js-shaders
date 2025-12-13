uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D uParticleTexture;

attribute vec2 aParticlesUv;
attribute vec3 aColor;
attribute float aSize;

varying vec3 vColor;

void main() {
    vec4 particle = texture2D(uParticleTexture, aParticlesUv);

    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    float sizeIn = smoothstep(.0, 1., particle.a);
    float sizeOut = 1. - smoothstep(.7, 1., particle.a);
    float size = min(sizeIn, sizeOut);

    gl_PointSize = size * aSize * uSize * uResolution.y;
    gl_PointSize *= 1. / -viewPosition.z;

    vColor = aColor;
}