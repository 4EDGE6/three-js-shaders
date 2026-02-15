import gsap from "gsap";
import GUI from "lil-gui";
import {
  AxesHelper,
  CubeTextureLoader,
  DirectionalLight,
  LoadingManager,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  ReinhardToneMapping,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Timer,
  Uniform,
  WebGLRenderer,
} from "three";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const overlayGeometry = new PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: new Uniform(1),
  },
  vertexShader: `
        void main(){
            gl_Position = vec4(position, 1.);
        }
    `,
  fragmentShader: `
        uniform float uAlpha;
  
        void main(){
            gl_FragColor = vec4(0., 0., 0., uAlpha);
        }
    `,
});

const overlay = new Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

const loadingEl = document.querySelector(".loading-bar");
const loadingManager = new LoadingManager(
  () => {
    gsap.delayedCall(0.5, () => {
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 });
      loadingEl.classList.add("ended");
      loadingEl.style.transform = "";
    });
  },
  (items, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    loadingEl.style.transform = `scaleX(${progress}) translateY(-50%)`;
  },
);
const gltfLoader = new GLTFLoader(loadingManager);
const cubeTextureLoader = new CubeTextureLoader(loadingManager);

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.set(4, 1, -4);
scene.add(camera);

const axesHelper = new AxesHelper(5);
axesHelper.visible = false;
scene.add(axesHelper);

const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof Mesh &&
      child.material instanceof MeshStandardMaterial
    ) {
      child.material.envMapIntensity = 2.5;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/0/px.jpg",
  "/textures/environmentMaps/0/nx.jpg",
  "/textures/environmentMaps/0/py.jpg",
  "/textures/environmentMaps/0/ny.jpg",
  "/textures/environmentMaps/0/pz.jpg",
  "/textures/environmentMaps/0/nz.jpg",
]);

scene.background = environmentMap;
scene.environment = environmentMap;

gltfLoader.load("/models/DamagedHelmet/glTF/DamagedHelmet.gltf", (gltf) => {
  gltf.scene.scale.set(2, 2, 2);
  gltf.scene.rotation.y = Math.PI * 0.5;
  scene.add(gltf.scene);

  updateAllMaterials();
});

const directionalLight = new DirectionalLight("#ffffff", 3);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
renderer.toneMapping = ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputColorSpace = SRGBColorSpace;
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

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
