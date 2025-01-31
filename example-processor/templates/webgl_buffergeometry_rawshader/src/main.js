//Shaders

import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  Color,
  BufferGeometry,
  Float32BufferAttribute,
  Uint8BufferAttribute,
  RawShaderMaterial,
  DoubleSide,
  Mesh,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

let container, stats;

let camera, scene, renderer;

init();
animate();

function init() {
  container = document.getElementById("container");

  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    10
  );
  camera.position.z = 2;

  scene = new Scene();
  scene.background = new Color(0x101010);

  // geometry
  // nr of triangles with 3 vertices per triangle
  const vertexCount = 200 * 3;

  const geometry = new BufferGeometry();

  const positions = [];
  const colors = [];

  for (let i = 0; i < vertexCount; i++) {
    // adding x,y,z
    positions.push(Math.random() - 0.5);
    positions.push(Math.random() - 0.5);
    positions.push(Math.random() - 0.5);

    // adding r,g,b,a
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
  }

  const positionAttribute = new Float32BufferAttribute(positions, 3);
  const colorAttribute = new Uint8BufferAttribute(colors, 4);

  colorAttribute.normalized = true; // this will map the buffer values to 0.0f - +1.0f in the shader

  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", colorAttribute);

  // material

  const material = new RawShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
    side: DoubleSide,
    transparent: true,
  });

  const mesh = new Mesh(geometry, material);
  scene.add(mesh);

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  const time = performance.now();

  const object = scene.children[0];

  object.rotation.y = time * 0.0005;
  object.material.uniforms.time.value = time * 0.005;

  renderer.render(scene, camera);
}
