vec3 pointLight(vec3 color, float intensity, vec3 normal, vec3 position, vec3 viewDirection, float specularPower, vec3 modelPosition, float lightDecay) {
    vec3 delta = position - modelPosition;
    float lightDistance = length(delta);

    vec3 direction = normalize(delta);
    vec3 reflection = reflect(-direction, normal);

    float shading = dot(normal, direction);
    shading = max(0., shading);

    float specular = -dot(reflection, viewDirection);
    specular = max(.0, specular);
    specular = pow(specular, specularPower);

    float decay = 1. - lightDistance * lightDecay;
    decay = max(.0, decay);
    
    return color * intensity * decay * (shading + specular);
}