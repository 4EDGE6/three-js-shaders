vec3 directionalLight(vec3 color, float intensity, vec3 normal, vec3 position, vec3 viewDirection, float specularPower) {
    vec3 direction = normalize(position);
    vec3 reflection = reflect(-direction, normal);

    float shading = dot(normal, direction);
    shading = max(0., shading);

    float specular = -dot(reflection, viewDirection);
    specular = max(.0, specular);
    specular = pow(specular, specularPower);

    return color * intensity * (shading + specular);
}