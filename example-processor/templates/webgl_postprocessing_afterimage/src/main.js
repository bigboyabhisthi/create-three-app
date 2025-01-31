//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Fog,
  BoxGeometry,
  MeshNormalMaterial,
  Mesh,
} from "three";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";

let camera, scene, renderer, composer;
let mesh;

let afterimagePass;

const params = {
  enable: true,
};

init();
createGUI();
animate();

function init() {
  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.z = 400;

  scene = new Scene();
  scene.fog = new Fog(0x000000, 1, 1000);

  const geometry = new BoxGeometry(150, 150, 150, 2, 2, 2);
  const material = new MeshNormalMaterial();
  mesh = new Mesh(geometry, material);
  scene.add(mesh);

  // postprocessing

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  afterimagePass = new AfterimagePass();
  composer.addPass(afterimagePass);

  window.addEventListener("resize", onWindowResize);

  if (typeof TESTING !== "undefined") {
    for (let i = 0; i < 45; i++) {
      render();
    }
  }
}

function createGUI() {
  const gui = new GUI({ name: "Damp setting" });
  gui.add(afterimagePass.uniforms["damp"], "value", 0, 1).step(0.001);
  gui.add(params, "enable");
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  mesh.rotation.x += 0.005;
  mesh.rotation.y += 0.01;

  if (params.enable) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
}
