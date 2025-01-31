//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
  Texture,
  ImageLoader,
} from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

let camera;
let renderer;
let scene;

init();
animate();

function init() {
  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  //

  scene = new Scene();

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.layers.enable(1);

  const geometry = new BoxGeometry(100, 100, 100);
  geometry.scale(1, 1, -1);

  const textures = getTexturesFromAtlasFile(
    "textures/cube/sun_temple_stripe_stereo.jpg",
    12
  );

  const materials = [];

  for (let i = 0; i < 6; i++) {
    materials.push(new MeshBasicMaterial({ map: textures[i] }));
  }

  const skyBox = new Mesh(geometry, materials);
  skyBox.layers.set(1);
  scene.add(skyBox);

  const materialsR = [];

  for (let i = 6; i < 12; i++) {
    materialsR.push(new MeshBasicMaterial({ map: textures[i] }));
  }

  const skyBoxR = new Mesh(geometry, materialsR);
  skyBoxR.layers.set(2);
  scene.add(skyBoxR);

  window.addEventListener("resize", onWindowResize);
}

function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
  const textures = [];

  for (let i = 0; i < tilesNum; i++) {
    textures[i] = new Texture();
  }

  const loader = new ImageLoader();
  loader.load(atlasImgUrl, function (imageObj) {
    let canvas, context;
    const tileWidth = imageObj.height;

    for (let i = 0; i < textures.length; i++) {
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d");
      canvas.height = tileWidth;
      canvas.width = tileWidth;
      context.drawImage(
        imageObj,
        tileWidth * i,
        0,
        tileWidth,
        tileWidth,
        0,
        0,
        tileWidth,
        tileWidth
      );
      textures[i].image = canvas;
      textures[i].needsUpdate = true;
    }
  });

  return textures;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
