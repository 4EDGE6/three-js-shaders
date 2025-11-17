uniform float uTime;
uniform float uWavesElevation;
uniform vec2 uWaveFrequency;
uniform float uWaveSpeed;

uniform float uSmallWavesElevation;
uniform float uSmallWavesFrequency;
uniform float uSmallWavesSpeed;
uniform float uSmallWavesIterations;

varying vec2 vUv;
varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/perlinClassic3D.glsl

float waveElevation(vec3 position) {
    float elevation = sin(position.x * uWaveFrequency.x + uTime * uWaveSpeed) *
        sin(position.z * uWaveFrequency.y + uTime * uWaveSpeed) *
        uWavesElevation;

    for(float i = 1.; i <= uSmallWavesIterations; i++) {
        elevation -= abs(perlinClassic3D(vec3(position.xz * uSmallWavesFrequency * i, uTime * uSmallWavesSpeed)) * uSmallWavesElevation / i);
    };

    return elevation;
}

void main() {
    float shift = .01;
    vec4 modelPosition = modelMatrix * vec4(position, 1.);
    vec3 modelPositionA = modelPosition.xyz + vec3(shift, 0., 0.);
    vec3 modelPositionB = modelPosition.xyz + vec3(0., 0., -shift);

    float elevation = waveElevation(modelPosition.xyz);
    modelPosition.y += elevation;
    modelPositionA.y = waveElevation(modelPositionA);
    modelPositionB.y = waveElevation(modelPositionB);

    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computeNormal = cross(toA,toB);

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 prjectionPosition = projectionMatrix * viewPosition;

    gl_Position = prjectionPosition;

    vUv = uv;
    vElevation = elevation;
    vNormal = computeNormal;
    vPosition = modelPosition.xyz;
}
