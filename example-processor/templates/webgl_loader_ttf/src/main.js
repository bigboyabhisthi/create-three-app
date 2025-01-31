//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Vector3,
  Scene,
  Color,
  Fog,
  DirectionalLight,
  PointLight,
  MeshPhongMaterial,
  Group,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  WebGLRenderer,
} from "three";

import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let container;
let camera, cameraTarget, scene, renderer;
let group, textMesh1, textMesh2, textGeo, material;
let firstLetter = true;

let text = "three.js";
const height = 20,
  size = 70,
  hover = 30,
  curveSegments = 4,
  bevelThickness = 2,
  bevelSize = 1.5;

let font = null;
const mirror = true;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // CAMERA

  camera = new PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    1500
  );
  camera.position.set(0, 400, 700);

  cameraTarget = new Vector3(0, 150, 0);

  // SCENE

  scene = new Scene();
  scene.background = new Color(0x000000);
  scene.fog = new Fog(0x000000, 250, 1400);

  // LIGHTS

  const dirLight = new DirectionalLight(0xffffff, 0.125);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  const pointLight = new PointLight(0xffffff, 1.5);
  pointLight.position.set(0, 100, 90);
  pointLight.color.setHSL(Math.random(), 1, 0.5);
  scene.add(pointLight);

  material = new MeshPhongMaterial({ color: 0xffffff, flatShading: true });

  group = new Group();
  group.position.y = 100;

  scene.add(group);

  const loader = new TTFLoader();

  loader.load("fonts/ttf/kenpixel.ttf", function (json) {
    font = new Font(json);
    createText();
  });

  const plane = new Mesh(
    new PlaneGeometry(10000, 10000),
    new MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
  );
  plane.position.y = 100;
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // RENDERER

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // EVENTS

  container.style.touchAction = "none";
  container.addEventListener("pointerdown", onPointerDown);

  document.addEventListener("keypress", onDocumentKeyPress);
  document.addEventListener("keydown", onDocumentKeyDown);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentKeyDown(event) {
  if (firstLetter) {
    firstLetter = false;
    text = "";
  }

  const keyCode = event.keyCode;

  // backspace

  if (keyCode === 8) {
    event.preventDefault();

    text = text.substring(0, text.length - 1);
    refreshText();

    return false;
  }
}

function onDocumentKeyPress(event) {
  const keyCode = event.which;

  // backspace

  if (keyCode === 8) {
    event.preventDefault();
  } else {
    const ch = String.fromCharCode(keyCode);
    text += ch;

    refreshText();
  }
}

function createText() {
  textGeo = new TextGeometry(text, {
    font: font,

    size: size,
    height: height,
    curveSegments: curveSegments,

    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelEnabled: true,
  });

  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();

  const centerOffset =
    -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

  textMesh1 = new Mesh(textGeo, material);

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = hover;
  textMesh1.position.z = 0;

  textMesh1.rotation.x = 0;
  textMesh1.rotation.y = Math.PI * 2;

  group.add(textMesh1);

  if (mirror) {
    textMesh2 = new Mesh(textGeo, material);

    textMesh2.position.x = centerOffset;
    textMesh2.position.y = -hover;
    textMesh2.position.z = height;

    textMesh2.rotation.x = Math.PI;
    textMesh2.rotation.y = Math.PI * 2;

    group.add(textMesh2);
  }
}

function refreshText() {
  group.remove(textMesh1);
  if (mirror) group.remove(textMesh2);

  if (!text) return;

  createText();
}

function onPointerDown(event) {
  if (event.isPrimary === false) return;

  pointerXOnPointerDown = event.clientX - windowHalfX;
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  pointerX = event.clientX - windowHalfX;

  targetRotation =
    targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;
}

function onPointerUp() {
  if (event.isPrimary === false) return;

  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
}

//

function animate() {
  requestAnimationFrame(animate);

  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;

  camera.lookAt(cameraTarget);

  renderer.render(scene, camera);
}
