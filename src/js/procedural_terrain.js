import GUI from "lil-gui";
import { BoxGeometry, Color, RGBADepthPacking } from "three";
import { PlaneGeometry } from "three";
import { MeshStandardMaterial } from "three";
import {
  ACESFilmicToneMapping,
  AxesHelper,
  DirectionalLight,
  EquirectangularReflectionMapping,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { HDRLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertexShader from "./shaders/procedural_terrain/vertex.vert";
import fragmentShader from "./shaders/procedural_terrain/fragment.frag";
import { Uniform } from "three";
import { MeshDepthMaterial } from "three";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const camera = new PerspectiveCamera(
  35,
  screenSize.width / screenSize.height,
  0.1,
  100,
);
camera.position.set(-10, 6, -2);
scene.add(camera);

const hdrLoader = new HDRLoader();

hdrLoader.load("/textures/environmentMaps/spruit_sunrise_1k.hdr", (envMap) => {
  envMap.mapping = EquirectangularReflectionMapping;

  scene.background = envMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = envMap;
});

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// const placeholder = new Mesh(
//   new IcosahedronGeometry(2, 5),
//   new MeshPhysicalMaterial(),
// );
// scene.add(placeholder);

const outerBox = new Brush(new BoxGeometry(11, 2, 11));
const boxHole = new Brush(new BoxGeometry(10, 2.1, 10));

const evaluator = new Evaluator();
const board = evaluator.evaluate(outerBox, boxHole, SUBTRACTION);
board.geometry.clearGroups();
board.material = new MeshStandardMaterial({
  color: "#ffffff",
  metalness: 0,
  roughness: 0.3,
});
board.castShadow = true;
board.receiveShadow = true;
scene.add(board);

const debugObject = {
  colorWaterDeep: "#002b3d",
  colorWaterSurface: "#66a8ff",
  colorSand: "#ffe894",
  colorGrass: "#85d534",
  colorSnow: "#ffffff",
  colorRock: "#bfbd8d",
};

const uniforms = {
  uPositionFrequency: new Uniform(0.2),
  uStrenghth: new Uniform(2),
  uWarpFrequency: new Uniform(5),
  uWarpStrength: new Uniform(0.2),
  uTime: new Uniform(0),

  uColorWaterDeep: new Uniform(new Color(debugObject.colorWaterDeep)),
  uColorWaterSurface: new Uniform(new Color(debugObject.colorWaterSurface)),
  uColorSand: new Uniform(new Color(debugObject.colorSand)),
  uColorGrass: new Uniform(new Color(debugObject.colorGrass)),
  uColorSnow: new Uniform(new Color(debugObject.colorSnow)),
  uColorRock: new Uniform(new Color(debugObject.colorRock)),
};
gui
  .add(uniforms.uPositionFrequency, "value", 0, 1, 0.001)
  .name("uPositionFrequency");
gui.add(uniforms.uStrenghth, "value", 0, 10, 0.001).name("uStrenghth");
gui.add(uniforms.uWarpFrequency, "value", 0, 10, 0.001).name("uWarpFrequency");
gui.add(uniforms.uWarpStrength, "value", 0, 1, 0.001).name("uWarpStrength");

gui
  .addColor(debugObject, "colorWaterDeep")
  .onChange(() =>
    uniforms.uColorWaterDeep.value.set(debugObject.colorWaterDeep),
  );
gui
  .addColor(debugObject, "colorWaterSurface")
  .onChange(() =>
    uniforms.uColorWaterSurface.value.set(debugObject.colorWaterSurface),
  );
gui
  .addColor(debugObject, "colorSand")
  .onChange(() => uniforms.uColorSand.value.set(debugObject.colorSand));
gui
  .addColor(debugObject, "colorGrass")
  .onChange(() => uniforms.uColorGrass.value.set(debugObject.colorGrass));
gui
  .addColor(debugObject, "colorSnow")
  .onChange(() => uniforms.uColorSnow.value.set(debugObject.colorSnow));
gui
  .addColor(debugObject, "colorRock")
  .onChange(() => uniforms.uColorRock.value.set(debugObject.colorRock));

const geometry = new PlaneGeometry(10, 10, 500, 500);
geometry.deleteAttribute("uv");
geometry.deleteAttribute("normal");
geometry.rotateX(-Math.PI * 0.5);
const material = new CustomShaderMaterial({
  baseMaterial: MeshStandardMaterial,
  vertexShader,
  fragmentShader,
  uniforms,

  metalness: 0,
  roughness: 0.5,
  color: "#85d534",
});
const depthMaterial = new CustomShaderMaterial({
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  uniforms,

  depthPacking: RGBADepthPacking,
});
const terrain = new Mesh(geometry, material);
terrain.customDepthMaterial = depthMaterial;
terrain.receiveShadow = true;
terrain.castShadow = true;
scene.add(terrain);

const water = new Mesh(
  new PlaneGeometry(10, 10, 1, 1),
  new MeshPhysicalMaterial({
    transmission: 1,
    roughness: 0.3,
  }),
);
water.rotation.x = -Math.PI * 0.5;
water.position.y = -0.1;
scene.add(water);

const directionalLight = new DirectionalLight("#ffffff", 2);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

const renderer = new WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  aspectRatio = screenSize.width / screenSize.height;

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const debugFoler = gui.addFolder("Debug");
const cameraFolder = debugFoler.addFolder("Camera");
cameraFolder.add(camera.position, "x", -100, 100, 1);
cameraFolder.add(camera.position, "y", -100, 100, 1);
cameraFolder.add(camera.position, "z", -100, 100, 1);
debugFoler.add(axesHelper, "visible").name("Axis");

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  uniforms.uTime.value = elapsedTime;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
