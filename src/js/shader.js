import {
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Timer,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import testVertexShader from "./shaders/test/vertex.vert";
import testFragmentShader from "./shaders/test/fragment.frag";
import GUI from "lil-gui";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const textureLoader = new TextureLoader();
const flagTexture = textureLoader.load("/textures/flags/bunnyPirate.png");

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 3;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const geometry = new PlaneGeometry(1, 1, 32, 32);
const material = new ShaderMaterial({
  vertexShader: testVertexShader,
  fragmentShader: testFragmentShader,
  side: DoubleSide,
  transparent: true,
  uniforms: {
    uFrequency: {
      value: new Vector2(10, 5),
    },
    uTime: {
      value: 0,
    },
    uColor: {
      value: new Color("orange"),
    },
    uTexture: {
      value: flagTexture,
    },
  },
});

gui.add(material.uniforms.uFrequency.value, "x").name("Wave Frequency X");
gui.add(material.uniforms.uFrequency.value, "y").name("Wave Frequency Y");
const plane = new Mesh(geometry, material);
plane.scale.y = 2 / 3;
scene.add(plane);

const count = geometry.attributes.position.count;
const random = new Float32Array(count);
for (let i = 0; i < count; i++) {
  random[i] = Math.random();
}
geometry.setAttribute("aRandom", new BufferAttribute(random, 1));

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
