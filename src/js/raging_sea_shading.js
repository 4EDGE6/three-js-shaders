import GUI from "lil-gui";
import {
  ACESFilmicToneMapping,
  AxesHelper,
  Color,
  DoubleSide,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Timer,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import waterFragmentShader from "./shaders/raging_sea_shading/fragment.frag";
import waterVertexShader from "./shaders/raging_sea_shading/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const debug = {
  depthColor: "#ff7800",
  surfaceColor: "#1a5fb4",
};

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 2;
camera.position.y = 2;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const material = new ShaderMaterial({
  fragmentShader: waterFragmentShader,
  vertexShader: waterVertexShader,
  side: DoubleSide,
  uniforms: {
    uTime: { value: 0 },
    uWavesElevation: { value: 0.2 },
    uWaveFrequency: {
      value: new Vector2(4, 1),
    },
    uWaveSpeed: { value: 0.75 },

    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallWavesIterations: { value: 4 },

    uDepthColor: { value: new Color(debug.depthColor) },
    uSurfaceColor: { value: new Color(debug.surfaceColor) },
    uColorOffset: { value: 0.925 },
    uColorMultiplier: { value: 1 },
  },
});

gui
  .add(material.uniforms.uWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("uWavesElevation");
gui
  .add(material.uniforms.uWaveFrequency.value, "x")
  .min(0)
  .max(10)
  .step(0.01)
  .name("uWavesElevationX");
gui
  .add(material.uniforms.uWaveFrequency.value, "y")
  .min(0)
  .max(10)
  .step(0.01)
  .name("uWavesElevationY");
gui
  .add(material.uniforms.uWaveSpeed, "value")
  .min(0)
  .max(4)
  .step(0.01)
  .name("uWaveSpeed");

gui
  .add(material.uniforms.uSmallWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("uSmallWavesElevation");
gui
  .add(material.uniforms.uSmallWavesFrequency, "value")
  .min(0)
  .max(10)
  .step(0.01)
  .name("uSmallWavesFrequency");
gui
  .add(material.uniforms.uSmallWavesSpeed, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("uSmallWavesSpeed");
gui
  .add(material.uniforms.uSmallWavesIterations, "value")
  .min(0)
  .max(8)
  .step(1)
  .name("uSmallWavesIterations");

gui.addColor(debug, "depthColor").onChange(() => {
  material.uniforms.uDepthColor.value.set(debug.depthColor);
});
gui.addColor(debug, "surfaceColor").onChange(() => {
  material.uniforms.uSurfaceColor.value.set(debug.surfaceColor);
});
gui
  .add(material.uniforms.uColorOffset, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("uColorOffset");
gui
  .add(material.uniforms.uColorMultiplier, "value")
  .min(0)
  .max(10)
  .step(0.01)
  .name("uColorMultiplier");

const geometry = new PlaneGeometry(2, 2, 512, 512);
geometry.deleteAttribute("normal");
geometry.deleteAttribute("uv");

const plane = new Mesh(geometry, material);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

const axesHelper = new AxesHelper();
axesHelper.position.y = 0.25;
scene.add(axesHelper);

const renderer = new WebGLRenderer({ canvas });
renderer.toneMapping = ACESFilmicToneMapping;
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

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
