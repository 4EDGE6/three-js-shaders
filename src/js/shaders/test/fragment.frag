uniform vec3 uColor;
uniform sampler2D uTexture;
// varying float vRandom;
varying vec2 vUv;
varying float vElevation;

void main() {
    // gl_FragColor = vec4(vRandom, vRandom, 0.5, vRandom);
    vec4 textureColor = texture2D(uTexture, vUv);
    textureColor.rgb *= vElevation * 2.0 + 0.5;
    gl_FragColor = textureColor;
}