import GUI from "lil-gui";
import {
  BackSide,
  Color,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Spherical,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  Uniform,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import atmosphereFragmentShader from "./shaders/earth/atmosphere.frag";
import atmosphereVertexShader from "./shaders/earth/atmosphere.vert";
import fragmentShader from "./shaders/earth/fragment.frag";
import vertexShader from "./shaders/earth/vertex.vert";

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const textureLoader = new TextureLoader();

const earthDayTexture = textureLoader.load("/textures/earth/day.jpg");
earthDayTexture.colorSpace = SRGBColorSpace;
earthDayTexture.anisotropy = 8;
const earthNightTexture = textureLoader.load("/textures/earth/night.jpg");
earthNightTexture.colorSpace = SRGBColorSpace;
earthNightTexture.anisotropy = 8;
const earthSpecularCloudTexture = textureLoader.load(
  "/textures/earth/specularClouds.jpg"
);
earthSpecularCloudTexture.colorSpace = SRGBColorSpace;
earthSpecularCloudTexture.anisotropy = 8;

const scene = new Scene();

const earthParams = {
  atmosphereDayColor: "#00aaff",
  atmosphereTwilightColor: "#ff6600",
};

const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uDayTexture: new Uniform(earthDayTexture),
    uNightTexture: new Uniform(earthNightTexture),
    uSpecularCloudsTexture: new Uniform(earthSpecularCloudTexture),
    uSunDirection: new Uniform(new Vector3(0, 0, 1)),
    uAtmosphereDayColor: new Uniform(new Color(earthParams.atmosphereDayColor)),
    uAtmosphereTwilightColor: new Uniform(
      new Color(earthParams.atmosphereTwilightColor)
    ),
  },
});
const geometry = new SphereGeometry(3, 128, 128);
const earth = new Mesh(geometry, material);
scene.add(earth);

const atmosphereMaterial = new ShaderMaterial({
  side: BackSide,
  transparent: true,
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new Uniform(new Vector3(0, 0, 1)),
    uAtmosphereDayColor: new Uniform(new Color(earthParams.atmosphereDayColor)),
    uAtmosphereTwilightColor: new Uniform(
      new Color(earthParams.atmosphereTwilightColor)
    ),
  },
});
const atmosphere = new Mesh(geometry, atmosphereMaterial);
atmosphere.scale.set(1.04, 1.04, 1.04);
scene.add(atmosphere);

const sunSpherical = new Spherical(1, Math.PI * 0.5, 0.5);
const sunDirection = new Vector3();

const debugSun = new Mesh(
  new IcosahedronGeometry(0.1, 2),
  new MeshBasicMaterial()
);

scene.add(debugSun);

const updateSun = () => {
  sunDirection.setFromSpherical(sunSpherical);
  debugSun.position.copy(sunDirection).multiplyScalar(5);

  material.uniforms.uSunDirection.value.copy(sunDirection);
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
};
updateSun();

gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);
gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun);
gui.addColor(earthParams, "atmosphereDayColor").onChange(() => {
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParams.atmosphereDayColor
  );
  material.uniforms.uAtmosphereDayColor.value.set(
    earthParams.atmosphereDayColor
  );
});
gui.addColor(earthParams, "atmosphereTwilightColor").onChange(() => {
  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParams.atmosphereTwilightColor
  );
  material.uniforms.uAtmosphereTwilightColor.value.set(
    earthParams.atmosphereTwilightColor
  );
});

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.x = 12;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#010111");

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

  earth.rotation.y = elapsedTime * 0.25;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
