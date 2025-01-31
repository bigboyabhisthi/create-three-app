//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Scene,
  Clock,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  AudioLoader,
  AudioListener,
  PlaneGeometry,
  MeshLambertMaterial,
  Mesh,
  SphereGeometry,
  PositionalAudio,
  WebGLRenderer,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, clock;

const objects = [];

const speed = 2.5;
const height = 3;
const offset = 0.5;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  scene = new Scene();

  clock = new Clock();

  //

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(7, 3, 7);

  // lights

  const ambientLight = new AmbientLight(0xcccccc, 0.4);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(0, 5, 5);
  scene.add(directionalLight);

  const d = 5;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 20;

  directionalLight.shadow.mapSize.x = 1024;
  directionalLight.shadow.mapSize.y = 1024;

  // audio

  const audioLoader = new AudioLoader();

  const listener = new AudioListener();
  camera.add(listener);

  // floor

  const floorGeometry = new PlaneGeometry(10, 10);
  const floorMaterial = new MeshLambertMaterial({ color: 0x4676b6 });

  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // objects

  const count = 5;
  const radius = 3;

  const ballGeometry = new SphereGeometry(0.3, 32, 16);
  ballGeometry.translate(0, 0.3, 0);
  const ballMaterial = new MeshLambertMaterial({ color: 0xcccccc });

  // create objects when audio buffer is loaded

  audioLoader.load("sounds/ping_pong.mp3", function (buffer) {
    for (let i = 0; i < count; i++) {
      const s = (i / count) * Math.PI * 2;

      const ball = new Mesh(ballGeometry, ballMaterial);
      ball.castShadow = true;
      ball.userData.down = false;

      ball.position.x = radius * Math.cos(s);
      ball.position.z = radius * Math.sin(s);

      const audio = new PositionalAudio(listener);
      audio.setBuffer(buffer);
      ball.add(audio);

      scene.add(ball);
      objects.push(ball);
    }

    animate();
  });

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 25;

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
}

function render() {
  const time = clock.getElapsedTime();

  for (let i = 0; i < objects.length; i++) {
    const ball = objects[i];

    const previousHeight = ball.position.y;
    ball.position.y = Math.abs(Math.sin(i * offset + time * speed) * height);

    if (ball.position.y < previousHeight) {
      ball.userData.down = true;
    } else {
      if (ball.userData.down === true) {
        // ball changed direction from down to up

        const audio = ball.children[0];
        audio.play(); // play audio with perfect timing when ball hits the surface
        ball.userData.down = false;
      }
    }
  }

  renderer.render(scene, camera);
}
