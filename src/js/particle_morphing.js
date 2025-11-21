import GUI from "lil-gui";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  Uniform,
  Vector2,
  WebGLRenderer,
} from "three";
import {
  DRACOLoader,
  GLTFLoader,
  OrbitControls,
} from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/particle_morphing/fragment.frag";
import vertexShader from "./shaders/particle_morphing/vertex.vert";
import gsap from "gsap";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: Math.min(window.devicePixelRatio, 2),
};
screenSize.resolution = new Vector2(
  screenSize.width * screenSize.devicePixelRatio,
  screenSize.height * screenSize.devicePixelRatio
);

let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gltfLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(draco);

let particles;

gltfLoader.load("/models/models.glb", (gltf) => {
  const positions = gltf.scene.children.map(
    (child) => child.geometry.attributes.position
  );

  particles = {};
  particles.size = 0.2;
  particles.maxCount = 0;
  particles.index = 0;
  particles.colorOne = "#ff0000";
  particles.colorTwo = "#813d9c";

  for (const position of positions) {
    if (position.count > particles.maxCount)
      particles.maxCount = position.count;
  }

  particles.positions = [];

  for (const position of positions) {
    const originalArr = position.array;
    if (originalArr.length === particles.maxCount * 3) {
      particles.positions.push(new Float32BufferAttribute(originalArr, 3));
      continue;
    }

    const newArr = new Float32Array(particles.maxCount * 3);

    for (let i = 0; i < particles.maxCount; i++) {
      const i3 = i * 3;

      if (i3 < originalArr.length) {
        newArr[i3] = originalArr[i3];
        newArr[i3 + 1] = originalArr[i3 + 1];
        newArr[i3 + 2] = originalArr[i3 + 2];
      } else {
        const randomIndex = Math.floor(position.count * Math.random()) * 3;
        newArr[i3] = originalArr[randomIndex];
        newArr[i3 + 1] = originalArr[randomIndex + 1];
        newArr[i3 + 2] = originalArr[randomIndex + 2];
      }
    }

    particles.positions.push(new Float32BufferAttribute(newArr, 3));
  }

  const sizes = new Float32Array(particles.maxCount);

  for (let i = 0; i < particles.maxCount; i++) {
    sizes[i] = Math.random();
  }

  particles.geometry = new BufferGeometry();
  particles.geometry.setAttribute(
    "position",
    particles.positions[particles.index]
  );
  particles.geometry.setAttribute("aPositionTarget", particles.positions[3]);
  particles.geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  particles.geometry.setIndex(null);
  particles.geometry.deleteAttribute("normal");

  particles.material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uSize: new Uniform(particles.size),
      uResolution: new Uniform(screenSize.resolution),
      uProgress: new Uniform(0),
      uColorOne: new Uniform(new Color(particles.colorOne)),
      uColorTwo: new Uniform(new Color(particles.colorTwo)),
    },
    depthWrite: false,
    blending: AdditiveBlending,
  });

  particles.points = new Points(particles.geometry, particles.material);
  particles.points.frustumCulled = false;

  scene.add(particles.points);

  particles.morph = (i) => {
    particles.geometry.attributes.position =
      particles.positions[particles.index];
    particles.geometry.attributes.aPositionTarget = particles.positions[i];

    gsap.fromTo(
      particles.material.uniforms.uProgress,
      { value: 0 },
      { value: 1, duration: 3, ease: "linear" }
    );

    particles.index = i;
  };

  particles.morph0 = () => particles.morph(0);
  particles.morph1 = () => particles.morph(1);
  particles.morph2 = () => particles.morph(2);
  particles.morph3 = () => particles.morph(3);

  gui.addColor(particles, "colorOne").onChange(() => {
    particles.material.uniforms.uColorOne.value.set(particles.colorOne);
  });
  gui.addColor(particles, "colorTwo").onChange(() => {
    particles.material.uniforms.uColorTwo.value.set(particles.colorTwo);
  });
  gui
    .add(particles.material.uniforms.uProgress, "value")
    .min(0)
    .max(1)
    .step(0.001)
    .name("Progress")
    .listen();
  gui.add(particles, "morph0");
  gui.add(particles, "morph1");
  gui.add(particles, "morph2");
  gui.add(particles, "morph3");

  particles.morph2();
});

const gui = new GUI();

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 12;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const guiParams = {
  clearColor: "#160920",
};

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

gui.addColor(guiParams, "clearColor").onChange(() => {
  renderer.setClearColor(guiParams.clearColor);
});

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
