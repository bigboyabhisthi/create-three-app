//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Vector3,
  PerspectiveCamera,
  Scene,
  Color,
  HemisphereLight,
  DirectionalLight,
  Mesh,
  BoxGeometry,
  ShadowMaterial,
  MeshLambertMaterial,
  Matrix4,
  InstancedMesh,
  DynamicDrawUsage,
  IcosahedronGeometry,
  WebGLRenderer,
  sRGBEncoding,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OimoPhysics } from "three/examples/jsm/physics/OimoPhysics.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

let camera, scene, renderer, stats;
let physics, position;

let boxes, spheres;

init();

async function init() {
  physics = await OimoPhysics();
  position = new Vector3();

  //

  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(-1, 1.5, 2);
  camera.lookAt(0, 0.5, 0);

  scene = new Scene();
  scene.background = new Color(0x666666);

  const hemiLight = new HemisphereLight();
  hemiLight.intensity = 0.35;
  scene.add(hemiLight);

  const dirLight = new DirectionalLight();
  dirLight.position.set(5, 5, 5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.zoom = 2;
  scene.add(dirLight);

  const floor = new Mesh(
    new BoxGeometry(10, 5, 10),
    new ShadowMaterial({ color: 0x111111 })
  );
  floor.position.y = -2.5;
  floor.receiveShadow = true;
  scene.add(floor);
  physics.addMesh(floor);

  //

  const material = new MeshLambertMaterial();

  const matrix = new Matrix4();
  const color = new Color();

  // Boxes

  const geometryBox = new BoxGeometry(0.1, 0.1, 0.1);
  boxes = new InstancedMesh(geometryBox, material, 100);
  boxes.instanceMatrix.setUsage(DynamicDrawUsage); // will be updated every frame
  boxes.castShadow = true;
  boxes.receiveShadow = true;
  scene.add(boxes);

  for (let i = 0; i < boxes.count; i++) {
    matrix.setPosition(
      Math.random() - 0.5,
      Math.random() * 2,
      Math.random() - 0.5
    );
    boxes.setMatrixAt(i, matrix);
    boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
  }

  physics.addMesh(boxes, 1);

  // Spheres

  const geometrySphere = new IcosahedronGeometry(0.075, 3);
  spheres = new InstancedMesh(geometrySphere, material, 100);
  spheres.instanceMatrix.setUsage(DynamicDrawUsage); // will be updated every frame
  spheres.castShadow = true;
  spheres.receiveShadow = true;
  scene.add(spheres);

  for (let i = 0; i < spheres.count; i++) {
    matrix.setPosition(
      Math.random() - 0.5,
      Math.random() * 2,
      Math.random() - 0.5
    );
    spheres.setMatrixAt(i, matrix);
    spheres.setColorAt(i, color.setHex(0xffffff * Math.random()));
  }

  physics.addMesh(spheres, 1);

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.y = 0.5;
  controls.update();

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  //

  let index = Math.floor(Math.random() * boxes.count);

  position.set(0, Math.random() + 1, 0);
  physics.setMeshPosition(boxes, position, index);

  //

  index = Math.floor(Math.random() * spheres.count);

  position.set(0, Math.random() + 1, 0);
  physics.setMeshPosition(spheres, position, index);

  renderer.render(scene, camera);

  stats.update();
}
