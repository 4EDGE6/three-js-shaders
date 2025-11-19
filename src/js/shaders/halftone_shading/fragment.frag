uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uShadowRepetitions;
uniform vec3 uShadowColor;
uniform float uLightRepetitions;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/ambientLight.glsl;
#include ../includes/directionalLight.glsl;

vec3 halftone(
    vec3 normal,
    vec3 direction,
    vec3 color,
    float repetitions,
    float low,
    float high,
    vec3 pointColor
) {
    float intensity = dot(normal, direction);
    intensity = smoothstep(low, high, intensity);

    vec2 uv = gl_FragCoord.xy / uResolution.y;
    uv *= repetitions;
    uv = mod(uv, 1.);

    float point = distance(uv, vec2(0.5));
    point = 1. - step(.5 * intensity, point);

    return mix(color, pointColor, point);
}

void main() {
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 normal = normalize(vNormal);
    vec3 color = uColor;

    vec3 light = vec3(0.);
    light += ambientLight(vec3(1.), 1.);
    light += directionalLight(vec3(1.), 1., normal, vec3(1., 1., 0.), viewDirection, 1.);
    color *= light;

    color = halftone(normal, vec3(.0, -1., .0), color, uShadowRepetitions, -.8, 1.5, uShadowColor);
    color += halftone(normal, vec3(1., 1., .0), color, uLightRepetitions, .5, 1.5, uLightColor);
    gl_FragColor = vec4(color, 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}