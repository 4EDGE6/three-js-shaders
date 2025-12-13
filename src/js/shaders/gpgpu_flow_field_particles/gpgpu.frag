uniform float uTime;
uniform float uDeltaTime;
uniform float uFlowFieldInfluence;
uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency;
uniform sampler2D uBase;

#include ../includes/simplexNoise4d.glsl;

void main() {
    float time = uTime * .2;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture2D(uParticles, uv);
    vec4 base = texture2D(uBase, uv);

    if(particle.a >= 1.) {
        particle.a = mod(particle.a, 1.);
        particle.xyz = base.xyz;
    } else {
        float strength = simplexNoise4d(vec4(base.xyz * .2, time + 1.));
        float influence = (uFlowFieldInfluence - .5) * (-2.);
        strength = smoothstep(influence, 1., strength);

        vec3 flowField = vec3(simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency, time)), simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 1., time)), simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 2., time)));
        flowField = normalize(flowField);
        particle.xyz += flowField * uDeltaTime * strength * uFlowFieldStrength;

        particle.a += uDeltaTime * .3;
    }
    gl_FragColor = particle;
}