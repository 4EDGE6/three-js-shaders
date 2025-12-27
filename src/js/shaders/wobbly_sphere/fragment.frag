varying vec2 vUv;
varying float vWobble;

uniform vec3 uColorA;
uniform vec3 uColorB;

void main() {
    float colorMix = smoothstep(-1., 1., vWobble);
    csm_DiffuseColor.rgb = mix(uColorA, uColorB, colorMix);

    // csm_Metalness = step(.25, vWobble);
    // csm_Roughness = 1. - csm_Metalness;

    csm_Roughness = 1. - colorMix;
}
