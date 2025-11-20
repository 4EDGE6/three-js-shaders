uniform sampler2D uPictureTexture;
uniform sampler2D uCanvasTexture;

varying vec3 vColor;

void main() {
    vec2 uv = gl_PointCoord;
    // float distanceToCenter = distance(uv, vec2(.5));
    float distanceToCenter = length(uv - vec2(.5));

    if(distanceToCenter > .5)
        discard;

    gl_FragColor = vec4(vColor, 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}