uniform float uSize;
uniform vec2 uResolution;
uniform sampler2D uParticleTexture;

attribute vec2 aParticlesUv;

varying vec3 vColor;

void main() {
    vec4 particle = texture2D(uParticleTexture, aParticlesUv);

    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;

    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= 1. / -viewPosition.z;

    vColor = vec3(1.0);
}