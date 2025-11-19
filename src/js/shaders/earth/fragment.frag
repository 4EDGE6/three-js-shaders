uniform sampler2D uDayTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uSpecularCloudsTexture;
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    vec3 color = vec3(vUv, 1.);

    float sunOrientation = dot(uSunDirection, normal);
    float dayMix = smoothstep(-.25, .5, sunOrientation);

    vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
    vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
    color = mix(nightColor, dayColor, dayMix);

    vec2 specularCloudColor = texture2D(uSpecularCloudsTexture, vUv).rg;
    float cloudMix = smoothstep(.2, 1., specularCloudColor.g);
    cloudMix *= dayMix;
    color = mix(color, vec3(1.), cloudMix);

    float atmosphereDayMix = smoothstep(-.5, 1., sunOrientation);
    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);

    float fresnel = 1. + dot(viewDirection, normal);
    fresnel = pow(fresnel, 2.);

    vec3 reflection = reflect(-uSunDirection, normal);
    float specular = -dot(reflection, viewDirection);
    specular = max(specular, 0.);
    specular = pow(specular, 32.);
    specular *= specularCloudColor.r;

    vec3 specularColor = mix(vec3(1.), atmosphereColor, fresnel);
    color += specularColor * specular;

    color += mix(color, atmosphereColor, fresnel * atmosphereDayMix);

    gl_FragColor = vec4(color, 1.);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}