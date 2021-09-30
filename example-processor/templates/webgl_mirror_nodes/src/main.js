//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  TextureLoader,
  RepeatWrapping,
  Clock,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PlaneGeometry,
  Vector2,
  Mesh,
  Object3D,
  CylinderGeometry,
  MeshPhongMaterial,
  SphereGeometry,
  IcosahedronGeometry,
  PointLight,
} from "three";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ReflectorRTT } from "three/examples/jsm/objects/ReflectorRTT.js";

import {
  NodeFrame,
  ExpressionNode,
  PhongNodeMaterial,
  MathNode,
  OperatorNode,
  TextureNode,
  BlurNode,
  FloatNode,
  ReflectorNode,
  SwitchNode,
  NormalMapNode,
} from "three/examples/jsm/nodes/Nodes.js";

const decalNormal = new TextureLoader().load("textures/decal/decal-normal.jpg");

const decalDiffuse = new TextureLoader().load(
  "textures/decal/decal-diffuse.png"
);
decalDiffuse.wrapS = decalDiffuse.wrapT = RepeatWrapping;

let camera, scene, renderer;
const clock = new Clock();

let cameraControls;

const gui = new GUI();

let sphereGroup, smallSphere;
let groundMirrorMaterial;

const frame = new NodeFrame();

let groundMirror;
let blurMirror;

function init() {
  // renderer
  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // scene
  scene = new Scene();

  // camera
  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    500
  );
  camera.position.set(0, 75, 160);

  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.update();

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  groundMirror
    .getRenderTarget()
    .setSize(
      window.innerWidth * window.devicePixelRatio,
      window.innerHeight * window.devicePixelRatio
    );

  blurMirror.size.set(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
  blurMirror.updateFrame();
}

