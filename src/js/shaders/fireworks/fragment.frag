uniform sampler2D uTexture;
uniform vec3 uColor;

void main() {
    float textureAlpha = texture2D(uTexture, gl_PointCoord).r;

    gl_FragColor = vec4(uColor, textureAlpha);
    // gl_FragColor = vec4(gl_PointCoord, 1., 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}