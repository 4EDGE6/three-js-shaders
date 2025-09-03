varying vec2 vUv;

void main() {
    // gl_FragColor = vec4(vUv, 1, 1.0);
    // gl_FragColor = vec4(vUv, 0, 1.0);
    // gl_FragColor = vec4(vUv.x, vUv.x, vUv.x, 1.0);

    // float strength = vUv.x;
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = vUv.y;
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = 1.0 - vUv.y;
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = mod(vUv.y * 10.0, 1.0);
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = mod(vUv.y * 10.0, 1.0);

    // if(strength < 0.5) {
    //     strength = 0.0;
    // } else {
    //     strength = 1.0;
    // }
    // strength = step(0.5, strength);
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = mod(vUv.y * 10.0, 1.0);
    // strength = step(0.8, strength);
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
    // strength += step(0.8, mod(vUv.y * 10.0, 1.0));
    // gl_FragColor = vec4(vec3(strength), 1.0);

    // float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
    // strength *= step(0.8, mod(vUv.y * 10.0, 1.0));
    // gl_FragColor = vec4(vec3(strength), 1.0);

    float strength = step(0.4, mod(vUv.x * 10.0, 1.0));
    strength *= step(0.8, mod(vUv.y * 10.0, 1.0));
    gl_FragColor = vec4(vec3(strength), 1.0);
}