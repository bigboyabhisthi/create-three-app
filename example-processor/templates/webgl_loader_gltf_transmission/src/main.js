//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Clock,
  PerspectiveCamera,
  Scene,
  EquirectangularReflectionMapping,
  AnimationMixer,
  WebGLRenderer,
  ACESFilmicToneMapping,
  sRGBEncoding,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let camera, scene, renderer, controls, clock, mixer;

init();
animate();

function init() {
  clock = new Clock();

  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(0, 0.4, 0.7);

  scene = new Scene();

  new RGBELoader()
    .setPath("textures/equirectangular/")
    .load("royal_esplanade_1k.hdr", function (texture) {
      texture.mapping = EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;

      // model

      new GLTFLoader()
        .setPath("models/gltf/")
        .setDRACOLoader(new DRACOLoader().setDecoderPath("js/libs/draco/gltf/"))
        .load("IridescentDishWithOlives.glb", function (gltf) {
          mixer = new AnimationMixer(gltf.scene);
          mixer.clipAction(gltf.animations[0]).play();
          scene.add(gltf.scene);
        });
    });

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = sRGBEncoding;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.5;
  controls.maxDistance = 1;
  controls.target.set(0, 0.1, 0);
  controls.update();

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

  if (mixer) mixer.update(clock.getDelta());

  controls.update(); // required if damping enabled

  render();
}

function render() {
  renderer.render(scene, camera);
}
