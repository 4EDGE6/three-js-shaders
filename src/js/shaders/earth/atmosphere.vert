varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.);
    vec4 projectionPosition = projectionMatrix * viewMatrix * modelPosition;

    vec3 modelNormal = (modelMatrix * vec4(normal, 1.9)).xyz;

    gl_Position = projectionPosition;

    vNormal = modelNormal;
    vPosition = modelPosition.xyz;
}