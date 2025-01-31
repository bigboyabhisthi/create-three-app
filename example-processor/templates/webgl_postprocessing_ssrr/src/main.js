//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Raycaster,
  Vector2,
  PerspectiveCamera,
  Scene,
  Color,
  Fog,
  TextureLoader,
  RepeatWrapping,
  Mesh,
  PlaneGeometry,
  MeshPhongMaterial,
  HemisphereLight,
  SpotLight,
  MeshStandardMaterial,
  BoxBufferGeometry,
  IcosahedronBufferGeometry,
  ConeBufferGeometry,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { SSRrPass } from "three/examples/jsm/postprocessing/SSRrPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";

import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const params = {
  enableSSRr: true,
  autoRotate: true,
};
let composer;
let ssrrPass;
let gui;
let stats;
let controls;
let camera, scene, renderer;
const objects = [];
const selects = [];
const raycaster = new Raycaster();
const mouseDown = new Vector2();
const mouse = new Vector2();

const container = document.querySelector("#container");

// Configure and create Draco decoder.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("js/libs/draco/");
dracoLoader.setDecoderConfig({ type: "js" });

init();
animate();

function init() {
  camera = new PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    15
  );
  camera.position.set(
    0.13271600513224902,
    0.3489546826045913,
    0.43921296427927076
  );

  scene = new Scene();
  scene.background = new Color(0x443333);
  scene.fog = new Fog(0x443333, 1, 4);

  // Ground
  const map = new TextureLoader().load(
    "three/examples/textures/uv_grid_opengl.jpg"
  );
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(20, 20);
  const plane = new Mesh(
    new PlaneGeometry(8, 8),
    new MeshPhongMaterial({
      color: 0x999999,
      specular: 0x101010,
      map,
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.0001;
  // plane.receiveShadow = true;
  scene.add(plane);
  plane.name = "plane";

  // Lights
  const hemiLight = new HemisphereLight(0x443333, 0x111122);
  hemiLight.name = "hemiLight";
  scene.add(hemiLight);

  const spotLight = new SpotLight();
  spotLight.name = "spotLight";
  spotLight.angle = Math.PI / 16;
  spotLight.penumbra = 0.5;
  // spotLight.castShadow = true;
  spotLight.position.set(-1, 1, 1);
  scene.add(spotLight);

  dracoLoader.load("models/draco/bunny.drc", function (geometry) {
    geometry.computeVertexNormals();

    const material = new MeshStandardMaterial({ color: 0x606060 });
    const mesh = new Mesh(geometry, material);
    mesh.position.y = -0.0365;
    mesh.name = "bunny";
    scene.add(mesh);
    objects.push(mesh);
    selects.push(mesh);

    // Release decoder resources.
    dracoLoader.dispose();
  });

  let geometry, material, mesh;

  geometry = new BoxBufferGeometry(0.05, 0.05, 0.05);
  material = new MeshStandardMaterial({ color: "green" });
  mesh = new Mesh(geometry, material);
  mesh.position.set(-0.12, 0.025, 0.015);
  mesh.name = "box";
  scene.add(mesh);
  objects.push(mesh);
  selects.push(mesh);

  geometry = new IcosahedronBufferGeometry(0.025, 4);
  material = new MeshStandardMaterial({ color: "cyan" });
  mesh = new Mesh(geometry, material);
  mesh.position.set(-0.05, 0.025, 0.08);
  mesh.name = "sphere";
  scene.add(mesh);
  objects.push(mesh);
  // selects.push( mesh );

  geometry = new ConeBufferGeometry(0.025, 0.05, 64);
  material = new MeshStandardMaterial({ color: "yellow" });
  mesh = new Mesh(geometry, material);
  mesh.position.set(-0.05, 0.025, -0.055);
  mesh.name = "cone";
  scene.add(mesh);
  objects.push(mesh);
  // selects.push( mesh );

  // renderer
  renderer = new WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  container.appendChild(renderer.domElement);

  //

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.0635, 0);
  controls.update();
  controls.enabled = !params.autoRotate;

  // STATS

  stats = new Stats();
  container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);

  // composer

  composer = new EffectComposer(renderer);
  ssrrPass = new SSRrPass({
    renderer,
    scene,
    camera,
    width: innerWidth,
    height: innerHeight,
    selects: selects,
  });

  composer.addPass(ssrrPass);
  composer.addPass(new ShaderPass(GammaCorrectionShader));

  // GUI

  gui = new GUI();
  gui.add(params, "enableSSRr").name("Enable SSRr");
  ssrrPass.ior = 1.1;
  gui.add(ssrrPass, "ior").name("IOR").min(1).max(1.5).step(0.0001);
  gui.add(ssrrPass, "fillHole");
  gui.add(params, "autoRotate").onChange(() => {
    controls.enabled = !params.autoRotate;
  });

  const folder = gui.addFolder("more settings");
  folder.add(ssrrPass, "specular");
  folder.add(ssrrPass.specularMaterial, "metalness").min(0).max(1).step(0.01);
  folder.add(ssrrPass.specularMaterial, "roughness").min(0).max(1).step(0.01);
  folder
    .add(ssrrPass, "output", {
      Default: SSRrPass.OUTPUT.Default,
      "SSRr Only": SSRrPass.OUTPUT.SSRr,
      Beauty: SSRrPass.OUTPUT.Beauty,
      Depth: SSRrPass.OUTPUT.Depth,
      DepthSelects: SSRrPass.OUTPUT.DepthSelects,
      NormalSelects: SSRrPass.OUTPUT.NormalSelects,
      Refractive: SSRrPass.OUTPUT.Refractive,
      Specular: SSRrPass.OUTPUT.Specular,
    })
    .onChange(function (value) {
      ssrrPass.output = parseInt(value);
    });
  ssrrPass.surfDist = 0.0015;
  folder.add(ssrrPass, "surfDist").min(0).max(0.005).step(0.0001);
  ssrrPass.maxDistance = 50;
  folder.add(ssrrPass, "maxDistance").min(0).max(100).step(0.001);
  folder.add(ssrrPass, "infiniteThick");
  // folder.open()
  // gui.close()
}

function onPointerDown(event) {
  mouseDown.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseDown.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerUp(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (mouseDown.sub(mouse).length() > 0) return;

  raycaster.setFromCamera(mouse, camera);
  const intersect = raycaster.intersectObjects(objects, false)[0];

  if (intersect) {
    const index = selects.indexOf(intersect.object);
    if (index >= 0) {
      selects.splice(index, 1);
    } else {
      selects.push(intersect.object);
    }
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  stats.begin();
  render();
  stats.end();
}

function render() {
  if (params.autoRotate) {
    const timer = Date.now() * 0.0003;

    camera.position.x = Math.sin(timer) * 0.5;
    camera.position.y = 0.2135;
    camera.position.z = Math.cos(timer) * 0.5;
    camera.lookAt(0, 0.0635, 0);
  } else {
    controls.update();
  }

  if (params.enableSSRr) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}
