varying vec3 vColor;

void main() {
    float distanceToCenter = length(gl_PointCoord - .5);

    if(distanceToCenter > .5)
        discard;

    gl_FragColor = vec4(vColor, 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}