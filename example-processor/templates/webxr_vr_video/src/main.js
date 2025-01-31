//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  VideoTexture,
  Scene,
  Color,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  WebGLRenderer,
} from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

let camera, scene, renderer;

init();
animate();

function init() {
  const container = document.getElementById("container");
  container.addEventListener("click", function () {
    video.play();
  });

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.layers.enable(1); // render left view when no stereo available

  // video

  const video = document.getElementById("video");
  video.play();

  const texture = new VideoTexture(video);

  scene = new Scene();
  scene.background = new Color(0x101010);

  // left

  const geometry1 = new SphereGeometry(500, 60, 40);
  // invert the geometry on the x-axis so that all of the faces point inward
  geometry1.scale(-1, 1, 1);

  const uvs1 = geometry1.attributes.uv.array;

  for (let i = 0; i < uvs1.length; i += 2) {
    uvs1[i] *= 0.5;
  }

  const material1 = new MeshBasicMaterial({ map: texture });

  const mesh1 = new Mesh(geometry1, material1);
  mesh1.rotation.y = -Math.PI / 2;
  mesh1.layers.set(1); // display in left eye only
  scene.add(mesh1);

  // right

  const geometry2 = new SphereGeometry(500, 60, 40);
  geometry2.scale(-1, 1, 1);

  const uvs2 = geometry2.attributes.uv.array;

  for (let i = 0; i < uvs2.length; i += 2) {
    uvs2[i] *= 0.5;
    uvs2[i] += 0.5;
  }

  const material2 = new MeshBasicMaterial({ map: texture });

  const mesh2 = new Mesh(geometry2, material2);
  mesh2.rotation.y = -Math.PI / 2;
  mesh2.layers.set(2); // display in right eye only
  scene.add(mesh2);

  //

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
