import GUI from "lil-gui";
import {
  AxesHelper,
  CubeTextureLoader,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import {
  DotScreenPass,
  EffectComposer,
  GammaCorrectionShader,
  GlitchPass,
  GLTFLoader,
  OrbitControls,
  RenderPass,
  RGBShiftShader,
  ShaderPass,
  SMAAPass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new CubeTextureLoader();
const textureLoader = new TextureLoader();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.set(4, 1, -4);
scene.add(camera);

const axesHelper = new AxesHelper(5);
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

const renderTarget = new WebGLRenderTarget(800, 600, {
  samples: renderer.getPixelRatio() < 2 ? 2 : 0,
});

const effectComposer = new EffectComposer(renderer, renderTarget);
effectComposer.setSize(screenSize.width, screenSize.height);
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const renderPass = new RenderPass(scene, camera);
effectComposer.addPass(renderPass);

const dotScreenPass = new DotScreenPass();
dotScreenPass.enabled = false;
effectComposer.addPass(dotScreenPass);

const glitchPass = new GlitchPass();
glitchPass.goWild = false;
glitchPass.enabled = false;
effectComposer.addPass(glitchPass);

const rgbShifPass = new ShaderPass(RGBShiftShader);
rgbShifPass.enabled = false;
effectComposer.addPass(rgbShifPass);

const unrealBloomPass = new UnrealBloomPass();
unrealBloomPass.strength = 0.3;
unrealBloomPass.radius = 1;
unrealBloomPass.threshold = 0.6;
unrealBloomPass.enabled = false;
effectComposer.addPass(unrealBloomPass);

if (unrealBloomPass.enabled) {
  const bloomTweaks = gui.addFolder("Bloom");
  bloomTweaks.add(unrealBloomPass, "enabled");
  bloomTweaks.add(unrealBloomPass, "strength").min(0).max(2).step(0.001);
  bloomTweaks.add(unrealBloomPass, "radius").min(0).max(2).step(0.001);
  bloomTweaks.add(unrealBloomPass, "threshold").min(0).max(1).step(0.001);
}

const tintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTint: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main(){
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uTint;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.rgb += uTint;
      
      gl_FragColor = color;
    }
  `,
};

const tintPass = new ShaderPass(tintShader);
tintPass.material.uniforms.uTint.value = new Vector3();
tintPass.enabled = false;
effectComposer.addPass(tintPass);
if (tintPass.enabled) {
  const tintTweaks = gui.addFolder("Tint");
  tintTweaks
    .add(tintPass.material.uniforms.uTint.value, "x")
    .min(-1)
    .max(1)
    .step(0.001)
    .name("red");
  tintTweaks
    .add(tintPass.material.uniforms.uTint.value, "y")
    .min(-1)
    .max(1)
    .step(0.001)
    .name("green");
  tintTweaks
    .add(tintPass.material.uniforms.uTint.value, "z")
    .min(-1)
    .max(1)
    .step(0.001)
    .name("blue");
}

const displacementShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main(){
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vec2 newUv = vec2(vUv.x, vUv.y + sin(vUv.x * 10. + uTime) * .1);
      vec4 color = texture2D(tDiffuse, newUv);
      
      gl_FragColor = color;
    }
  `,
};
const displacementPass = new ShaderPass(displacementShader);
displacementPass.material.uniforms.uTime.value = 0;
displacementPass.enabled = false;
effectComposer.addPass(displacementPass);

const spaceMaskShader = {
  uniforms: {
    tDiffuse: { value: null },
    uNormalMap: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main(){
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);

      vUv = uv;
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D uNormalMap;
    varying vec2 vUv;

    void main() {
      vec3 normalColor = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      vec2 newUv = vUv + normalColor.xy * 0.1;
      vec4 color = texture2D(tDiffuse, newUv);

      // vec3 lightDirection = normalize(vec3(- 1.0, 1.0, 0.0));
      // float lightness = clamp(dot(normalColor, lightDirection), 0.0, 1.0);
      // color.rgb += lightness * 2.0;
      
      gl_FragColor = color;
    }
  `,
};
const spaceMaskPass = new ShaderPass(spaceMaskShader);
spaceMaskPass.material.uniforms.uNormalMap.value = textureLoader.load(
  "/textures/interfaceNormalMap.png",
);
spaceMaskPass.enabled = true;
effectComposer.addPass(spaceMaskPass);

const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
gammaCorrectionPass.enabled = true;
effectComposer.addPass(gammaCorrectionPass);

if (renderer.getPixelRatio() < 2 && !renderer.capabilities.isWebGL2) {
  const smaaPass = new SMAAPass();
  effectComposer.addPass(smaaPass);
  console.log("Using SMAA");
}

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  aspectRatio = screenSize.width / screenSize.height;

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  effectComposer.setSize(screenSize.width, screenSize.height);
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  displacementPass.material.uniforms.uTime.value = elapsedTime;

  controls.update();
  // renderer.render(scene, camera);
  effectComposer.render();
  window.requestAnimationFrame(animate);
};

animate();
