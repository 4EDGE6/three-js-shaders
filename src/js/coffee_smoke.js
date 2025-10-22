import {
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Timer,
  Uniform,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import vertexShader from "./shaders/coffee_smoke/vertex.vert";
import fragmentShader from "./shaders/coffee_smoke/fragment.frag";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const textureLoader = new TextureLoader();
const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 10;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const perlinTexture = textureLoader.load("/textures/perlin_noise/perlin.png");
perlinTexture.wrapS = RepeatWrapping;
perlinTexture.wrapT = RepeatWrapping;

const smokeGeometry = new PlaneGeometry(1, 1, 16, 64);
// smokeGeometry.translate(0, 0.5, 0);
smokeGeometry.scale(1.5, 6, 1.5);

const smokeMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  side: DoubleSide,
  transparent: true,
  depthWrite: false,
  uniforms: {
    uTime: new Uniform(0),
    uPerlinTexture: new Uniform(perlinTexture),
  },
});

const smoke = new Mesh(smokeGeometry, smokeMaterial);
scene.add(smoke);

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  smoke.material.uniforms.uTime.value = elapsedTime;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
