//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  WebGLRenderer,
  ACESFilmicToneMapping,
  sRGBEncoding,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Color,
  CanvasTexture,
  PlaneGeometry,
  MeshBasicMaterial,
  MultiplyBlending,
  Mesh,
} from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

let camera, scene, renderer;

init();
render();

function init() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputEncoding = sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(-2.5, 0.6, 3.0);

  const pmremGenerator = new PMREMGenerator(renderer);

  scene = new Scene();
  scene.background = new Color(0xf0f0f0);
  scene.environment = pmremGenerator.fromScene(
    new RoomEnvironment(),
    0.04
  ).texture;

  const loader = new GLTFLoader().setPath("models/gltf/DamagedHelmet/glTF/");
  loader.load("DamagedHelmet.gltf", async function (gltf) {
    scene.add(gltf.scene);

    const shadowMesh = createSpotShadowMesh();
    shadowMesh.position.y = -1.1;
    shadowMesh.position.z = -0.25;
    shadowMesh.scale.setScalar(2);
    scene.add(shadowMesh);

    render();

    // USDZ

    const exporter = new USDZExporter();
    const arraybuffer = await exporter.parse(gltf.scene);
    const blob = new Blob([arraybuffer], { type: "application/octet-stream" });

    const link = document.getElementById("link");
    link.href = URL.createObjectURL(blob);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.minDistance = 2;
  controls.maxDistance = 10;
  controls.target.set(0, -0.15, -0.2);
  controls.update();

  window.addEventListener("resize", onWindowResize);
}

function createSpotShadowMesh() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0.1, "rgba(130,130,130,1)");
  gradient.addColorStop(1, "rgba(255,255,255,1)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shadowTexture = new CanvasTexture(canvas);

  const geometry = new PlaneGeometry();
  const material = new MeshBasicMaterial({
    map: shadowTexture,
    blending: MultiplyBlending,
    toneMapped: false,
  });

  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

//

function render() {
  renderer.render(scene, camera);
}
