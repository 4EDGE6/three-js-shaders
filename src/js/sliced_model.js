import GUI from "lil-gui";
import {
  ACESFilmicToneMapping,
  AxesHelper,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RGBADepthPacking,
  Scene,
  Timer,
  Uniform,
  Vector3,
  WebGLRenderer,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import {
  DRACOLoader,
  GLTFLoader,
  HDRLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/sliced_model/fragment.frag";
import vertexShader from "./shaders/sliced_model/vertex.vert";

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
const scene = new Scene();

hdrLoader.load("/textures/environmentMaps/urban_alley_01_1k.hdr", (envMap) => {
  envMap.mapping = EquirectangularReflectionMapping;

  scene.background = envMap;
  scene.backgroundBlurriness = 0.5;
  scene.environment = envMap;
});

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.set(-5, 5, 12);
scene.add(camera);

const axesHelper = new AxesHelper(5);
axesHelper.visible = false;
scene.add(axesHelper);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const uniforms = {
  uSliceStart: new Uniform(1.75),
  uSliceArc: new Uniform(1.25),
};

const patchMap = {
  pmSlice: {
    "#include <colorspace_fragment>": `
      #include <colorspace_fragment>

      if(!gl_FrontFacing)
        gl_FragColor = vec4(.75, .15, .3, 1.);
    `,
  },
};

const material = new MeshStandardMaterial({
  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
});

const slicedMaterial = new CustomShaderMaterial({
  baseMaterial: MeshStandardMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  patchMap,

  metalness: 0.5,
  roughness: 0.25,
  envMapIntensity: 0.5,
  color: "#858080",
  side: DoubleSide,
});

const slicedDepthmaterial = new CustomShaderMaterial({
  baseMaterial: MeshDepthMaterial,
  vertexShader,
  fragmentShader,
  uniforms,
  patchMap,

  depthPacking: RGBADepthPacking,
});

let model;
gltfLoader.load("/models/gears.glb", (gltf) => {
  model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "outerHull") {
        child.material = slicedMaterial;
        child.customDepthMaterial = slicedDepthmaterial;
      } else {
        child.material = material;
      }

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});

const plane = new Mesh(
  new PlaneGeometry(10, 10, 10),
  new MeshStandardMaterial({ color: "#aaaaaa" })
);
plane.receiveShadow = true;
plane.position.x = -4;
plane.position.y = -3;
plane.position.z = -4;
plane.lookAt(new Vector3(0, 0, 0));
scene.add(plane);

const directionalLight = new DirectionalLight("#ffffff", 4);
directionalLight.position.set(6.25, 3, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.camera.top = 8;
directionalLight.shadow.camera.right = 8;
directionalLight.shadow.camera.bottom = -8;
directionalLight.shadow.camera.left = -8;
scene.add(directionalLight);

const renderer = new WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
// renderer.outputColorSpace = LinearSRGBColorSpace;
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

gui
  .add(uniforms.uSliceStart, "value", -Math.PI, Math.PI, 0.001)
  .name("Slice Start");
gui.add(uniforms.uSliceArc, "value", 0, Math.PI * 2, 0.001).name("Slice Arc");

const debugFoler = gui.addFolder("Debug").close();
const cameraFolder = debugFoler.addFolder("Camera");
cameraFolder.add(camera.position, "x", -100, 100, 1);
cameraFolder.add(camera.position, "y", -100, 100, 1);
cameraFolder.add(camera.position, "z", -100, 100, 1);
debugFoler.add(axesHelper, "visible").name("Axis");

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  if (model) model.rotation.y = elapsedTime * 0.1;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
