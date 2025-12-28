import GUI from "lil-gui";
import {
  ACESFilmicToneMapping,
  AxesHelper,
  Color,
  DirectionalLight,
  EquirectangularReflectionMapping,
  IcosahedronGeometry,
  Mesh,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RGBADepthPacking,
  Scene,
  Timer,
  Uniform,
  WebGLRenderer,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import {
  DRACOLoader,
  GLTFLoader,
  HDRLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import fragmentShader from "./shaders/wobbly_sphere/fragment.frag";
import vertexShader from "./shaders/wobbly_sphere/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const hdrLoader = new HDRLoader();
const gltfLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(draco);

const gui = new GUI();

const guiParams = {
  colorA: "#0000ff",
  colorB: "#ff0000",
};

const scene = new Scene();

hdrLoader.load(
  "/textures/environmentMaps/urban_alley_01_1k.hdr",
  (environmentMap) => {
    environmentMap.mapping = EquirectangularReflectionMapping;

    scene.background = environmentMap;
    scene.environment = environmentMap;
  }
);

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.x = 1;
camera.position.y = 4;
camera.position.z = -23;
scene.add(camera);

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const uniforms = {
  uTime: new Uniform(0),
  uPositionFrequency: new Uniform(0.5),
  uTimeFrequency: new Uniform(0.4),
  uStrength: new Uniform(0.3),

  uWarpedPositionFrequency: new Uniform(0.38),
  uWarpedTimeFrequency: new Uniform(0.12),
  uWarpedStrength: new Uniform(1.7),

  uColorA: new Uniform(new Color(guiParams.colorA)),
  uColorB: new Uniform(new Color(guiParams.colorB)),
};

const depthMaterial = new CustomShaderMaterial({
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  uniforms,

  depthPacking: RGBADepthPacking,
});

const material = new CustomShaderMaterial({
  baseMaterial: MeshPhysicalMaterial,
  vertexShader,
  fragmentShader,
  uniforms,

  metalness: 0,
  roughness: 0.5,
  color: guiParams.color,
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

let geometry = new IcosahedronGeometry(2.5, 50);
geometry = mergeVertices(geometry);
geometry.computeTangents();

const wobble = new Mesh(geometry, material);
wobble.customDepthMaterial = depthMaterial;
wobble.receiveShadow = true;
wobble.castShadow = true;
scene.add(wobble);

const plane = new Mesh(
  new PlaneGeometry(15, 15, 15),
  new MeshStandardMaterial()
);
plane.receiveShadow = true;
plane.rotation.y = Math.PI;
plane.position.y = -5;
plane.position.z = 5;
scene.add(plane);

const directionalLight = new DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

const wobbleTweaks = gui.addFolder("Wobble");
wobbleTweaks
  .add(uniforms.uPositionFrequency, "value", 0, 2, 0.0001)
  .name("Position Frequency");
wobbleTweaks
  .add(uniforms.uTimeFrequency, "value", 0, 2, 0.0001)
  .name("Time Frequency");
wobbleTweaks.add(uniforms.uStrength, "value", 0, 2, 0.0001).name("Strength");

const warpedTweaks = gui.addFolder("Warped");
warpedTweaks
  .add(uniforms.uWarpedPositionFrequency, "value", 0, 2, 0.0001)
  .name("Position Frequency");
warpedTweaks
  .add(uniforms.uWarpedTimeFrequency, "value", 0, 2, 0.0001)
  .name("Time Frequency");
warpedTweaks
  .add(uniforms.uWarpedStrength, "value", 0, 2, 0.0001)
  .name("Strength");

const materialTweaks = gui.addFolder("Material");
materialTweaks.add(material, "metalness", 0, 1, 0.001);
materialTweaks.add(material, "roughness", 0, 1, 0.001);
materialTweaks.add(material, "transmission", 0, 1, 0.001);
materialTweaks.add(material, "ior", 0, 10, 0.001);
materialTweaks.add(material, "thickness", 0, 10, 0.001);

materialTweaks.addColor(guiParams, "colorA").onChange(() => {
  uniforms.uColorA.value.set(guiParams.colorA);
});
materialTweaks.addColor(guiParams, "colorB").onChange(() => {
  uniforms.uColorB.value.set(guiParams.colorB);
});

const cameraFolder = gui.addFolder("Camera").close();
cameraFolder.add(camera.position, "x", -100, 100, 1);
cameraFolder.add(camera.position, "y", -100, 100, 1);
cameraFolder.add(camera.position, "z", -100, 100, 1);

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
