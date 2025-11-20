uniform sampler2D uPictureTexture;
uniform sampler2D uCanvasTexture;
uniform vec2 uResolution;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

void main() {
    vec3 newPosition = position;
    float displaceMentIntensity = texture2D(uCanvasTexture, uv).r;
    displaceMentIntensity = smoothstep(.1, .3, displaceMentIntensity);

    vec3 displacement = vec3(cos(aAngle) * .2, sin(aAngle) * .2, 1.);
    displacement = normalize(displacement);
    displacement = displacement * displaceMentIntensity;
    displacement *= 3.;
    displacement *= aIntensity;

    newPosition += displacement;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    float pictureIntensity = texture2D(uPictureTexture, uv).r;

    gl_Position = projectionPosition;
    gl_PointSize = 0.15 * pictureIntensity * uResolution.y;
    gl_PointSize *= (1. / -viewPosition.z);

    vColor = vec3(pow(pictureIntensity, 2.));
}