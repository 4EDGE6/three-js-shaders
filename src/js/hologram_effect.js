import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Timer,
  TorusKnotGeometry,
  Uniform,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/hologram_effect/fragment.frag";
import vertexShader from "./shaders/hologram_effect/vertex.vert";
import GUI from "lil-gui";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 13;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const materialParams = {
  color: new Color(0xffffff),
};

gui.addColor(materialParams, "color");

const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  side: DoubleSide,
  depthWrite: false,
  blending: AdditiveBlending,
  uniforms: {
    uTime: new Uniform(0),
    uColor: new Uniform(materialParams.color),
  },
});

const sphereGeometry = new SphereGeometry(2, 64, 64);
const sphere = new Mesh(sphereGeometry, material);

const torusKnotGeometry = new TorusKnotGeometry(1, 0.5, 100, 16);
const torusKnot = new Mesh(torusKnotGeometry, material);
torusKnot.position.x = 4;
scene.add(sphere, torusKnot);

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

  material.uniforms.uTime.value = elapsedTime;

  sphere.rotation.y = elapsedTime * 0.2;
  sphere.rotation.x = -elapsedTime * 0.1;
  torusKnot.rotation.y = elapsedTime * 0.2;
  torusKnot.rotation.x = -elapsedTime * 0.1;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
