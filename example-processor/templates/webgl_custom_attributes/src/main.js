//Shaders

import vertexshader from "./shaders/vertexshader.glsl";
import fragmentshader from "./shaders/fragmentshader.glsl";

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  Color,
  TextureLoader,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  BufferAttribute,
  Mesh,
  WebGLRenderer,
  MathUtils,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

let renderer, scene, camera, stats;

let sphere, uniforms;

let displacement, noise;

init();
animate();

function init() {
  camera = new PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 300;

  scene = new Scene();
  scene.background = new Color(0x050505);

  uniforms = {
    amplitude: { value: 1.0 },
    color: { value: new Color(0xff2200) },
    colorTexture: { value: new TextureLoader().load("textures/water.jpg") },
  };

  uniforms["colorTexture"].value.wrapS = uniforms["colorTexture"].value.wrapT =
    RepeatWrapping;

  const shaderMaterial = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent,
  });

  const radius = 50,
    segments = 128,
    rings = 64;

  const geometry = new SphereGeometry(radius, segments, rings);

  displacement = new Float32Array(geometry.attributes.position.count);
  noise = new Float32Array(geometry.attributes.position.count);

  for (let i = 0; i < displacement.length; i++) {
    noise[i] = Math.random() * 5;
  }

  geometry.setAttribute("displacement", new BufferAttribute(displacement, 1));

  sphere = new Mesh(geometry, shaderMaterial);
  scene.add(sphere);

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);

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
  const time = Date.now() * 0.01;

  sphere.rotation.y = sphere.rotation.z = 0.01 * time;

  uniforms["amplitude"].value = 2.5 * Math.sin(sphere.rotation.y * 0.125);
  uniforms["color"].value.offsetHSL(0.0005, 0, 0);

  for (let i = 0; i < displacement.length; i++) {
    displacement[i] = Math.sin(0.1 * i + time);

    noise[i] += 0.5 * (0.5 - Math.random());
    noise[i] = MathUtils.clamp(noise[i], -5, 5);

    displacement[i] += noise[i];
  }

  sphere.geometry.attributes.displacement.needsUpdate = true;

  renderer.render(scene, camera);
}
