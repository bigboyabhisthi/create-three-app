//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Clock,
  PerspectiveCamera,
  Scene,
  Color,
  PolarGridHelper,
  AudioListener,
  AmbientLight,
  DirectionalLight,
  WebGLRenderer,
  AudioLoader,
  Audio,
} from "three";

import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect.js";
import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { MMDAnimationHelper } from "three/examples/jsm/animation/MMDAnimationHelper.js";

let mesh, camera, scene, renderer, effect;
let helper;

let ready = false;

const clock = new Clock();

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", function () {
  Ammo().then(function () {
    init();
    animate();
  });
});

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );

  // scene

  scene = new Scene();
  scene.background = new Color(0xffffff);

  scene.add(new PolarGridHelper(30, 10));

  const listener = new AudioListener();
  camera.add(listener);
  scene.add(camera);

  const ambient = new AmbientLight(0x666666);
  scene.add(ambient);

  const directionalLight = new DirectionalLight(0x887766);
  directionalLight.position.set(-1, 1, 1).normalize();
  scene.add(directionalLight);

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  effect = new OutlineEffect(renderer);

  // model

  function onProgress(xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
  }

  const modelFile = "models/mmd/miku/miku_v2.pmd";
  const vmdFiles = ["models/mmd/vmds/wavefile_v2.vmd"];
  const cameraFiles = ["models/mmd/vmds/wavefile_camera.vmd"];
  const audioFile = "models/mmd/audios/wavefile_short.mp3";
  const audioParams = { delayTime: (160 * 1) / 30 };

  helper = new MMDAnimationHelper();

  const loader = new MMDLoader();

  loader.loadWithAnimation(
    modelFile,
    vmdFiles,
    function (mmd) {
      mesh = mmd.mesh;

      helper.add(mesh, {
        animation: mmd.animation,
        physics: true,
      });

      loader.loadAnimation(
        cameraFiles,
        camera,
        function (cameraAnimation) {
          helper.add(camera, {
            animation: cameraAnimation,
          });

          new AudioLoader().load(
            audioFile,
            function (buffer) {
              const audio = new Audio(listener).setBuffer(buffer);

              helper.add(audio, audioParams);
              scene.add(mesh);

              ready = true;
            },
            onProgress,
            null
          );
        },
        onProgress,
        null
      );
    },
    onProgress,
    null
  );

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  effect.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  if (ready) {
    helper.update(clock.getDelta());
  }

  effect.render(scene, camera);
}