function fillScene() {
  const planeGeo = new PlaneGeometry(100.1, 100.1);

  let geometry, material;

  // reflector/mirror plane
  geometry = new PlaneGeometry(100, 100);
  groundMirror = new ReflectorRTT(geometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
  });

  const mask = new SwitchNode(new TextureNode(decalDiffuse), "w");

  const mirror = new ReflectorNode(groundMirror);

  const normalMap = new TextureNode(decalNormal);
  const normalXY = new SwitchNode(normalMap, "xy");
  const normalXYFlip = new MathNode(normalXY, MathNode.INVERT);

  const offsetNormal = new OperatorNode(
    normalXYFlip,
    new FloatNode(0.5),
    OperatorNode.SUB
  );

  mirror.offset = new OperatorNode(
    offsetNormal, // normal
    new FloatNode(6), // scale
    OperatorNode.MUL
  );

  blurMirror = new BlurNode(mirror);
  blurMirror.size = new Vector2(
    window.innerWidth * window.devicePixelRatio,
    window.innerHeight * window.devicePixelRatio
  );
  blurMirror.uv = new ExpressionNode("projCoord.xyz / projCoord.q", "vec3");
  blurMirror.uv.keywords["projCoord"] = new OperatorNode(
    mirror.offset,
    mirror.uv,
    OperatorNode.ADD
  );
  blurMirror.radius.x = blurMirror.radius.y = 0;

  gui.add({ blur: blurMirror.radius.x }, "blur", 0, 25).onChange(function (v) {
    blurMirror.radius.x = blurMirror.radius.y = v;
  });

  groundMirrorMaterial = new PhongNodeMaterial();
  groundMirrorMaterial.environment = blurMirror; // or add "mirror" variable to disable blur
  groundMirrorMaterial.environmentAlpha = mask;
  groundMirrorMaterial.normal = new NormalMapNode(normalMap);
  //groundMirrorMaterial.normalScale = new FloatNode( 1 );

  // test serialization
  /*
						let library = {};
						library[ groundMirror.uuid ] = groundMirror;
						library[ decalDiffuse.uuid ] = decalDiffuse;
						library[ decalNormal.uuid ] = decalNormal;
						library[ mirror.textureMatrix.uuid ] = mirror.textureMatrix; // use textureMatrix to projection

						let json = groundMirrorMaterial.toJSON();

						groundMirrorMaterial = new NodeMaterialLoader( null, library ).parse( json );
					*/
  //--

  const mirrorMesh = new Mesh(planeGeo, groundMirrorMaterial);
  // add all alternative mirror materials inside the ReflectorRTT to prevent:
  // glDrawElements: Source and destination textures of the draw are the same.
  groundMirror.add(mirrorMesh);
  groundMirror.rotateX(-Math.PI / 2);
  scene.add(groundMirror);

  sphereGroup = new Object3D();
  scene.add(sphereGroup);

  geometry = new CylinderGeometry(
    0.1,
    15 * Math.cos((Math.PI / 180) * 30),
    0.1,
    24,
    1
  );
  material = new MeshPhongMaterial({ color: 0xffffff, emissive: 0x444444 });
  const sphereCap = new Mesh(geometry, material);
  sphereCap.position.y = -15 * Math.sin((Math.PI / 180) * 30) - 0.05;
  sphereCap.rotateX(-Math.PI);

  geometry = new SphereGeometry(
    15,
    24,
    24,
    Math.PI / 2,
    Math.PI * 2,
    0,
    (Math.PI / 180) * 120
  );
  const halfSphere = new Mesh(geometry, material);
  halfSphere.add(sphereCap);
  halfSphere.rotateX((-Math.PI / 180) * 135);
  halfSphere.rotateZ((-Math.PI / 180) * 20);
  halfSphere.position.y = 7.5 + 15 * Math.sin((Math.PI / 180) * 30);

  sphereGroup.add(halfSphere);

  geometry = new IcosahedronGeometry(5, 0);
  material = new MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x333333,
    flatShading: true,
  });
  smallSphere = new Mesh(geometry, material);
  scene.add(smallSphere);

  // walls
  const planeTop = new Mesh(
    planeGeo,
    new MeshPhongMaterial({ color: 0xffffff })
  );
  planeTop.position.y = 100;
  planeTop.rotateX(Math.PI / 2);
  scene.add(planeTop);

  const planeBack = new Mesh(
    planeGeo,
    new MeshPhongMaterial({ color: 0xffffff })
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
  scene.add(planeBack);

  const planeFront = new Mesh(
    planeGeo,
    new MeshPhongMaterial({ color: 0x7f7fff })
  );
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const planeRight = new Mesh(
    planeGeo,
    new MeshPhongMaterial({ color: 0x00ff00 })
  );
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  const planeLeft = new Mesh(
    planeGeo,
    new MeshPhongMaterial({ color: 0xff0000 })
  );
  planeLeft.position.x = -50;
  planeLeft.position.y = 50;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  // lights
  const mainLight = new PointLight(0xcccccc, 1.5, 250);
  mainLight.position.y = 60;
  scene.add(mainLight);

  const greenLight = new PointLight(0x00ff00, 0.25, 1000);
  greenLight.position.set(550, 50, 0);
  scene.add(greenLight);

  const redLight = new PointLight(0xff0000, 0.25, 1000);
  redLight.position.set(-550, 50, 0);
  scene.add(redLight);

  const blueLight = new PointLight(0x7f7fff, 0.25, 1000);
  blueLight.position.set(0, 50, 550);
  scene.add(blueLight);
}

function render() {
  renderer.render(scene, camera);
}

function update() {
  requestAnimationFrame(update);

  const delta = clock.getDelta();
  const timer = Date.now() * 0.01;

  sphereGroup.rotation.y -= 0.002;

  smallSphere.position.set(
    Math.cos(timer * 0.1) * 30,
    Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
    Math.sin(timer * 0.1) * 30
  );
  smallSphere.rotation.y = Math.PI / 2 - timer * 0.1;
  smallSphere.rotation.z = timer * 0.8;

  frame.update(delta).updateNode(groundMirrorMaterial);

  render();
}

init();
fillScene();
update();
