uniform float uSliceStart;
uniform float uSliceArc;

varying vec3 vPosition;

void main() {
    float angle = atan(vPosition.y, vPosition.x);
    angle -= uSliceStart;
    angle = mod(angle, PI2);

    if(angle > 0. && angle < uSliceArc)
        discard;

    // csm_FragColor = vec4(vec3(angle), 1.);

    // if(!gl_FrontFacing)
    //     csm_FragColor = vec4(.75, .15, .3, 1.);

    float pmSlice;
}