//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  Color,
  WebGLRenderer,
  TorusKnotGeometry,
  MeshStandardMaterial,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  DefaultLoadingManager,
  UnsignedByteType,
  LinearFilter,
  CubeTextureLoader,
  sRGBEncoding,
  RGBM16Encoding,
  PMREMGenerator,
  ACESFilmicToneMapping,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { HDRCubeTextureLoader } from "three/examples/jsm/loaders/HDRCubeTextureLoader.js";
import { RGBMLoader } from "three/examples/jsm/loaders/RGBMLoader.js";
import { DebugEnvironment } from "three/examples/jsm/environments/DebugEnvironment.js";

import { MeshStandardNodeMaterial } from "three/examples/jsm/nodes/Nodes.js";

const params = {
  envMap: "HDR",
  roughness: 0.0,
  metalness: 0.0,
  exposure: 1.0,
  nodes: true,
  animate: true,
  debug: false,
};

let container, stats;
let camera, scene, renderer, controls;
let torusMesh, torusMeshNode, planeMesh;
let generatedCubeRenderTarget,
  ldrCubeRenderTarget,
  hdrCubeRenderTarget,
  rgbmCubeRenderTarget;
let ldrCubeMap, hdrCubeMap, rgbmCubeMap;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 0, 120);

  scene = new Scene();
  scene.background = new Color(0x000000);

  renderer = new WebGLRenderer();
  renderer.physicallyCorrectLights = true;

  //

  let geometry = new TorusKnotGeometry(18, 8, 150, 20);

  let material = new MeshStandardMaterial();
  material.color = new Color(0xffffff);
  material.roughness = params.roughness;
  material.metalness = params.metalness;

  torusMesh = new Mesh(geometry, material);
  scene.add(torusMesh);

  material = new MeshStandardNodeMaterial();
  material.color = new Color(0xffffff);
  material.roughness = params.roughness;
  material.metalness = params.metalness;

  torusMeshNode = new Mesh(geometry, material);
  scene.add(torusMeshNode);

  geometry = new PlaneGeometry(200, 200);
  material = new MeshBasicMaterial();

  planeMesh = new Mesh(geometry, material);
  planeMesh.position.y = -50;
  planeMesh.rotation.x = -Math.PI * 0.5;
  scene.add(planeMesh);

  DefaultLoadingManager.onLoad = function () {
    pmremGenerator.dispose();
  };

  const hdrUrls = ["px.hdr", "nx.hdr", "py.hdr", "ny.hdr", "pz.hdr", "nz.hdr"];
  hdrCubeMap = new HDRCubeTextureLoader()
    .setPath("three/examples/textures/cube/pisaHDR/")
    .setDataType(UnsignedByteType)
    .load(hdrUrls, function () {
      hdrCubeRenderTarget = pmremGenerator.fromCubemap(hdrCubeMap);

      hdrCubeMap.magFilter = LinearFilter;
      hdrCubeMap.needsUpdate = true;
    });

  const ldrUrls = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];
  ldrCubeMap = new CubeTextureLoader()
    .setPath("three/examples/textures/cube/pisa/")
    .load(ldrUrls, function () {
      ldrCubeMap.encoding = sRGBEncoding;

      ldrCubeRenderTarget = pmremGenerator.fromCubemap(ldrCubeMap);
    });

  const rgbmUrls = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];
  rgbmCubeMap = new RGBMLoader()
    .setPath("three/examples/textures/cube/pisaRGBM16/")
    .loadCubemap(rgbmUrls, function () {
      rgbmCubeMap.encoding = RGBM16Encoding;

      rgbmCubeRenderTarget = pmremGenerator.fromCubemap(rgbmCubeMap);
    });

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileCubemapShader();

  const envScene = new DebugEnvironment();
  generatedCubeRenderTarget = pmremGenerator.fromScene(envScene);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputEncoding = sRGBEncoding;

  stats = new Stats();
  container.appendChild(stats.dom);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 300;

  window.addEventListener("resize", onWindowResize);

  const gui = new GUI();

  gui.add(params, "envMap", ["Generated", "LDR", "HDR", "RGBM16"]);
  gui.add(params, "roughness", 0, 1, 0.01);
  gui.add(params, "metalness", 0, 1, 0.01);
  gui.add(params, "exposure", 0, 2, 0.01);
  gui.add(params, "nodes", true);
  gui.add(params, "animate", true);
  gui.add(params, "debug", false);
  gui.open();
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  stats.begin();
  render();
  stats.end();
}

function render() {
  torusMesh.visible = !params.nodes;
  torusMeshNode.visible = params.nodes;

  torusMesh.material.roughness = params.roughness;
  torusMesh.material.metalness = params.metalness;

  torusMeshNode.material.roughness = params.roughness;
  torusMeshNode.material.metalness = params.metalness;

  let renderTarget, cubeMap;

  switch (params.envMap) {
    case "Generated":
      renderTarget = generatedCubeRenderTarget;
      cubeMap = generatedCubeRenderTarget.texture;
      break;
    case "LDR":
      renderTarget = ldrCubeRenderTarget;
      cubeMap = ldrCubeMap;
      break;
    case "HDR":
      renderTarget = hdrCubeRenderTarget;
      cubeMap = hdrCubeMap;
      break;
    case "RGBM16":
      renderTarget = rgbmCubeRenderTarget;
      cubeMap = rgbmCubeMap;
      break;
  }

  const newEnvMap = renderTarget ? renderTarget.texture : null;

  if (newEnvMap && newEnvMap !== torusMesh.material.envMap) {
    torusMesh.material.envMap = newEnvMap;
    torusMesh.material.needsUpdate = true;

    torusMeshNode.material.envMap = newEnvMap;
    torusMeshNode.material.needsUpdate = true;

    planeMesh.material.map = newEnvMap;
    planeMesh.material.needsUpdate = true;
  }

  if (params.animate) {
    torusMesh.rotation.y += 0.005;
    torusMeshNode.rotation.y = torusMesh.rotation.y;
  }

  planeMesh.visible = params.debug;

  scene.background = cubeMap;
  renderer.toneMappingExposure = params.exposure;

  renderer.render(scene, camera);
}
