//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  Scene,
  EquirectangularReflectionMapping,
  PerspectiveCamera,
  TorusKnotGeometry,
  MeshPhysicalMaterial,
  Mesh,
  CylinderGeometry,
  MeshStandardMaterial,
  TextureLoader,
  PlaneGeometry,
  BoxGeometry,
  MeshPhongMaterial,
  WebGLRenderer,
  BufferGeometry,
  Vector3,
  Line,
} from "three";

import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";

import { HTMLMesh } from "three/examples/jsm/interactive/HTMLMesh.js";
import { InteractiveGroup } from "three/examples/jsm/interactive/InteractiveGroup.js";
import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory.js";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

let camera, scene, renderer;
let reflector;

const parameters = {
  radius: 0.6,
  tube: 0.2,
  tubularSegments: 150,
  radialSegments: 20,
  p: 2,
  q: 3,
  thickness: 0.5,
};

init();
animate();

function init() {
  scene = new Scene();

  new RGBELoader()
    .setPath("textures/equirectangular/")
    .load("moonless_golf_1k.hdr", function (texture) {
      texture.mapping = EquirectangularReflectionMapping;

      scene.background = texture;
      scene.environment = texture;
    });

  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10
  );
  camera.position.set(0, 1.6, 1.5);

  //

  const torusGeometry = new TorusKnotGeometry(...Object.values(parameters));
  const torusMaterial = new MeshPhysicalMaterial({
    transmission: 1.0,
    roughness: 0,
    metalness: 0.25,
    thickness: 0.5,
  });
  const torus = new Mesh(torusGeometry, torusMaterial);
  torus.name = "torus";
  torus.position.y = 1.5;
  torus.position.z = -2;
  scene.add(torus);

  const cylinderGeometry = new CylinderGeometry(1, 1, 0.1, 50);
  const cylinderMaterial = new MeshStandardMaterial();
  const cylinder = new Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.position.z = -2;
  scene.add(cylinder);

  // lensflare
  const loader = new TextureLoader();
  const texture0 = loader.load("textures/lensflare/lensflare0.png");
  const texture3 = loader.load("textures/lensflare/lensflare3.png");

  const lensflare = new Lensflare();
  lensflare.position.set(0, 5, -5);
  lensflare.addElement(new LensflareElement(texture0, 700, 0));
  lensflare.addElement(new LensflareElement(texture3, 60, 0.6));
  lensflare.addElement(new LensflareElement(texture3, 70, 0.7));
  lensflare.addElement(new LensflareElement(texture3, 120, 0.9));
  lensflare.addElement(new LensflareElement(texture3, 70, 1));
  scene.add(lensflare);

  //

  reflector = new Reflector(new PlaneGeometry(2, 2), {
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
  });
  reflector.position.x = 1;
  reflector.position.y = 1.5;
  reflector.position.z = -3;
  reflector.rotation.y = -Math.PI / 4;
  // TOFIX: Reflector breaks transmission
  // scene.add( reflector );

  const frameGeometry = new BoxGeometry(2.1, 2.1, 0.1);
  const frameMaterial = new MeshPhongMaterial();
  const frame = new Mesh(frameGeometry, frameMaterial);
  frame.position.z = -0.07;
  reflector.add(frame);

  //

  renderer = new WebGLRenderer({ antialias: true });
  renderer.autoClear = false;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));

  window.addEventListener("resize", onWindowResize);

  //

  const geometry = new BufferGeometry();
  geometry.setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 0, -5)]);

  const controller1 = renderer.xr.getController(0);
  controller1.add(new Line(geometry));
  scene.add(controller1);

  const controller2 = renderer.xr.getController(1);
  controller2.add(new Line(geometry));
  scene.add(controller2);

  //

  const controllerModelFactory = new XRControllerModelFactory();

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  );
  scene.add(controllerGrip1);

  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  );
  scene.add(controllerGrip2);

  // GUI

  function onChange() {
    torus.geometry.dispose();
    torus.geometry = new TorusKnotGeometry(...Object.values(parameters));
  }

  function onThicknessChange() {
    torus.material.thickness = parameters.thickness;
  }

  const gui = new GUI({ width: 300 });
  gui.add(parameters, "radius", 0.0, 1.0).onChange(onChange);
  gui.add(parameters, "tube", 0.0, 1.0).onChange(onChange);
  gui.add(parameters, "tubularSegments", 10, 150, 1).onChange(onChange);
  gui.add(parameters, "radialSegments", 2, 20, 1).onChange(onChange);
  gui.add(parameters, "p", 1, 10, 1).onChange(onChange);
  gui.add(parameters, "q", 0, 10, 1).onChange(onChange);
  gui.add(parameters, "thickness", 0, 1).onChange(onThicknessChange);
  gui.domElement.style.visibility = "hidden";

  const group = new InteractiveGroup(renderer, camera);
  scene.add(group);

  const mesh = new HTMLMesh(gui.domElement);
  mesh.position.x = -0.75;
  mesh.position.y = 1.5;
  mesh.position.z = -0.5;
  mesh.rotation.y = Math.PI / 4;
  mesh.scale.setScalar(2);
  group.add(mesh);
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
  const time = performance.now() * 0.0002;
  const torus = scene.getObjectByName("torus");
  torus.rotation.x = time * 2;
  torus.rotation.y = time * 5;

  renderer.render(scene, camera);
}
