//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  HemisphereLight,
  DirectionalLight,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRMLLoader } from "three/examples/jsm/loaders/VRMLLoader.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

let camera, scene, renderer, stats, controls, loader;

const params = {
  asset: "house",
};

const assets = [
  "creaseAngle",
  "crystal",
  "house",
  "elevationGrid1",
  "elevationGrid2",
  "extrusion1",
  "extrusion2",
  "extrusion3",
  "lines",
  "meshWithLines",
  "meshWithTexture",
  "pixelTexture",
  "points",
];

let vrmlScene;

init();
animate();

function init() {
  camera = new PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1e10
  );
  camera.position.set(-10, 5, 10);

  scene = new Scene();
  scene.add(camera);

  // light

  const hemiLight = new HemisphereLight(0xffffff, 0x000000, 1);
  scene.add(hemiLight);

  const dirLight = new DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(200, 200, 200);
  scene.add(dirLight);

  loader = new VRMLLoader();
  loadAsset(params.asset);

  // renderer

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // controls

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 200;
  controls.enableDamping = true;

  //

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);

  //

  const gui = new GUI({ width: 300 });
  gui.add(params, "asset", assets).onChange(function (value) {
    if (vrmlScene) {
      vrmlScene.traverse(function (object) {
        if (object.material) object.material.dispose();
        if (object.material && object.material.map)
          object.material.map.dispose();
        if (object.geometry) object.geometry.dispose();
      });

      scene.remove(vrmlScene);
    }

    loadAsset(value);
  });
}

function loadAsset(asset) {
  loader.load("models/vrml/" + asset + ".wrl", function (object) {
    vrmlScene = object;
    scene.add(object);
    controls.reset();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  controls.update(); // to support damping

  renderer.render(scene, camera);

  stats.update();
}
