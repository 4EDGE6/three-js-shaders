import GUI from "lil-gui";
import {
  Color,
  DoubleSide,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Timer,
  TorusKnotGeometry,
  Uniform,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import vertexShader from "./shaders/light_shading/vertex.vert";
import fragmentShader from "./shaders/light_shading/fragment.frag";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 10;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const materialParams = {
  color: 0xffffff,
};

const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uColor: new Uniform(new Color(materialParams.color)),
  },
});

gui.addColor(materialParams, "color").onChange(() => {
  material.uniforms.uColor.value.set(materialParams.color);
});

const sphereGeometry = new SphereGeometry(1, 32, 32);
const sphere = new Mesh(sphereGeometry, material);

const torusKnotGeometry = new TorusKnotGeometry(0.5, 0.25, 100, 16);
const torusKnot = new Mesh(torusKnotGeometry, material);
torusKnot.position.x = 2;
scene.add(sphere, torusKnot);

const directionalLightHelper = new Mesh(
  new PlaneGeometry(),
  new MeshBasicMaterial({
    color: new Color(0.1, 0.1, 1),
    side: DoubleSide,
  })
);
directionalLightHelper.position.set(0, 0, 3);
scene.add(directionalLightHelper);

const pointLightHelper = new Mesh(
  new IcosahedronGeometry(0.1, 2),
  new MeshBasicMaterial({
    color: new Color(1, 0.1, 0.1),
  })
);
pointLightHelper.position.set(0, 2.5, 0);
scene.add(pointLightHelper);

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

  sphere.rotation.y = elapsedTime * 0.2;
  sphere.rotation.x = -elapsedTime * 0.1;
  torusKnot.rotation.y = elapsedTime * 0.2;
  torusKnot.rotation.x = -elapsedTime * 0.1;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
