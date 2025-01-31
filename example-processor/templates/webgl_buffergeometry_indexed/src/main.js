//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  Scene,
  Color,
  HemisphereLight,
  BufferGeometry,
  Float32BufferAttribute,
  MeshPhongMaterial,
  DoubleSide,
  Mesh,
  WebGLRenderer,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

let camera, scene, renderer, stats;

let mesh;

init();
animate();

function init() {
  //

  camera = new PerspectiveCamera(
    27,
    window.innerWidth / window.innerHeight,
    1,
    3500
  );
  camera.position.z = 64;

  scene = new Scene();
  scene.background = new Color(0x050505);

  //

  const light = new HemisphereLight();
  scene.add(light);

  //

  const geometry = new BufferGeometry();

  const indices = [];

  const vertices = [];
  const normals = [];
  const colors = [];

  const size = 20;
  const segments = 10;

  const halfSize = size / 2;
  const segmentSize = size / segments;

  // generate vertices, normals and color data for a simple grid geometry

  for (let i = 0; i <= segments; i++) {
    const y = i * segmentSize - halfSize;

    for (let j = 0; j <= segments; j++) {
      const x = j * segmentSize - halfSize;

      vertices.push(x, -y, 0);
      normals.push(0, 0, 1);

      const r = x / size + 0.5;
      const g = y / size + 0.5;

      colors.push(r, g, 1);
    }
  }

  // generate indices (data for element array buffer)

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + (j + 1);
      const b = i * (segments + 1) + j;
      const c = (i + 1) * (segments + 1) + j;
      const d = (i + 1) * (segments + 1) + (j + 1);

      // generate two faces (triangles) per iteration

      indices.push(a, b, d); // face one
      indices.push(b, c, d); // face two
    }
  }

  //

  geometry.setIndex(indices);
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

  const material = new MeshPhongMaterial({
    side: DoubleSide,
    vertexColors: true,
  });

  mesh = new Mesh(geometry, material);
  scene.add(mesh);

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //

  stats = new Stats();
  document.body.appendChild(stats.dom);

  //

  const gui = new GUI();
  gui.add(material, "wireframe");

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  const time = Date.now() * 0.001;

  mesh.rotation.x = time * 0.25;
  mesh.rotation.y = time * 0.5;

  renderer.render(scene, camera);
}
