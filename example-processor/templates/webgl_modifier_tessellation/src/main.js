//Shaders

import vertexshader from "./shaders/vertexshader.glsl";
import fragmentshader from "./shaders/fragmentshader.glsl";

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  Color,
  JS,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

let renderer, scene, camera, stats;

let controls;

let mesh, uniforms;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const loader = new FontLoader();
loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
  init(font);
  animate();
});

function init(font) {
  camera = new PerspectiveCamera(40, WIDTH / HEIGHT, 1, 10000);
  camera.position.set(-100, 100, 200);

  scene = new Scene();
  scene.background = new Color(0x050505);

  //

  let geometry = new TextGeometry("JS", {
    font: font,

    size: 40,
    height: 5,
    curveSegments: 3,

    bevelThickness: 2,
    bevelSize: 1,
    bevelEnabled: true,
  });

  geometry.center();

  const tessellateModifier = new TessellateModifier(8, 6);

  geometry = tessellateModifier.modify(geometry);

  //

  const numFaces = geometry.attributes.position.count / 3;

  const colors = new Float32Array(numFaces * 3 * 3);
  const displacement = new Float32Array(numFaces * 3 * 3);

  const color = new Color();

  for (let f = 0; f < numFaces; f++) {
    const index = 9 * f;

    const h = 0.2 * Math.random();
    const s = 0.5 + 0.5 * Math.random();
    const l = 0.5 + 0.5 * Math.random();

    color.setHSL(h, s, l);

    const d = 10 * (0.5 - Math.random());

    for (let i = 0; i < 3; i++) {
      colors[index + 3 * i] = color.r;
      colors[index + 3 * i + 1] = color.g;
      colors[index + 3 * i + 2] = color.b;

      displacement[index + 3 * i] = d;
      displacement[index + 3 * i + 1] = d;
      displacement[index + 3 * i + 2] = d;
    }
  }

  geometry.setAttribute("customColor", new BufferAttribute(colors, 3));
  geometry.setAttribute("displacement", new BufferAttribute(displacement, 3));

  //

  uniforms = {
    amplitude: { value: 0.0 },
  };

  const shaderMaterial = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
  });

  //

  mesh = new Mesh(geometry, shaderMaterial);

  scene.add(mesh);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(WIDTH, HEIGHT);

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

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

  stats.update();
}

function render() {
  const time = Date.now() * 0.001;

  uniforms.amplitude.value = 1.0 + Math.sin(time * 0.5);

  controls.update();

  renderer.render(scene, camera);
}
