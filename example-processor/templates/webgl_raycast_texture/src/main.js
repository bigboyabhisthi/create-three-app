//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Raycaster,
  Vector2,
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  Texture,
  UVMapping,
  RepeatWrapping,
  MeshBasicMaterial,
  BoxGeometry,
  Mesh,
  MirroredRepeatWrapping,
  PlaneGeometry,
  CircleGeometry,
} from "three";

function CanvasTexture(parentTexture) {
  this._canvas = document.createElement("canvas");
  this._canvas.width = this._canvas.height = 1024;
  this._context2D = this._canvas.getContext("2d");

  if (parentTexture) {
    this._parentTexture.push(parentTexture);
    parentTexture.image = this._canvas;
  }

  const that = this;
  this._background = document.createElement("img");
  this._background.addEventListener("load", function () {
    that._canvas.width = that._background.naturalWidth;
    that._canvas.height = that._background.naturalHeight;

    that._crossRadius = Math.ceil(
      Math.min(that._canvas.width, that._canvas.height / 30)
    );
    that._crossMax = Math.ceil(0.70710678 * that._crossRadius);
    that._crossMin = Math.ceil(that._crossMax / 10);
    that._crossThickness = Math.ceil(that._crossMax / 10);

    that._draw();
  });
  this._background.crossOrigin = "";
  this._background.src = "textures/uv_grid_opengl.jpg";

  this._draw();
}

CanvasTexture.prototype = {
  constructor: CanvasTexture,

  _canvas: null,
  _context2D: null,
  _xCross: 0,
  _yCross: 0,

  _crossRadius: 57,
  _crossMax: 40,
  _crossMin: 4,
  _crossThickness: 4,

  _parentTexture: [],

  addParent: function (parentTexture) {
    if (this._parentTexture.indexOf(parentTexture) === -1) {
      this._parentTexture.push(parentTexture);
      parentTexture.image = this._canvas;
    }
  },

  setCrossPosition: function (x, y) {
    this._xCross = x * this._canvas.width;
    this._yCross = y * this._canvas.height;

    this._draw();
  },

  _draw: function () {
    if (!this._context2D) return;

    this._context2D.clearRect(0, 0, this._canvas.width, this._canvas.height);

    // Background.
    this._context2D.drawImage(this._background, 0, 0);

    // Yellow cross.
    this._context2D.lineWidth = this._crossThickness * 3;
    this._context2D.strokeStyle = "#FFFF00";

    this._context2D.beginPath();
    this._context2D.moveTo(
      this._xCross - this._crossMax - 2,
      this._yCross - this._crossMax - 2
    );
    this._context2D.lineTo(
      this._xCross - this._crossMin,
      this._yCross - this._crossMin
    );

    this._context2D.moveTo(
      this._xCross + this._crossMin,
      this._yCross + this._crossMin
    );
    this._context2D.lineTo(
      this._xCross + this._crossMax + 2,
      this._yCross + this._crossMax + 2
    );

    this._context2D.moveTo(
      this._xCross - this._crossMax - 2,
      this._yCross + this._crossMax + 2
    );
    this._context2D.lineTo(
      this._xCross - this._crossMin,
      this._yCross + this._crossMin
    );

    this._context2D.moveTo(
      this._xCross + this._crossMin,
      this._yCross - this._crossMin
    );
    this._context2D.lineTo(
      this._xCross + this._crossMax + 2,
      this._yCross - this._crossMax - 2
    );

    this._context2D.stroke();

    for (let i = 0; i < this._parentTexture.length; i++) {
      this._parentTexture[i].needsUpdate = true;
    }
  },
};

const width = window.innerWidth;
const height = window.innerHeight;

let canvas;
let planeTexture, cubeTexture, circleTexture;

let container;

let camera, scene, renderer;

const raycaster = new Raycaster();
const mouse = new Vector2();
const onClickPosition = new Vector2();

init();
render();

