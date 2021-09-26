import "./style.css"; // For webpack support

import {
  Vector3,
  Scene,
  Color,
  Fog,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  TextureLoader,
  MeshLambertMaterial,
  DoubleSide,
  ParametricBufferGeometry,
  Mesh,
  SphereGeometry,
  RepeatWrapping,
  sRGBEncoding,
  PlaneGeometry,
  BoxGeometry,
  WebGLRenderer,
  SpotLight,
  Plane,
  MeshPhongMaterial,
  TorusKnotGeometry,
  Matrix4,
  Group,
  MeshBasicMaterial,
  HemisphereLight,
  CameraHelper,
  PlaneHelper,
  AlwaysStencilFunc,
  BackSide,
  IncrementWrapStencilOp,
  FrontSide,
  DecrementWrapStencilOp,
  Clock,
  MeshStandardMaterial,
  NotEqualStencilFunc,
  ReplaceStencilOp,
  ShadowMaterial,
  Vector2,
  Euler,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Raycaster,
  MeshNormalMaterial,
  DepthFormat,
  UnsignedShortType,
  DepthStencilFormat,
  UnsignedIntType,
  UnsignedInt248Type,
  WebGLRenderTarget,
  RGBFormat,
  NearestFilter,
  DepthTexture,
  OrthographicCamera,
  ShaderMaterial,
  Float32BufferAttribute,
  BufferAttribute,
  DynamicDrawUsage,
  DataTexture,
  SpriteMaterial,
  Sprite,
  CanvasTexture,
  PointLight,
  BufferGeometryLoader,
  Vector4,
  MathUtils,
  GridHelper,
  CatmullRomCurve3,
  FogExp2,
  ClampToEdgeWrapping,
  Cache,
  FontLoader,
  TextGeometry,
  ShapeGeometry,
  Object3D,
  PointLightHelper,
  PolarGridHelper,
  BoxHelper,
  WireframeGeometry,
  LineSegments,
  EdgesGeometry,
  Quaternion,
  InstancedMesh,
  Points,
  PointsMaterial,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

let container, stats;
let camera, scene, renderer;

let theta = 0;
const radius = 100;

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.layers.enable(0); // enabled by default
  camera.layers.enable(1);
  camera.layers.enable(2);

  scene = new Scene();
  scene.background = new Color(0xf0f0f0);

  const light = new PointLight(0xffffff, 1);
  light.layers.enable(0);
  light.layers.enable(1);
  light.layers.enable(2);

  scene.add(camera);
  camera.add(light);

  const colors = [0xff0000, 0x00ff00, 0x0000ff];
  const geometry = new BoxGeometry(20, 20, 20);

  for (let i = 0; i < 300; i++) {
    const layer = i % 3;

    const object = new Mesh(
      geometry,
      new MeshLambertMaterial({ color: colors[layer] })
    );

    object.position.x = Math.random() * 800 - 400;
    object.position.y = Math.random() * 800 - 400;
    object.position.z = Math.random() * 800 - 400;

    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;

    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;

    object.layers.set(layer);

    scene.add(object);
  }

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  const layers = {
    "toggle red": function () {
      camera.layers.toggle(0);
    },

    "toggle green": function () {
      camera.layers.toggle(1);
    },

    "toggle blue": function () {
      camera.layers.toggle(2);
    },

    "enable all": function () {
      camera.layers.enableAll();
    },

    "disable all": function () {
      camera.layers.disableAll();
    },
  };

  //
  // Init gui
  const gui = new GUI();
  gui.add(layers, "toggle red");
  gui.add(layers, "toggle green");
  gui.add(layers, "toggle blue");
  gui.add(layers, "enable all");
  gui.add(layers, "disable all");

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
  theta += 0.1;

  camera.position.x = radius * Math.sin(MathUtils.degToRad(theta));
  camera.position.y = radius * Math.sin(MathUtils.degToRad(theta));
  camera.position.z = radius * Math.cos(MathUtils.degToRad(theta));
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}
