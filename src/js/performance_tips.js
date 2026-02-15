import GUI from "lil-gui";
import { Spector } from "spectorjs";
import {
  AxesHelper,
  PerspectiveCamera,
  Scene,
  Timer,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

const spector = new Spector();
spector.displayUI();
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

const screenSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let aspectRatio = screenSize.width / screenSize.height;
const canvas = document.getElementById("renderer");

const gui = new GUI();
const scene = new Scene();

const camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
camera.position.z = 5;
scene.add(camera);

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const renderer = new WebGLRenderer({ canvas });
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

debugFoler
  .add(
    {
      _: () => {
        const menu = document.querySelector(".captureMenuComponent");
        const log = document.querySelector(".captureMenuLogComponent");

        if (menu.classList.contains("active")) {
          menu.classList.remove("active");
          log.classList.remove("active");
        } else {
          menu.classList.add("active");
          log.classList.add("active");
        }
      },
    },
    "_",
  )
  .name("Toggle Capture Menu");

const timer = new Timer();

const animate = () => {
  timer.update();
  stats.begin();
  const elapsedTime = timer.getElapsed();

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
  stats.end();
};

animate();
