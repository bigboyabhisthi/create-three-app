//Shaders

import vs from "./shaders/vs.glsl";
import fs from "./shaders/fs.glsl";

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  FileLoader,
  DataTexture2DArray,
  RedFormat,
  UnsignedByteType,
  ShaderMaterial,
  Vector2,
  GLSL3,
  PlaneGeometry,
  Mesh,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { unzipSync } from "three/examples/jsm/libs/fflate.module.js";

import { WEBGL } from "three/examples/jsm/WebGL.js";

if (WEBGL.isWebGL2Available() === false) {
  document.body.appendChild(WEBGL.getWebGL2ErrorMessage());
}

let camera, scene, mesh, renderer, stats;

const planeWidth = 50;
const planeHeight = 50;

let depthStep = 0.4;

init();
animate();

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.z = 70;

  scene = new Scene();

  // width 256, height 256, depth 109, 8-bit, zip archived raw data

  new FileLoader()
    .setResponseType("arraybuffer")
    .load("textures/3d/head256x256x109.zip", function (data) {
      const zip = unzipSync(new Uint8Array(data));
      const array = new Uint8Array(zip["head256x256x109"].buffer);

      const texture = new DataTexture2DArray(array, 256, 256, 109);
      texture.format = RedFormat;
      texture.type = UnsignedByteType;

      const material = new ShaderMaterial({
        uniforms: {
          diffuse: { value: texture },
          depth: { value: 55 },
          size: { value: new Vector2(planeWidth, planeHeight) },
        },
        vertexShader: document.getElementById("vs").textContent.trim(),
        fragmentShader: document.getElementById("fs").textContent.trim(),
        glslVersion: GLSL3,
      });

      const geometry = new PlaneGeometry(planeWidth, planeHeight);

      mesh = new Mesh(geometry, material);

      scene.add(mesh);
    });

  // 2D Texture array is available on WebGL 2.0

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

function animate() {
  requestAnimationFrame(animate);

  if (mesh) {
    let value = mesh.material.uniforms["depth"].value;

    value += depthStep;

    if (value > 109.0 || value < 0.0) {
      if (value > 1.0) value = 109.0 * 2.0 - value;
      if (value < 0.0) value = -value;

      depthStep = -depthStep;
    }

    mesh.material.uniforms["depth"].value = value;
  }

  render();
  stats.update();
}

function render() {
  renderer.render(scene, camera);
}
