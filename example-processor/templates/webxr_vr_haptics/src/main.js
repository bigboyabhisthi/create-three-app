//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Box3,
  Scene,
  Color,
  PerspectiveCamera,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  HemisphereLight,
  DirectionalLight,
  Group,
  BoxGeometry,
  WebGLRenderer,
  sRGBEncoding,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";

let container;
let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
const box = new Box3();

const controllers = [];
const oscillators = [];
let controls, group;
let audioCtx = null;

init();
animate();

function initAudio() {
  if (audioCtx !== null) {
    return;
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function createOscillator() {
    const oscillator = audioCtx.createOscillator();
    const real = Array.from({ length: 8192 }, (_, n) =>
      n === 0 ? 0 : (4 / (n * Math.PI)) * Math.sin(Math.PI * n * 0.18)
    );
    const imag = real.map(() => 0);
    oscillator.setPeriodicWave(
      audioCtx.createPeriodicWave(
        Float32Array.from(real),
        Float32Array.from(imag)
      )
    );
    oscillator.start();
    return oscillator;
  }

  oscillators.push(createOscillator());
  oscillators.push(createOscillator());
  window.oscillators = oscillators;
}

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  scene = new Scene();
  scene.background = new Color(0x808080);

  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10
  );
  camera.position.set(0, 1.6, 3);

  controls = new OrbitControls(camera, container);
  controls.target.set(0, 1.6, 0);
  controls.update();

  const floorGeometry = new PlaneGeometry(4, 4);
  const floorMaterial = new MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 1.0,
    metalness: 0.0,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new HemisphereLight(0x808080, 0x606060));

  const light = new DirectionalLight(0xffffff);
  light.position.set(0, 6, 0);
  light.castShadow = true;
  light.shadow.camera.top = 2;
  light.shadow.camera.bottom = -2;
  light.shadow.camera.right = 2;
  light.shadow.camera.left = -2;
  light.shadow.mapSize.set(4096, 4096);
  scene.add(light);

  group = new Group();
  group.position.z = -0.5;
  scene.add(group);

  for (let i = 0; i < 10; i++) {
    const intensity = (i + 1) / 10;
    const w = 0.1;
    const h = 0.1;
    const minH = 1;
    const geometry = new BoxGeometry(w, h * i + minH, w);
    const material = new MeshStandardMaterial({
      color: new Color(intensity, 0.1, 0.1),
      roughness: 0.7,
      metalness: 0.0,
    });

    const object = new Mesh(geometry, material);
    object.position.x = (i - 5) * (w + 0.05);
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData = {
      index: i + 1,
      intensity: intensity,
    };

    group.add(object);
  }

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  document.getElementById("VRButton").addEventListener("click", () => {
    initAudio();
  });

  // controllers

  controller1 = renderer.xr.getController(0);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.addEventListener("connected", controllerConnected);
  controllerGrip1.addEventListener("disconnected", controllerDisconnected);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.addEventListener("connected", controllerConnected);
  controllerGrip2.addEventListener("disconnected", controllerDisconnected);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  //

  window.addEventListener("resize", onWindowResize);
}

function controllerConnected(evt) {
  controllers.push({
    gamepad: evt.data.gamepad,
    grip: evt.target,
    colliding: false,
    playing: false,
  });
}

function controllerDisconnected(evt) {
  const index = controllers.findIndex((o) => o.controller === evt.target);
  if (index !== -1) {
    controllers.splice(index, 1);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  renderer.setAnimationLoop(render);
}

function handleCollisions() {
  for (let g = 0; g < controllers.length; g++) {
    controllers[g].colliding = false;

    const { grip, gamepad } = controllers[g];
    const sphere = {
      radius: 0.03,
      center: grip.position,
    };

    if (
      "hapticActuators" in gamepad &&
      gamepad.hapticActuators != null &&
      gamepad.hapticActuators.length > 0
    ) {
      for (let i = 0; i < group.children.length; i++) {
        const child = group.children[i];
        box.setFromObject(child);
        if (box.intersectsSphere(sphere)) {
          child.material.emissive.b = 1;
          const intensity = child.userData.index / group.children.length;
          child.scale.setScalar(1 + Math.random() * 0.1 * intensity);
          gamepad.hapticActuators[0].pulse(intensity, 100);
          oscillators[g].frequency.value = 100 + intensity * 60;
          controllers[g].colliding = true;
        } else {
          child.material.emissive.b = 0;
          child.scale.setScalar(1);
        }
      }
    }

    if (controllers[g].colliding) {
      if (!controllers[g].playing) {
        controllers[g].playing = true;
        oscillators[g].connect(audioCtx.destination);
      }
    } else {
      if (controllers[g].playing) {
        controllers[g].playing = false;
        oscillators[g].disconnect(audioCtx.destination);
      }
    }
  }
}

function render() {
  handleCollisions();

  renderer.render(scene, camera);
}
