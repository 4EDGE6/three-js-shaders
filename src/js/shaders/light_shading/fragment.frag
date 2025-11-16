uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/ambientLight.glsl
#include ../includes/directionalLight.glsl
#include ../includes/pointLight.glsl

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 color = uColor;

    vec3 light = vec3(0.);
    light += ambientLight(vec3(1.), .03);
    light += directionalLight(vec3(.1, .1, 1.), 1., normal, vec3(.0, .0, .3), viewDirection, 20.);
    light += pointLight(vec3(1., .1, .1), 1., normal, vec3(.0, 2.5, .0), viewDirection, 20., vPosition, .3);

    color *= light;

    gl_FragColor = vec4(color, 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}