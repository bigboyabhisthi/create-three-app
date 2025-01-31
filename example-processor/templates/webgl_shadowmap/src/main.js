//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Clock,
  PerspectiveCamera,
  Scene,
  Color,
  Fog,
  AmbientLight,
  SpotLight,
  WebGLRenderer,
  sRGBEncoding,
  PCFShadowMap,
  PlaneGeometry,
  MeshPhongMaterial,
  Mesh,
  JS,
  BoxGeometry,
  AnimationMixer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { ShadowMapViewer } from "three/examples/jsm/utils/ShadowMapViewer.js";

const SHADOW_MAP_WIDTH = 2048,
  SHADOW_MAP_HEIGHT = 1024;

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
const FLOOR = -250;

let camera, controls, scene, renderer;
let container, stats;

const NEAR = 10,
  FAR = 3000;

let mixer;

const morphs = [];

let light;
let lightShadowMapViewer;

const clock = new Clock();

let showHUD = false;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // CAMERA

  camera = new PerspectiveCamera(23, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR);
  camera.position.set(700, 50, 1900);

  // SCENE

  scene = new Scene();
  scene.background = new Color(0x59472b);
  scene.fog = new Fog(0x59472b, 1000, FAR);

  // LIGHTS

  const ambient = new AmbientLight(0x444444);
  scene.add(ambient);

  light = new SpotLight(0xffffff, 1, 0, Math.PI / 5, 0.3);
  light.position.set(0, 1500, 1000);
  light.target.position.set(0, 0, 0);

  light.castShadow = true;
  light.shadow.camera.near = 1200;
  light.shadow.camera.far = 2500;
  light.shadow.bias = 0.0001;

  light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
  light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

  scene.add(light);

  createHUD();
  createScene();

  // RENDERER

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  container.appendChild(renderer.domElement);

  renderer.outputEncoding = sRGBEncoding;
  renderer.autoClear = false;

  //

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  // CONTROLS

  controls = new FirstPersonControls(camera, renderer.domElement);

  controls.lookSpeed = 0.0125;
  controls.movementSpeed = 500;
  controls.noFly = false;
  controls.lookVertical = true;

  controls.lookAt(scene.position);

  // STATS

  stats = new Stats();
  //container.appendChild( stats.dom );

  //

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", onKeyDown);
}

function onWindowResize() {
  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;

  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  camera.updateProjectionMatrix();

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  controls.handleResize();
}

function onKeyDown(event) {
  switch (event.keyCode) {
    case 84 /*t*/:
      showHUD = !showHUD;
      break;
  }
}

function createHUD() {
  lightShadowMapViewer = new ShadowMapViewer(light);
  lightShadowMapViewer.position.x = 10;
  lightShadowMapViewer.position.y = SCREEN_HEIGHT - SHADOW_MAP_HEIGHT / 4 - 10;
  lightShadowMapViewer.size.width = SHADOW_MAP_WIDTH / 4;
  lightShadowMapViewer.size.height = SHADOW_MAP_HEIGHT / 4;
  lightShadowMapViewer.update();
}

function createScene() {
  // GROUND

  const geometry = new PlaneGeometry(100, 100);
  const planeMaterial = new MeshPhongMaterial({ color: 0xffb851 });

  const ground = new Mesh(geometry, planeMaterial);

  ground.position.set(0, FLOOR, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(100, 100, 100);

  ground.castShadow = false;
  ground.receiveShadow = true;

  scene.add(ground);

  // TEXT

  const loader = new FontLoader();
  loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
    const textGeo = new TextGeometry("JS", {
      font: font,

      size: 200,
      height: 50,
      curveSegments: 12,

      bevelThickness: 2,
      bevelSize: 5,
      bevelEnabled: true,
    });

    textGeo.computeBoundingBox();
    const centerOffset =
      -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

    const textMaterial = new MeshPhongMaterial({
      color: 0xff0000,
      specular: 0xffffff,
    });

    const mesh = new Mesh(textGeo, textMaterial);
    mesh.position.x = centerOffset;
    mesh.position.y = FLOOR + 67;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);
  });

  // CUBES

  const cubes1 = new Mesh(new BoxGeometry(1500, 220, 150), planeMaterial);

  cubes1.position.y = FLOOR - 50;
  cubes1.position.z = 20;

  cubes1.castShadow = true;
  cubes1.receiveShadow = true;

  scene.add(cubes1);

  const cubes2 = new Mesh(new BoxGeometry(1600, 170, 250), planeMaterial);

  cubes2.position.y = FLOOR - 50;
  cubes2.position.z = 20;

  cubes2.castShadow = true;
  cubes2.receiveShadow = true;

  scene.add(cubes2);

  // MORPHS

  mixer = new AnimationMixer(scene);

  function addMorph(mesh, clip, speed, duration, x, y, z, fudgeColor) {
    mesh = mesh.clone();
    mesh.material = mesh.material.clone();

    if (fudgeColor) {
      mesh.material.color.offsetHSL(
        0,
        Math.random() * 0.5 - 0.25,
        Math.random() * 0.5 - 0.25
      );
    }

    mesh.speed = speed;

    mixer
      .clipAction(clip, mesh)
      .setDuration(duration)
      // to shift the playback out of phase:
      .startAt(-duration * Math.random())
      .play();

    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.PI / 2;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    morphs.push(mesh);
  }

  const gltfloader = new GLTFLoader();

  gltfloader.load("models/gltf/Horse.glb", function (gltf) {
    const mesh = gltf.scene.children[0];

    const clip = gltf.animations[0];

    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, 300, true);
    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, 450, true);
    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, 600, true);

    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, -300, true);
    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, -450, true);
    addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, FLOOR, -600, true);
  });

  gltfloader.load("models/gltf/Flamingo.glb", function (gltf) {
    const mesh = gltf.scene.children[0];
    const clip = gltf.animations[0];

    addMorph(mesh, clip, 500, 1, 500 - Math.random() * 500, FLOOR + 350, 40);
  });

  gltfloader.load("models/gltf/Stork.glb", function (gltf) {
    const mesh = gltf.scene.children[0];
    const clip = gltf.animations[0];

    addMorph(mesh, clip, 350, 1, 500 - Math.random() * 500, FLOOR + 350, 340);
  });

  gltfloader.load("models/gltf/Parrot.glb", function (gltf) {
    const mesh = gltf.scene.children[0];
    const clip = gltf.animations[0];

    addMorph(mesh, clip, 450, 0.5, 500 - Math.random() * 500, FLOOR + 300, 700);
  });
}

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  const delta = clock.getDelta();

  mixer.update(delta);

  for (let i = 0; i < morphs.length; i++) {
    const morph = morphs[i];

    morph.position.x += morph.speed * delta;

    if (morph.position.x > 2000) {
      morph.position.x = -1000 - Math.random() * 500;
    }
  }

  controls.update(delta);

  renderer.clear();
  renderer.render(scene, camera);

  // Render debug HUD with shadow map

  if (showHUD) {
    lightShadowMapViewer.render(renderer);
  }
}
