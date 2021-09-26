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
  HemisphereLightHelper,
  DirectionalLightHelper,
  AnimationMixer,
  LineDashedMaterial,
  Font,
  IcosahedronGeometry,
  ACESFilmicToneMapping,
  PMREMGenerator,
  Box3,
  LOD,
} from "three";

import { FlyControls } from "three/examples/jsm/controls/FlyControls.js";

let container;

let camera, scene, renderer, controls;

const clock = new Clock();

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    15000
  );
  camera.position.z = 1000;

  scene = new Scene();
  scene.fog = new Fog(0x000000, 1, 15000);

  const pointLight = new PointLight(0xff2200);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  const dirLight = new DirectionalLight(0xffffff);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  const geometry = [
    [new IcosahedronGeometry(100, 16), 50],
    [new IcosahedronGeometry(100, 8), 300],
    [new IcosahedronGeometry(100, 4), 1000],
    [new IcosahedronGeometry(100, 2), 2000],
    [new IcosahedronGeometry(100, 1), 8000],
  ];

  const material = new MeshLambertMaterial({
    color: 0xffffff,
    wireframe: true,
  });

  for (let j = 0; j < 1000; j++) {
    const lod = new LOD();

    for (let i = 0; i < geometry.length; i++) {
      const mesh = new Mesh(geometry[i][0], material);
      mesh.scale.set(1.5, 1.5, 1.5);
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      lod.addLevel(mesh, geometry[i][1]);
    }

    lod.position.x = 10000 * (0.5 - Math.random());
    lod.position.y = 7500 * (0.5 - Math.random());
    lod.position.z = 10000 * (0.5 - Math.random());
    lod.updateMatrix();
    lod.matrixAutoUpdate = false;
    scene.add(lod);
  }

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  //

  controls = new FlyControls(camera, renderer.domElement);
  controls.movementSpeed = 1000;
  controls.rollSpeed = Math.PI / 10;

  //

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  controls.update(clock.getDelta());

  renderer.render(scene, camera);
}
