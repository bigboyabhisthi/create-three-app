//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Fog,
  Object3D,
  SphereGeometry,
  MeshPhongMaterial,
  Mesh,
  AmbientLight,
  DirectionalLight,
} from "three";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader.js";

let camera, renderer, composer;
let object;

init();
animate();

function init() {
  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.z = 400;

  const scene = new Scene();
  scene.fog = new Fog(0x000000, 1, 1000);

  object = new Object3D();
  scene.add(object);

  const geometry = new SphereGeometry(1, 4, 4);
  const material = new MeshPhongMaterial({
    color: 0xffffff,
    flatShading: true,
  });

  for (let i = 0; i < 100; i++) {
    const mesh = new Mesh(geometry, material);
    mesh.position
      .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      .normalize();
    mesh.position.multiplyScalar(Math.random() * 400);
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 50;
    object.add(mesh);
  }

  scene.add(new AmbientLight(0x222222));

  const light = new DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  scene.add(light);

  // postprocessing

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const effect1 = new ShaderPass(DotScreenShader);
  effect1.uniforms["scale"].value = 4;
  composer.addPass(effect1);

  const effect2 = new ShaderPass(RGBShiftShader);
  effect2.uniforms["amount"].value = 0.0015;
  composer.addPass(effect2);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  object.rotation.x += 0.005;
  object.rotation.y += 0.01;

  composer.render();
}