function init() {
  container = document.getElementById("container");

  scene = new Scene();
  scene.background = new Color(0xeeeeee);

  camera = new PerspectiveCamera(45, width / height, 1, 1000);
  camera.position.x = -30;
  camera.position.y = 40;
  camera.position.z = 50;
  camera.lookAt(scene.position);

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // A cube, in the middle.
  cubeTexture = new Texture(
    undefined,
    UVMapping,
    RepeatWrapping,
    RepeatWrapping
  );
  canvas = new CanvasTexture(cubeTexture);
  const cubeMaterial = new MeshBasicMaterial({ map: cubeTexture });
  const cubeGeometry = new BoxGeometry(20, 20, 20);
  let uvs = cubeGeometry.attributes.uv.array;
  // Set a specific texture mapping.
  for (let i = 0; i < uvs.length; i++) {
    uvs[i] *= 2;
  }

  const cube = new Mesh(cubeGeometry, cubeMaterial);
  cube.position.x = 4;
  cube.position.y = -5;
  cube.position.z = 0;
  scene.add(cube);

  // A plane on the left

  planeTexture = new Texture(
    undefined,
    UVMapping,
    MirroredRepeatWrapping,
    MirroredRepeatWrapping
  );
  canvas.addParent(planeTexture);
  const planeMaterial = new MeshBasicMaterial({ map: planeTexture });
  const planeGeometry = new PlaneGeometry(25, 25, 1, 1);
  uvs = planeGeometry.attributes.uv.array;

  // Set a specific texture mapping.

  for (let i = 0; i < uvs.length; i++) {
    uvs[i] *= 2;
  }

  const plane = new Mesh(planeGeometry, planeMaterial);
  plane.position.x = -16;
  plane.position.y = -5;
  plane.position.z = 0;
  scene.add(plane);

  // A circle on the right.

  circleTexture = new Texture(
    undefined,
    UVMapping,
    RepeatWrapping,
    RepeatWrapping
  );
  canvas.addParent(circleTexture);
  const circleMaterial = new MeshBasicMaterial({ map: circleTexture });
  const circleGeometry = new CircleGeometry(25, 40, 0, Math.PI * 2);
  uvs = circleGeometry.attributes.uv.array;

  // Set a specific texture mapping.

  for (let i = 0; i < uvs.length; i++) {
    uvs[i] = (uvs[i] - 0.25) * 2;
  }

  const circle = new Mesh(circleGeometry, circleMaterial);
  circle.position.x = 24;
  circle.position.y = -5;
  circle.position.z = 0;
  scene.add(circle);

  window.addEventListener("resize", onWindowResize);
  container.addEventListener("mousemove", onMouseMove);

  document.getElementById("setwrapS").addEventListener("change", setwrapS);
  document.getElementById("setwrapT").addEventListener("change", setwrapT);
  document.getElementById("setOffsetU").addEventListener("change", setOffsetU);
  document.getElementById("setOffsetV").addEventListener("change", setOffsetV);
  document.getElementById("setRepeatU").addEventListener("change", setRepeatU);
  document.getElementById("setRepeatV").addEventListener("change", setRepeatV);
  document
    .getElementById("setRotation")
    .addEventListener("change", setRotation);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(evt) {
  evt.preventDefault();

  const array = getMousePosition(container, evt.clientX, evt.clientY);
  onClickPosition.fromArray(array);

  const intersects = getIntersects(onClickPosition, scene.children);

  if (intersects.length > 0 && intersects[0].uv) {
    const uv = intersects[0].uv;
    intersects[0].object.material.map.transformUv(uv);
    canvas.setCrossPosition(uv.x, uv.y);
  }
}

function getMousePosition(dom, x, y) {
  const rect = dom.getBoundingClientRect();
  return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
}

function getIntersects(point, objects) {
  mouse.set(point.x * 2 - 1, -(point.y * 2) + 1);

  raycaster.setFromCamera(mouse, camera);

  return raycaster.intersectObjects(objects, false);
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

function setwrapS(event) {
  circleTexture.wrapS = parseFloat(event.target.value);
  circleTexture.needsUpdate = true;
}

function setwrapT(event) {
  circleTexture.wrapT = parseFloat(event.target.value);
  circleTexture.needsUpdate = true;
}

function setOffsetU(event) {
  circleTexture.offset.x = parseFloat(event.target.value);
}

function setOffsetV(event) {
  circleTexture.offset.y = parseFloat(event.target.value);
}

function setRepeatU(event) {
  circleTexture.repeat.x = parseFloat(event.target.value);
}

function setRepeatV(event) {
  circleTexture.repeat.y = parseFloat(event.target.value);
}

function setRotation(event) {
  circleTexture.rotation = parseFloat(event.target.value);
}
