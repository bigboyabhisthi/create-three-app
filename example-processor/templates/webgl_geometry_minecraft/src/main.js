//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Clock,
  PerspectiveCamera,
  Scene,
  Color,
  Matrix4,
  PlaneGeometry,
  TextureLoader,
  NearestFilter,
  Mesh,
  MeshLambertMaterial,
  DoubleSide,
  AmbientLight,
  DirectionalLight,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { FirstPersonControls } from "three/examples/jsm/controls/FirstPersonControls.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

let container, stats;

let camera, controls, scene, renderer;

const worldWidth = 128,
  worldDepth = 128;
const worldHalfWidth = worldWidth / 2;
const worldHalfDepth = worldDepth / 2;
const data = generateHeight(worldWidth, worldDepth);

const clock = new Clock();

init();
animate();

function init() {
  container = document.getElementById("container");

  camera = new PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.y = getY(worldHalfWidth, worldHalfDepth) * 100 + 100;

  scene = new Scene();
  scene.background = new Color(0xbfd1e5);

  // sides

  const matrix = new Matrix4();

  const pxGeometry = new PlaneGeometry(100, 100);
  pxGeometry.attributes.uv.array[1] = 0.5;
  pxGeometry.attributes.uv.array[3] = 0.5;
  pxGeometry.rotateY(Math.PI / 2);
  pxGeometry.translate(50, 0, 0);

  const nxGeometry = new PlaneGeometry(100, 100);
  nxGeometry.attributes.uv.array[1] = 0.5;
  nxGeometry.attributes.uv.array[3] = 0.5;
  nxGeometry.rotateY(-Math.PI / 2);
  nxGeometry.translate(-50, 0, 0);

  const pyGeometry = new PlaneGeometry(100, 100);
  pyGeometry.attributes.uv.array[5] = 0.5;
  pyGeometry.attributes.uv.array[7] = 0.5;
  pyGeometry.rotateX(-Math.PI / 2);
  pyGeometry.translate(0, 50, 0);

  const pzGeometry = new PlaneGeometry(100, 100);
  pzGeometry.attributes.uv.array[1] = 0.5;
  pzGeometry.attributes.uv.array[3] = 0.5;
  pzGeometry.translate(0, 0, 50);

  const nzGeometry = new PlaneGeometry(100, 100);
  nzGeometry.attributes.uv.array[1] = 0.5;
  nzGeometry.attributes.uv.array[3] = 0.5;
  nzGeometry.rotateY(Math.PI);
  nzGeometry.translate(0, 0, -50);

  //

  const geometries = [];

  for (let z = 0; z < worldDepth; z++) {
    for (let x = 0; x < worldWidth; x++) {
      const h = getY(x, z);

      matrix.makeTranslation(
        x * 100 - worldHalfWidth * 100,
        h * 100,
        z * 100 - worldHalfDepth * 100
      );

      const px = getY(x + 1, z);
      const nx = getY(x - 1, z);
      const pz = getY(x, z + 1);
      const nz = getY(x, z - 1);

      geometries.push(pyGeometry.clone().applyMatrix4(matrix));

      if ((px !== h && px !== h + 1) || x === 0) {
        geometries.push(pxGeometry.clone().applyMatrix4(matrix));
      }

      if ((nx !== h && nx !== h + 1) || x === worldWidth - 1) {
        geometries.push(nxGeometry.clone().applyMatrix4(matrix));
      }

      if ((pz !== h && pz !== h + 1) || z === worldDepth - 1) {
        geometries.push(pzGeometry.clone().applyMatrix4(matrix));
      }

      if ((nz !== h && nz !== h + 1) || z === 0) {
        geometries.push(nzGeometry.clone().applyMatrix4(matrix));
      }
    }
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  geometry.computeBoundingSphere();

  const texture = new TextureLoader().load("textures/minecraft/atlas.png");
  texture.magFilter = NearestFilter;

  const mesh = new Mesh(
    geometry,
    new MeshLambertMaterial({ map: texture, side: DoubleSide })
  );
  scene.add(mesh);

  const ambientLight = new AmbientLight(0xcccccc);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 0.5).normalize();
  scene.add(directionalLight);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new FirstPersonControls(camera, renderer.domElement);

  controls.movementSpeed = 1000;
  controls.lookSpeed = 0.125;
  controls.lookVertical = true;

  stats = new Stats();
  container.appendChild(stats.dom);

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  controls.handleResize();
}

function generateHeight(width, height) {
  const data = [],
    perlin = new ImprovedNoise(),
    size = width * height,
    z = Math.random() * 100;

  let quality = 2;

  for (let j = 0; j < 4; j++) {
    if (j === 0) for (let i = 0; i < size; i++) data[i] = 0;

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = (i / width) | 0;
      data[i] += perlin.noise(x / quality, y / quality, z) * quality;
    }

    quality *= 4;
  }

  return data;
}

function getY(x, z) {
  return (data[x + z * worldWidth] * 0.2) | 0;
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  controls.update(clock.getDelta());
  renderer.render(scene, camera);
}
