import GUI from "lil-gui";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import fragmentShader from "./shaders/galaxy_generator/fragment.frag";
import vertexShader from "./shaders/galaxy_generator/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();

const scene = new Scene();

const camera = new PerspectiveCamera(75, aspectRatio, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/*
OBJECTS
*/
const params = {
  count: 100000,
  size: 30,
  radius: 5,
  branches: 3,
  curve: 1,
  spread: 0.2,
  spreadPower: 2,
  innerParticleColor: 0xffffff,
  outerParticleColor: 0xffffff,
  inverse: false,
};

const defaultParams = { ...params };

let particleGeometry = null;
let particleMaterial = null;
let particles = null;

const generateGalaxy = () => {
  if (!!particles) {
    particleGeometry.dispose();
    particleMaterial.dispose();
    scene.remove(particles);
  }

  const vertices = new Float32Array(params.count * 3);
  const colors = new Float32Array(params.count * 3);
  const scales = new Float32Array(params.count * 1);
  const randomness = new Float32Array(params.count * 3);

  const innerColors = new Color(params.innerParticleColor);
  const outerColors = new Color(params.outerParticleColor);

  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;

    const radius = Math.random() * params.radius;
    const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

    const particleDesnsity = params.inverse ? params.radius - radius : radius;

    vertices[i3] = Math.cos(branchAngle) * radius;
    vertices[i3 + 1] = 0;
    vertices[i3 + 2] = Math.sin(branchAngle) * radius;

    const randomX =
      Math.pow(Math.random(), params.spreadPower) *
      (Math.random() > 0.5 ? 1 : -1) *
      params.spread *
      particleDesnsity;
    const randomY =
      Math.pow(Math.random(), params.spreadPower) *
      (Math.random() > 0.5 ? 1 : -1) *
      params.spread *
      particleDesnsity;
    const randomZ =
      Math.pow(Math.random(), params.spreadPower) *
      (Math.random() > 0.5 ? 1 : -1) *
      params.spread *
      particleDesnsity;

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    const mixedColor = innerColors.clone();
    mixedColor.lerp(outerColors, radius / params.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    scales[i] = Math.random();
  }

  particleGeometry = new BufferGeometry();

  particleGeometry.setAttribute("position", new BufferAttribute(vertices, 3));

  particleGeometry.setAttribute("color", new BufferAttribute(colors, 3));

  particleGeometry.setAttribute("aScale", new BufferAttribute(scales, 1));

  particleGeometry.setAttribute(
    "aRandomness",
    new BufferAttribute(randomness, 3)
  );

  particleMaterial = new ShaderMaterial({
    depthWrite: false,
    blending: AdditiveBlending,
    vertexColors: true,
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms: {
      uSize: { value: params.size * renderer.getPixelRatio() },
      uTime: { value: 0 },
    },
  });

  particles = new Points(particleGeometry, particleMaterial);
  scene.add(particles);
};

const particleTweaks = gui.addFolder("Particles");
particleTweaks
  .add(params, "count", 0, 2000000, 100)
  .onFinishChange(generateGalaxy);
particleTweaks
  .add(params, "size", 0.001, 100, 0.001)
  .onFinishChange(generateGalaxy);
particleTweaks.add(params, "radius", 1, 100, 1).onFinishChange(generateGalaxy);
particleTweaks.add(params, "branches", 1, 30, 1).onFinishChange(generateGalaxy);
particleTweaks.add(params, "curve", -10, 10, 1).onFinishChange(generateGalaxy);
particleTweaks.add(params, "spread", 1, 5, 0.01).onFinishChange(generateGalaxy);
particleTweaks
  .add(params, "spreadPower", 1, 5, 0.01)
  .onFinishChange(generateGalaxy);
particleTweaks
  .addColor(params, "innerParticleColor")
  .onFinishChange(generateGalaxy);
particleTweaks
  .addColor(params, "outerParticleColor")
  .onFinishChange(generateGalaxy);
particleTweaks.add(params, "inverse").onFinishChange(generateGalaxy);

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

particleTweaks
  .add({ restart: () => generateGalaxy() }, "restart")
  .name("Restart Galaxy");

particleTweaks
  .add(
    {
      reset: () => {
        Object.keys(defaultParams).forEach((key) => {
          params[key] = defaultParams[key];
        });
        for (let controller of particleTweaks.controllers) {
          controller.updateDisplay();
        }
        generateGalaxy();
      },
    },
    "reset"
  )
  .name("Reset");

generateGalaxy();

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  aspectRatio = screenSize.width / screenSize.height;

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio));
});

const timer = new Timer();

console.log(particleGeometry.attributes.aRandomness);

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  particleMaterial.uniforms.uTime.value = elapsedTime;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
