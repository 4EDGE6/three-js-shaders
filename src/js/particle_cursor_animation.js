import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Timer,
  Uniform,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import fragmentShader from "./shaders/particle_cursor_animation/fragment.frag";
import vertexShader from "./shaders/particle_cursor_animation/vertex.vert";

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

const textureLoader = new TextureLoader();

const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 18;
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const displacement = {};
displacement.canvas = document.createElement("canvas");
displacement.canvas.width = 128;
displacement.canvas.height = 128;
displacement.canvas.style.position = "fixed";
displacement.canvas.style.width = "256px";
displacement.canvas.style.height = "256px";
displacement.canvas.style.top = 0;
displacement.canvas.style.left = 0;
displacement.canvas.style.zIndex = 10;
document.body.append(displacement.canvas);

displacement.context = displacement.canvas.getContext("2d");
// displacement.context.fillStyle = 'red';
displacement.context.fillRect(
  0,
  0,
  displacement.canvas.width,
  displacement.canvas.height
);

displacement.glowImage = new Image();
displacement.glowImage.src = "/textures/static/glow.png";

displacement.interactivePlane = new Mesh(
  new PlaneGeometry(10, 10),
  new MeshBasicMaterial({ color: "red", side: DoubleSide })
);
displacement.interactivePlane.visible = false;
scene.add(displacement.interactivePlane);

displacement.rayCaster = new Raycaster();

displacement.screenCursor = new Vector2(999, 999);
displacement.canvasCursor = new Vector2(999, 999);
displacement.canvasCursorPrev = new Vector2(999, 999);

displacement.texture = new CanvasTexture(displacement.canvas);

window.addEventListener("pointermove", (e) => {
  displacement.screenCursor.x = (e.clientX / screenSize.width) * 2 - 1;
  displacement.screenCursor.y = -(e.clientY / screenSize.height) * 2 + 1;
});

const particlesGeometry = new PlaneGeometry(10, 10, 128, 128);
particlesGeometry.setIndex(null);
particlesGeometry.deleteAttribute("normal");

const particlesMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uResolution: new Uniform(screenSize.resolution),
    uPictureTexture: new Uniform(
      textureLoader.load("/textures/images/image.png")
    ),
    uCanvasTexture: new Uniform(displacement.texture),
  },
});

const particleCount = particlesGeometry.attributes.position.count;

const intensities = new Float32Array(particleCount);
const angles = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  intensities[i] = Math.random();
  angles[i] = Math.PI * 2 * Math.random();
}

particlesGeometry.setAttribute(
  "aIntensity",
  new BufferAttribute(intensities, 1)
);
particlesGeometry.setAttribute("aAngle", new BufferAttribute(angles, 1));

const particles = new Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const renderer = new WebGLRenderer({ canvas });
renderer.setSize(screenSize.width, screenSize.height);
renderer.setPixelRatio(screenSize.devicePixelRatio);
renderer.setClearColor("#161616");

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

const timer = new Timer();

const animate = () => {
  timer.update();
  const elapsedTime = timer.getElapsed();

  displacement.rayCaster.setFromCamera(displacement.screenCursor, camera);
  const intersections = displacement.rayCaster.intersectObject(
    displacement.interactivePlane
  );

  if (intersections.length) {
    const uv = intersections[0].uv;

    displacement.canvasCursor.x = uv.x * displacement.canvas.width;
    // displacement.canvasCursor.y =
    //   displacement.canvas.height - uv.y * displacement.canvas.height;
    displacement.canvasCursor.y = (1 - uv.y) * displacement.canvas.height;
  }

  displacement.context.globalCompositeOperation = "source-over";
  displacement.context.globalAlpha = 0.02;
  displacement.context.fillRect(
    0,
    0,
    displacement.canvas.width,
    displacement.canvas.height
  );

  const cursorDistance = displacement.canvasCursorPrev.distanceTo(
    displacement.canvasCursor
  );
  displacement.canvasCursorPrev.copy(displacement.canvasCursor);
  const alpha = Math.min(cursorDistance * 0.1, 1);

  const glowSize = displacement.canvas.width * 0.25;
  displacement.context.globalCompositeOperation = "lighten";
  displacement.context.globalAlpha = alpha;
  displacement.context.drawImage(
    displacement.glowImage,
    displacement.canvasCursor.x - glowSize * 0.5,
    displacement.canvasCursor.y - glowSize * 0.5,
    glowSize,
    glowSize
  );

  displacement.texture.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
