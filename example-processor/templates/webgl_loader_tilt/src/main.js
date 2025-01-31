//Shaders

undefined;

import "./style.css"; // For webpack support

import { Scene, PerspectiveCamera, GridHelper, WebGL1Renderer } from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TiltLoader } from "three/examples/jsm/loaders/TiltLoader.js";

let camera, scene, renderer;

init();

function init() {
  scene = new Scene();

  camera = new PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    1,
    500
  );

  camera.position.y = 43;
  camera.position.z = 100;

  scene.add(camera);

  const grid = new GridHelper(50, 50, 0xffffff, 0x555555);
  scene.add(grid);

  renderer = new WebGL1Renderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const loader = new TiltLoader();
  loader.load("three/examples/models/tilt/BRUSH_DOME.tilt", function (object) {
    // console.log( object.children.length );
    scene.add(object);
    render();
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);
  controls.target.y = camera.position.y;
  controls.update();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}
