//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Clock,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Mesh,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";

import {
  NodeFrame,
  FloatNode,
  ColorNode,
  ConstNode,
  ExpressionNode,
  MathNode,
  OperatorNode,
  TimerNode,
  PhongNodeMaterial,
} from "three/examples/jsm/nodes/Nodes.js";

const container = document.getElementById("container");

let renderer, scene, camera;
const clock = new Clock(),
  fov = 50;
const frame = new NodeFrame();
let teapot;
let controls;
const meshes = [];

document.getElementById("preload").addEventListener("click", function () {
  const hash = document.location.hash.substr(1);

  if (hash.length === 0) {
    window.location.hash = "#NoPreLoad";
  } else {
    window.location.hash = "";
  }

  location.reload(true);
});

window.addEventListener("load", init);

function init() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  scene = new Scene();

  camera = new PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.x = 0;
  camera.position.z = -300;
  camera.position.y = 200;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 400;

  scene.add(new AmbientLight(0x464646));

  const light1 = new DirectionalLight(0xffddcc, 1);
  light1.position.set(1, 0.75, 0.5);
  scene.add(light1);

  const light2 = new DirectionalLight(0xccccff, 1);
  light2.position.set(-1, 0.75, -0.5);
  scene.add(light2);

  teapot = new TeapotGeometry(15, 18);

  const itemsonrow = 10;

  for (let i = 0; i < itemsonrow * itemsonrow; i++) {
    const mesh = new Mesh(teapot);

    mesh.position.x = 50 * (i % itemsonrow) - (50 * itemsonrow) / 2;
    mesh.position.z = 50 * Math.floor(i / itemsonrow) - 150;
    updateMaterial(mesh);
    scene.add(mesh);
    meshes.push(mesh);
  }

  window.addEventListener("resize", onWindowResize);

  const hash = document.location.hash.substr(1);

  if (hash.length === 0) {
    renderer.compile(scene, camera);
  }

  document.getElementById("waitScreen").className = "hide";

  setTimeout(function () {
    onWindowResize();
    animate();
  }, 1);
}

function updateMaterial(mesh) {
  if (mesh.material) mesh.material.dispose();

  const mtl = new PhongNodeMaterial();

  const time = new TimerNode();
  const speed = new FloatNode(Math.random());

  const color = new ColorNode(Math.random() * 0xffffff);

  const timeSpeed = new OperatorNode(time, speed, OperatorNode.MUL);

  const sinCycleInSecs = new OperatorNode(
    timeSpeed,
    new ConstNode(ConstNode.PI2),
    OperatorNode.MUL
  );

  const cycle = new MathNode(sinCycleInSecs, MathNode.SIN);

  const cycleColor = new OperatorNode(cycle, color, OperatorNode.MUL);

  const cos = new MathNode(cycleColor, MathNode.SIN);

  mtl.color = new ColorNode(0);
  mtl.emissive = cos;

  const transformer = new ExpressionNode(
    "position + 0.0 * " + Math.random(),
    "vec3",
    []
  );
  mtl.transform = transformer;

  // build shader ( ignore auto build )
  mtl.build();

  // set material
  mesh.material = mtl;
}

function onWindowResize() {
  const width = window.innerWidth,
    height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  const delta = clock.getDelta();

  frame.update(delta);

  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];

    frame.updateNode(mesh.material);
  }

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}
