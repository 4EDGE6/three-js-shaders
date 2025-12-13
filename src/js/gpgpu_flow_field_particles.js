import GUI from "lil-gui";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Timer,
  Uniform,
  Vector2,
  WebGLRenderer,
} from "three";
import {
  DRACOLoader,
  GLTFLoader,
  GPUComputationRenderer,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/gpgpu_flow_field_particles/fragment.frag";
import vertexShader from "./shaders/gpgpu_flow_field_particles/vertex.vert";
import gpgpuShader from "./shaders/gpgpu_flow_field_particles/gpgpu.frag";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: Math.min(window.devicePixelRatio, 2),
  resolution: new Vector2(),
};
screenSize.resolution.set(
  screenSize.width * screenSize.devicePixelRatio,
  screenSize.height * screenSize.devicePixelRatio
);

let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const guiParams = {
  pointSize: 0.07,
  clearColor: "#000000",
};

const gltfLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(draco);

const gltf = await gltfLoader.loadAsync("/models/ship.glb");

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 12;
camera.position.x = 12;
camera.position.y = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(screenSize.devicePixelRatio);
renderer.setClearColor(guiParams.clearColor);

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  aspectRatio = screenSize.width / screenSize.height;
  screenSize.devicePixelRatio = Math.min(window.devicePixelRatio, 2);
  screenSize.resolution.set(
    screenSize.width * screenSize.devicePixelRatio,
    screenSize.height * screenSize.devicePixelRatio
  );

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(screenSize.devicePixelRatio);
});

const baseGeometry = {};
baseGeometry.instance = gltf.scene.children[0].geometry;
baseGeometry.count = baseGeometry.instance.attributes.position.count;

const gpgpu = {};
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count));
gpgpu.computation = new GPUComputationRenderer(
  gpgpu.size,
  gpgpu.size,
  renderer
);
const basParticlesTexture = gpgpu.computation.createTexture();

for (let i = 0; i < baseGeometry.count; i++) {
  const i3 = i * 3;
  const i4 = i * 4;

  basParticlesTexture.image.data[i4] =
    baseGeometry.instance.attributes.position.array[i3];
  basParticlesTexture.image.data[i4 + 1] =
    baseGeometry.instance.attributes.position.array[i3 + 1];
  basParticlesTexture.image.data[i4 + 2] =
    baseGeometry.instance.attributes.position.array[i3 + 2];
  basParticlesTexture.image.data[i4 + 3] = Math.random();
}

gpgpu.particlesVariable = gpgpu.computation.addVariable(
  "uParticles",
  gpgpuShader,
  basParticlesTexture
);
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [
  gpgpu.particlesVariable,
]);
gpgpu.particlesVariable.material.uniforms.uTime = new Uniform(0);
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new Uniform(0);
gpgpu.particlesVariable.material.uniforms.uBase = new Uniform(
  basParticlesTexture
);
gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new Uniform(
  0.5
);
gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new Uniform(2);
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new Uniform(
  0.5
);
gpgpu.computation.init();

gpgpu.debug = new Mesh(
  new PlaneGeometry(3, 3),
  new MeshBasicMaterial({
    side: DoubleSide,
    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable)
      .texture,
  })
);
gpgpu.debug.position.x = 3;
gpgpu.debug.visible = false;
scene.add(gpgpu.debug);

const particles = {};
particles.geometry = new BufferGeometry();
particles.geometry.setDrawRange(0, baseGeometry.count);

const particlesUvArray = new Float32Array(baseGeometry.count * 2);
const sizes = new Float32Array(baseGeometry.count);

for (let y = 0; y < gpgpu.size; y++) {
  for (let x = 0; x < gpgpu.size; x++) {
    const i = y * gpgpu.size + x;
    const i2 = i * 2;

    const uvX = (x + 0.5) / gpgpu.size;
    const uvY = (y + 0.5) / gpgpu.size;

    particlesUvArray[i2] = uvX;
    particlesUvArray[i2 + 1] = uvY;

    sizes[i] = Math.random();
  }
}
particles.geometry.setAttribute(
  "aParticlesUv",
  new BufferAttribute(particlesUvArray, 2)
);
particles.geometry.setAttribute(
  "aColor",
  baseGeometry.instance.attributes.color
);
particles.geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));

particles.material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  uniforms: {
    uSize: new Uniform(guiParams.pointSize),
    uResolution: new Uniform(screenSize.resolution),
    uParticleTexture: new Uniform(),
  },
});
particles.points = new Points(particles.geometry, particles.material);
scene.add(particles.points);

gui
  .add(guiParams, "pointSize")
  .min(0.001)
  .max(1)
  .step(0.001)
  .onFinishChange(() => {
    particles.material.uniforms.uSize.value = guiParams.pointSize;
  });
gui.addColor(guiParams, "clearColor").onChange((color) => {
  renderer.setClearColor(color);
});
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence, "value")
  .min(0)
  .max(1)
  .step(0.1)
  .name("Influence");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength, "value")
  .min(0)
  .max(10)
  .step(0.1)
  .name("Strength");
gui
  .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Frequency");

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();
  const deltaTime = timer.getDelta();

  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
  gpgpu.computation.compute();
  particles.material.uniforms.uParticleTexture.value =
    gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
