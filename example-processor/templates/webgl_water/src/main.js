//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Scene,
  PerspectiveCamera,
  Clock,
  TorusKnotGeometry,
  MeshNormalMaterial,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  TextureLoader,
  RepeatWrapping,
  Vector2,
  CubeTextureLoader,
  AmbientLight,
  DirectionalLight,
  WebGLRenderer,
} from "three";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water2.js";

let scene, camera, clock, renderer, water;

let torusKnot;

const params = {
  color: "#ffffff",
  scale: 4,
  flowX: 1,
  flowY: 1,
};

init();
animate();

function init() {
  // scene

  scene = new Scene();

  // camera

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(-15, 7, 15);
  camera.lookAt(scene.position);

  // clock

  clock = new Clock();

  // mesh

  const torusKnotGeometry = new TorusKnotGeometry(3, 1, 256, 32);
  const torusKnotMaterial = new MeshNormalMaterial();

  torusKnot = new Mesh(torusKnotGeometry, torusKnotMaterial);
  torusKnot.position.y = 4;
  torusKnot.scale.set(0.5, 0.5, 0.5);
  scene.add(torusKnot);

  // ground

  const groundGeometry = new PlaneGeometry(20, 20);
  const groundMaterial = new MeshStandardMaterial({
    roughness: 0.8,
    metalness: 0.4,
  });
  const ground = new Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = Math.PI * -0.5;
  scene.add(ground);

  const textureLoader = new TextureLoader();
  textureLoader.load("textures/hardwood2_diffuse.jpg", function (map) {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.anisotropy = 16;
    map.repeat.set(4, 4);
    groundMaterial.map = map;
    groundMaterial.needsUpdate = true;
  });

  // water

  const waterGeometry = new PlaneGeometry(20, 20);

  water = new Water(waterGeometry, {
    color: params.color,
    scale: params.scale,
    flowDirection: new Vector2(params.flowX, params.flowY),
    textureWidth: 1024,
    textureHeight: 1024,
  });

  water.position.y = 1;
  water.rotation.x = Math.PI * -0.5;
  scene.add(water);

  // skybox

  const cubeTextureLoader = new CubeTextureLoader();
  cubeTextureLoader.setPath("textures/cube/Park2/");

  const cubeTexture = cubeTextureLoader.load([
    "posx.jpg",
    "negx.jpg",
    "posy.jpg",
    "negy.jpg",
    "posz.jpg",
    "negz.jpg",
  ]);

  scene.background = cubeTexture;

  // light

  const ambientLight = new AmbientLight(0xcccccc, 0.4);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(-1, 1, 1);
  scene.add(directionalLight);

  // renderer

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // dat.gui

  const gui = new GUI();

  gui.addColor(params, "color").onChange(function (value) {
    water.material.uniforms["color"].value.set(value);
  });
  gui.add(params, "scale", 1, 10).onChange(function (value) {
    water.material.uniforms["config"].value.w = value;
  });
  gui
    .add(params, "flowX", -1, 1)
    .step(0.01)
    .onChange(function (value) {
      water.material.uniforms["flowDirection"].value.x = value;
      water.material.uniforms["flowDirection"].value.normalize();
    });
  gui
    .add(params, "flowY", -1, 1)
    .step(0.01)
    .onChange(function (value) {
      water.material.uniforms["flowDirection"].value.y = value;
      water.material.uniforms["flowDirection"].value.normalize();
    });

  gui.open();

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 50;

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  const delta = clock.getDelta();

  torusKnot.rotation.x += delta;
  torusKnot.rotation.y += delta * 0.5;

  renderer.render(scene, camera);
}
