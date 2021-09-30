//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  CubeTextureLoader,
  MeshBasicMaterial,
  SphereGeometry,
  Mesh,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

let camera,
  scene,
  renderer,
  stats,
  singleMaterial,
  zmaterial,
  parameters,
  nobjects,
  cubeMaterial;

let mouseX = 0,
  mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let width = window.innerWidth;
let height = window.innerHeight;

const materials = [],
  objects = [];

const postprocessing = {};

init();
animate();

function init() {
  const container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(70, width / height, 1, 3000);
  camera.position.z = 200;

  scene = new Scene();

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const path = "textures/cube/SwedishRoyalCastle/";
  const format = ".jpg";
  const urls = [
    path + "px" + format,
    path + "nx" + format,
    path + "py" + format,
    path + "ny" + format,
    path + "pz" + format,
    path + "nz" + format,
  ];

  const textureCube = new CubeTextureLoader().load(urls);

  parameters = { color: 0xff1100, envMap: textureCube };
  cubeMaterial = new MeshBasicMaterial(parameters);

  singleMaterial = false;

  if (singleMaterial) zmaterial = [cubeMaterial];

  const geo = new SphereGeometry(1, 20, 10);

  const xgrid = 14,
    ygrid = 9,
    zgrid = 14;

  nobjects = xgrid * ygrid * zgrid;

  const s = 60;
  let count = 0;

  for (let i = 0; i < xgrid; i++) {
    for (let j = 0; j < ygrid; j++) {
      for (let k = 0; k < zgrid; k++) {
        let mesh;

        if (singleMaterial) {
          mesh = new Mesh(geo, zmaterial);
        } else {
          mesh = new Mesh(geo, new MeshBasicMaterial(parameters));
          materials[count] = mesh.material;
        }

        const x = 200 * (i - xgrid / 2);
        const y = 200 * (j - ygrid / 2);
        const z = 200 * (k - zgrid / 2);

        mesh.position.set(x, y, z);
        mesh.scale.set(s, s, s);

        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();

        scene.add(mesh);
        objects.push(mesh);

        count++;
      }
    }
  }

  initPostprocessing();

  renderer.autoClear = false;

  stats = new Stats();
  container.appendChild(stats.dom);

  container.style.touchAction = "none";
  container.addEventListener("pointermove", onPointerMove);

  window.addEventListener("resize", onWindowResize);

  const effectController = {
    focus: 500.0,
    aperture: 5,
    maxblur: 0.01,
  };

  const matChanger = function () {
    postprocessing.bokeh.uniforms["focus"].value = effectController.focus;
    postprocessing.bokeh.uniforms["aperture"].value =
      effectController.aperture * 0.00001;
    postprocessing.bokeh.uniforms["maxblur"].value = effectController.maxblur;
  };

  const gui = new GUI();
  gui.add(effectController, "focus", 10.0, 3000.0, 10).onChange(matChanger);
  gui.add(effectController, "aperture", 0, 10, 0.1).onChange(matChanger);
  gui.add(effectController, "maxblur", 0.0, 0.01, 0.001).onChange(matChanger);
  gui.close();

  matChanger();
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  width = window.innerWidth;
  height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  postprocessing.composer.setSize(width, height);
}

function initPostprocessing() {
  const renderPass = new RenderPass(scene, camera);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 1.0,
    aperture: 0.025,
    maxblur: 0.01,

    width: width,
    height: height,
  });

  const composer = new EffectComposer(renderer);

  composer.addPass(renderPass);
  composer.addPass(bokehPass);

  postprocessing.composer = composer;
  postprocessing.bokeh = bokehPass;
}

function animate() {
  requestAnimationFrame(animate, renderer.domElement);

  stats.begin();
  render();
  stats.end();
}

function render() {
  const time = Date.now() * 0.00005;

  camera.position.x += (mouseX - camera.position.x) * 0.036;
  camera.position.y += (-mouseY - camera.position.y) * 0.036;

  camera.lookAt(scene.position);

  if (!singleMaterial) {
    for (let i = 0; i < nobjects; i++) {
      const h = ((360 * (i / nobjects + time)) % 360) / 360;
      materials[i].color.setHSL(h, 1, 0.5);
    }
  }

  postprocessing.composer.render(0.1);
}
