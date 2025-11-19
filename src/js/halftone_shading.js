import GUI from "lil-gui";
import {
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Timer,
  TorusKnotGeometry,
  Uniform,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/halftone_shading/fragment.frag";
import vertexShader from "./shaders/halftone_shading/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 8;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const params = {
  clearColor: "#26132f",
};

const materialParams = {
  color: "#ff794d",
  shadowColor: "#8219b8",
  lightColor: "#e5ffe0",
};

const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,

  uniforms: {
    uColor: new Uniform(new Color(materialParams.color)),
    uResolution: new Uniform(
      new Vector2(
        screenSize.width * screenSize.pixelRatio,
        screenSize.height * screenSize.pixelRatio
      )
    ),
    uShadowRepetitions: new Uniform(100),
    uShadowColor: new Uniform(new Color(materialParams.shadowColor)),
    uLightRepetitions: new Uniform(130),
    uLightColor: new Uniform(new Color(materialParams.lightColor)),
  },
});

const sphereGeometry = new SphereGeometry(0.9, 32, 32);
const sphere = new Mesh(sphereGeometry, material);

const torusKnotGeometry = new TorusKnotGeometry(0.5, 0.2, 100, 16);
const torusKnot = new Mesh(torusKnotGeometry, material);
torusKnot.position.x = 2;
scene.add(sphere, torusKnot);

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(params.clearColor);

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  aspectRatio = screenSize.width / screenSize.height;
  screenSize.pixelRatio = Math.min(window.devicePixelRatio, 2);

  material.uniforms.uResolution.value.set(
    screenSize.width * screenSize.pixelRatio,
    screenSize.height * screenSize.pixelRatio
  );

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(screenSize.pixelRatio);
});

gui.addColor(materialParams, "color").onChange((color) => {
  material.uniforms.uColor.value.set(color);
});
gui.addColor(params, "clearColor").onChange((color) => {
  renderer.setClearColor(color);
});
gui.add(material.uniforms.uShadowRepetitions, "value").min(1).max(300).step(1);
gui.addColor(materialParams, "shadowColor").onChange((color) => {
  material.uniforms.uShadowColor.value.set(color);
});
gui.add(material.uniforms.uLightRepetitions, "value").min(1).max(300).step(1);
gui.addColor(materialParams, "lightColor").onChange((color) => {
  material.uniforms.uLightColor.value.set(color);
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
