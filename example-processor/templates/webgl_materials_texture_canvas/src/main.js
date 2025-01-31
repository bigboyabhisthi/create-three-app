//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Vector2,
  PerspectiveCamera,
  Scene,
  MeshBasicMaterial,
  Mesh,
  BoxGeometry,
  WebGLRenderer,
  CanvasTexture,
} from "three";

let camera, scene, renderer, mesh, material;
const drawStartPos = new Vector2();

init();
setupCanvasDrawing();
animate();

function init() {
  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.z = 500;

  scene = new Scene();

  material = new MeshBasicMaterial();

  mesh = new Mesh(new BoxGeometry(200, 200, 200), material);
  scene.add(mesh);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}

// Sets up the drawing canvas and adds it as the material map

function setupCanvasDrawing() {
  // get canvas and context

  const drawingCanvas = document.getElementById("drawing-canvas");
  const drawingContext = drawingCanvas.getContext("2d");

  // draw white background

  drawingContext.fillStyle = "#FFFFFF";
  drawingContext.fillRect(0, 0, 128, 128);

  // set canvas as material.map (this could be done to any map, bump, displacement etc.)

  material.map = new CanvasTexture(drawingCanvas);

  // set the variable to keep track of when to draw

  let paint = false;

  // add canvas event listeners
  drawingCanvas.addEventListener("pointerdown", function (e) {
    paint = true;
    drawStartPos.set(e.offsetX, e.offsetY);
  });

  drawingCanvas.addEventListener("pointermove", function (e) {
    if (paint) draw(drawingContext, e.offsetX, e.offsetY);
  });

  drawingCanvas.addEventListener("pointerup", function () {
    paint = false;
  });

  drawingCanvas.addEventListener("pointerleave", function () {
    paint = false;
  });
}

function draw(drawContext, x, y) {
  drawContext.moveTo(drawStartPos.x, drawStartPos.y);
  drawContext.strokeStyle = "#000000";
  drawContext.lineTo(x, y);
  drawContext.stroke();
  // reset drawing start position to current position.
  drawStartPos.set(x, y);
  // need to flag the map as needing updating.
  material.map.needsUpdate = true;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;

  renderer.render(scene, camera);
}
