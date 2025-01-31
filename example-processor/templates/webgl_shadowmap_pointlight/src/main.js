//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  AmbientLight,
  PointLight,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  CanvasTexture,
  NearestFilter,
  RepeatWrapping,
  MeshPhongMaterial,
  DoubleSide,
  MeshDistanceMaterial,
  BoxGeometry,
  BackSide,
  WebGLRenderer,
  BasicShadowMap,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer, stats;
let pointLight, pointLight2;

init();
animate();

function init() {
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 10, 40);

  scene = new Scene();
  scene.add(new AmbientLight(0x111122));

  // lights

  function createLight(color) {
    const intensity = 1.5;

    const light = new PointLight(color, intensity, 20);
    light.castShadow = true;
    light.shadow.bias = -0.005; // reduces self-shadowing on double-sided objects

    let geometry = new SphereGeometry(0.3, 12, 6);
    let material = new MeshBasicMaterial({ color: color });
    material.color.multiplyScalar(intensity);
    let sphere = new Mesh(geometry, material);
    light.add(sphere);

    const texture = new CanvasTexture(generateTexture());
    texture.magFilter = NearestFilter;
    texture.wrapT = RepeatWrapping;
    texture.wrapS = RepeatWrapping;
    texture.repeat.set(1, 4.5);

    geometry = new SphereGeometry(2, 32, 8);
    material = new MeshPhongMaterial({
      side: DoubleSide,
      alphaMap: texture,
      alphaTest: 0.5,
    });

    sphere = new Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    light.add(sphere);

    // custom distance material
    const distanceMaterial = new MeshDistanceMaterial({
      alphaMap: material.alphaMap,
      alphaTest: material.alphaTest,
    });
    sphere.customDistanceMaterial = distanceMaterial;

    return light;
  }

  pointLight = createLight(0x0088ff);
  scene.add(pointLight);

  pointLight2 = createLight(0xff8888);
  scene.add(pointLight2);
  //

  const geometry = new BoxGeometry(30, 30, 30);

  const material = new MeshPhongMaterial({
    color: 0xa0adaf,
    shininess: 10,
    specular: 0x111111,
    side: BackSide,
  });

  const mesh = new Mesh(geometry, material);
  mesh.position.y = 10;
  mesh.receiveShadow = true;
  scene.add(mesh);

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = BasicShadowMap;
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 10, 0);
  controls.update();

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;

  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 1, 2, 1);

  return canvas;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  let time = performance.now() * 0.001;

  pointLight.position.x = Math.sin(time * 0.6) * 9;
  pointLight.position.y = Math.sin(time * 0.7) * 9 + 6;
  pointLight.position.z = Math.sin(time * 0.8) * 9;

  pointLight.rotation.x = time;
  pointLight.rotation.z = time;

  time += 10000;

  pointLight2.position.x = Math.sin(time * 0.6) * 9;
  pointLight2.position.y = Math.sin(time * 0.7) * 9 + 6;
  pointLight2.position.z = Math.sin(time * 0.8) * 9;

  pointLight2.rotation.x = time;
  pointLight2.rotation.z = time;

  renderer.render(scene, camera);

  stats.update();
}
