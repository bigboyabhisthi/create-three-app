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
  NoBlending,
  NormalBlending,
  AdditiveBlending,
  SubtractiveBlending,
  MultiplyBlending,
  ZeroFactor,
  OneFactor,
  SrcColorFactor,
  OneMinusSrcColorFactor,
  SrcAlphaFactor,
  OneMinusSrcAlphaFactor,
  DstAlphaFactor,
  OneMinusDstAlphaFactor,
  DstColorFactor,
  OneMinusDstColorFactor,
  SrcAlphaSaturateFactor,
  CustomBlending,
  AddEquation,
  SubtractEquation,
  ReverseSubtractEquation,
  MinEquation,
  MaxEquation,
  MeshDepthMaterial,
  BasicDepthPacking,
  RGBADepthPacking,
  CubeTextureLoader,
  LinearMipMapLinearFilter,
  LinearFilter,
  DefaultLoadingManager,
  UnsignedByteType,
  RGBM16Encoding,
  ObjectLoader,
  MeshPhysicalMaterial,
  EquirectangularReflectionMapping,
  ReinhardToneMapping,
  Texture,
  UVMapping,
  NearestMipmapNearestFilter,
  UniformsUtils,
  Spherical,
  ConeGeometry,
  CircleGeometry,
  CylinderGeometry,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let container, stats;
let camera, scene, renderer;
let mesh, mixer;

const radius = 600;
let theta = 0;
let prevTime = Date.now();

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  //

  camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.y = 300;

  scene = new Scene();
  scene.background = new Color(0xf0f0f0);

  //

  const light1 = new DirectionalLight(0xefefff, 1.5);
  light1.position.set(1, 1, 1).normalize();
  scene.add(light1);

  const light2 = new DirectionalLight(0xffefef, 1.5);
  light2.position.set(-1, -1, -1).normalize();
  scene.add(light2);

  const loader = new GLTFLoader();
  loader.load("models/gltf/Horse.glb", function (gltf) {
    mesh = gltf.scene.children[0];
    mesh.scale.set(1.5, 1.5, 1.5);
    scene.add(mesh);

    mixer = new AnimationMixer(mesh);

    mixer.clipAction(gltf.animations[0]).setDuration(1).play();
  });

  //

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.outputEncoding = sRGBEncoding;

  container.appendChild(renderer.domElement);

  //

  stats = new Stats();
  container.appendChild(stats.dom);

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
  theta += 0.1;

  camera.position.x = radius * Math.sin(MathUtils.degToRad(theta));
  camera.position.z = radius * Math.cos(MathUtils.degToRad(theta));

  camera.lookAt(0, 150, 0);

  if (mixer) {
    const time = Date.now();

    mixer.update((time - prevTime) * 0.001);

    prevTime = time;
  }

  renderer.render(scene, camera);
}
