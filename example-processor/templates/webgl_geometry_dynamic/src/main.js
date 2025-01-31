//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Clock,
  Scene,
  Color,
  FogExp2,
  PlaneGeometry,
  DynamicDrawUsage,
  TextureLoader,
  RepeatWrapping,
  MeshBasicMaterial,
  Mesh,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";

let camera, controls, scene, renderer, stats;

let mesh, geometry, material, clock;

const worldWidth = 128,
  worldDepth = 128;

init();
animate();

function init() {
  camera = new PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.y = 200;

  clock = new Clock();

  scene = new Scene();
  scene.background = new Color(0xaaccff);
  scene.fog = new FogExp2(0xaaccff, 0.0007);

  geometry = new PlaneGeometry(20000, 20000, worldWidth - 1, worldDepth - 1);
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  position.usage = DynamicDrawUsage;

  for (let i = 0; i < position.count; i++) {
    const y = 35 * Math.sin(i / 2);
    position.setY(i, y);
  }

  const texture = new TextureLoader().load("textures/water.jpg");
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 5);

  material = new MeshBasicMaterial({ color: 0x0044ff, map: texture });

  mesh = new Mesh(geometry, material);
  scene.add(mesh);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new FirstPersonControls(camera, renderer.domElement);

  controls.movementSpeed = 500;
  controls.lookSpeed = 0.1;

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  const delta = clock.getDelta();
  const time = clock.getElapsedTime() * 10;

  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const y = 35 * Math.sin(i / 5 + (time + i) / 7);
    position.setY(i, y);
  }

  position.needsUpdate = true;

  controls.update(delta);
  renderer.render(scene, camera);
}
