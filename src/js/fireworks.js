import gsap from "gsap";
import GUI from "lil-gui";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Spherical,
  TextureLoader,
  Timer,
  Uniform,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls, Sky } from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/fireworks/fragment.frag";
import vertexShader from "./shaders/fireworks/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};
screenSize["resolution"] = new Vector2(
  screenSize.width * screenSize.pixelRatio,
  screenSize.height * screenSize.pixelRatio
);

let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const scene = new Scene();
const gui = new GUI();
const textureLoader = new TextureLoader();

const textures = [
  textureLoader.load("/particles/1.png"),
  textureLoader.load("/particles/2.png"),
  textureLoader.load("/particles/3.png"),
  textureLoader.load("/particles/4.png"),
  textureLoader.load("/particles/5.png"),
  textureLoader.load("/particles/6.png"),
  textureLoader.load("/particles/7.png"),
  textureLoader.load("/particles/8.png"),
];

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(screenSize.pixelRatio);

window.addEventListener("resize", () => {
  screenSize.width = window.innerWidth;
  screenSize.height = window.innerHeight;
  screenSize.pixelRatio = Math.min(window.devicePixelRatio, 2);
  screenSize.resolution.set(
    window.innerWidth * screenSize.pixelRatio,
    window.innerHeight * screenSize.pixelRatio
  );

  aspectRatio = screenSize.width / screenSize.height;

  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(screenSize.width, screenSize.height);
  renderer.setPixelRatio(screenSize.pixelRatio);
});

const createFirework = ({
  count = 100,
  position = new Vector3(),
  size = 0.5,
  texture = textures[7],
  radius = 1,
  color = new Color(0xfff),
}) => {
  const posArr = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const timeMultipliers = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const spherical = new Spherical(
      radius * (0.75 + Math.random() * 0.25),
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2
    );
    const position = new Vector3();
    position.setFromSpherical(spherical);

    posArr[i3] = position.x;
    posArr[i3 + 1] = position.y;
    posArr[i3 + 2] = position.z;

    sizes[i] = Math.random();
    timeMultipliers[i] = 1 + Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(posArr, 3));
  geometry.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute(
    "aTimeMultiplier",
    new Float32BufferAttribute(timeMultipliers, 1)
  );

  texture.flipY = false;
  const material = new ShaderMaterial({
    fragmentShader,
    vertexShader,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uSize: new Uniform(size),
      uResolution: new Uniform(screenSize.resolution),
      uTexture: new Uniform(texture),
      uColor: new Uniform(color),
      uProgress: new Uniform(0),
    },
  });

  const fireworks = new Points(geometry, material);
  fireworks.position.copy(position);
  scene.add(fireworks);

  const destroy = () => {
    scene.remove(fireworks);
    geometry.dispose();
    material.dispose();
  };

  gsap.to(material.uniforms.uProgress, {
    value: 1,
    duration: 3,
    ease: "linear",
    onComplete: destroy,
  });
};

const createRandomFireWork = () => {
  const count = Math.round(400 + Math.random() * 1000);
  const position = new Vector3(
    (Math.random() - 0.5) * 2,
    Math.random(),
    (Math.random() - 0.5) * 2
  );
  const size = 0.1 + Math.random() * 0.1;
  const texture = textures[Math.floor(Math.random() * textures.length)];

  const radius = 0.5 + Math.random();

  const color = new Color();
  color.setHSL(Math.random(), 1, 0.7);

  createFirework({
    count,
    position,
    size,
    texture,
    radius,
    color,
  });
};

window.addEventListener("click", createRandomFireWork);

const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);
const sun = new Vector3();

const skyParams = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.95,
  elevation: -2.2,
  azimuth: 180,
  exposure: renderer.toneMappingExposure,
};

const updateSky = () => {
  const uniforms = sky.material.uniforms;
  uniforms["turbidity"].value = skyParams.turbidity;
  uniforms["rayleigh"].value = skyParams.rayleigh;
  uniforms["mieCoefficient"].value = skyParams.mieCoefficient;
  uniforms["mieDirectionalG"].value = skyParams.mieDirectionalG;

  const phi = MathUtils.degToRad(90 - skyParams.elevation);
  const theta = MathUtils.degToRad(skyParams.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  uniforms["sunPosition"].value.copy(sun);

  renderer.toneMappingExposure = skyParams.exposure;
  renderer.render(scene, camera);
};

gui.add(skyParams, "turbidity", 0.0, 20.0, 0.1).onChange(updateSky);
gui.add(skyParams, "rayleigh", 0.0, 4, 0.001).onChange(updateSky);
gui.add(skyParams, "mieCoefficient", 0.0, 0.1, 0.001).onChange(updateSky);
gui.add(skyParams, "mieDirectionalG", 0.0, 1, 0.001).onChange(updateSky);
gui.add(skyParams, "elevation", -3, 90, 0.01).onChange(updateSky);
gui.add(skyParams, "azimuth", -180, 180, 0.1).onChange(updateSky);
gui.add(skyParams, "exposure", 0, 1, 0.0001).onChange(updateSky);

updateSky();

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
