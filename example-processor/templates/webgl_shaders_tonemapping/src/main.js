//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  PerspectiveCamera,
  OrthographicCamera,
  Scene,
  AmbientLight,
  DirectionalLight,
  BackSide,
  AdditiveBlending,
  UniformsUtils,
  UniformsLib,
  ShaderChunk,
  ShaderMaterial,
  MeshPhongMaterial,
  TextureLoader,
  sRGBEncoding,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NormalBlending,
  SphereGeometry,
  Mesh,
  NoBlending,
  PlaneGeometry,
  CubeTextureLoader,
  WebGLRenderer,
  LinearFilter,
  RGBAFormat,
  WebGLRenderTarget,
  FloatType,
} from "three";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { AdaptiveToneMappingPass } from "three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { GammaCorrectionShader } from "three/examples/jsm/shaders/GammaCorrectionShader.js";

let bloomPass, adaptToneMappingPass, ldrToneMappingPass, hdrToneMappingPass;
let params;

let camera,
  scene,
  renderer,
  dynamicHdrEffectComposer,
  hdrEffectComposer,
  ldrEffectComposer;
let cameraCube, sceneCube;
let cameraBG, debugScene;
let adaptiveLuminanceMat, currentLuminanceMat;

let directionalLight;

let orbitControls;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let windowThirdX = window.innerWidth / 3;

init();
animate();

function init() {
  params = {
    bloomAmount: 1.0,
    sunLight: 4.0,

    enabled: true,
    avgLuminance: 0.7,
    middleGrey: 0.04,
    maxLuminance: 16,

    adaptionRate: 2.0,
  };

  const container = document.createElement("div");
  document.body.appendChild(container);

  // CAMERAS

  camera = new PerspectiveCamera(
    70,
    windowThirdX / window.innerHeight,
    0.1,
    100000
  );
  camera.position.x = 700;
  camera.position.y = 400;
  camera.position.z = 800;
  cameraCube = new PerspectiveCamera(
    70,
    windowThirdX / window.innerHeight,
    1,
    100000
  );

  cameraBG = new OrthographicCamera(
    -windowHalfX,
    windowHalfX,
    windowHalfY,
    -windowHalfY,
    -10000,
    10000
  );
  cameraBG.position.z = 100;

  orbitControls = new OrbitControls(camera, container);
  orbitControls.autoRotate = true;
  orbitControls.autoRotateSpeed = 1;

  // SCENE

  scene = new Scene();
  sceneCube = new Scene();
  debugScene = new Scene();

  // LIGHTS

  const ambient = new AmbientLight(0x050505);
  scene.add(ambient);

  directionalLight = new DirectionalLight(0xffffff, params.sunLight);
  directionalLight.position.set(2, 0, 10).normalize();
  scene.add(directionalLight);

  const atmoShader = {
    side: BackSide,
    // blending: AdditiveBlending,
    transparent: true,
    lights: true,
    uniforms: UniformsUtils.merge([
      UniformsLib["common"],
      UniformsLib["lights"],
    ]),
    vertexShader: [
      "varying vec3 vViewPosition;",
      "varying vec3 vNormal;",
      "void main() {",
      ShaderChunk["beginnormal_vertex"],
      ShaderChunk["defaultnormal_vertex"],

      "	vNormal = normalize( transformedNormal );",
      "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
      "vViewPosition = -mvPosition.xyz;",
      "gl_Position = projectionMatrix * mvPosition;",
      "}",
    ].join("\n"),

    fragmentShader: [
      ShaderChunk["common"],
      ShaderChunk["bsdfs"],
      ShaderChunk["lights_pars_begin"],
      ShaderChunk["normal_pars_fragment"],
      ShaderChunk["lights_phong_pars_fragment"],

      "void main() {",
      "vec3 normal = normalize( -vNormal );",
      "vec3 viewPosition = normalize( vViewPosition );",
      "#if NUM_DIR_LIGHTS > 0",

      "vec3 dirDiffuse = vec3( 0.0 );",

      "for( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {",

      "vec4 lDirection = viewMatrix * vec4( directionalLights[i].direction, 0.0 );",
      "vec3 dirVector = normalize( lDirection.xyz );",
      "float dotProduct = dot( viewPosition, dirVector );",
      "dotProduct = 1.0 * max( dotProduct, 0.0 ) + (1.0 - max( -dot( normal, dirVector ), 0.0 ));",
      "dotProduct *= dotProduct;",
      "dirDiffuse += max( 0.5 * dotProduct, 0.0 ) * directionalLights[i].color;",
      "}",
      "#endif",

      //Fade out atmosphere at edge
      "float viewDot = abs(dot( normal, viewPosition ));",
      "viewDot = clamp( pow( viewDot + 0.6, 10.0 ), 0.0, 1.0);",

      "vec3 color = vec3( 0.05, 0.09, 0.13 ) * dirDiffuse;",
      "gl_FragColor = vec4( color, viewDot );",

      "}",
    ].join("\n"),
  };

  const earthAtmoMat = new ShaderMaterial(atmoShader);

  const earthMat = new MeshPhongMaterial({
    color: 0xffffff,
    shininess: 200,
  });

  const textureLoader = new TextureLoader();

  textureLoader.load("textures/planets/earth_atmos_4096.jpg", function (tex) {
    earthMat.map = tex;
    earthMat.map.encoding = sRGBEncoding;
    earthMat.needsUpdate = true;
  });
  textureLoader.load(
    "textures/planets/earth_specular_2048.jpg",
    function (tex) {
      earthMat.specularMap = tex;
      earthMat.specularMap.encoding = sRGBEncoding;
      earthMat.needsUpdate = true;
    }
  );

  // let earthNormal = textureLoader.load( 'textures/planets/earth-new-normal-2048.jpg', function( tex ) {
  // 	earthMat.normalMap = tex;
  // 	earthMat.needsUpdate = true;
  // } );

  const earthLights = textureLoader.load(
    "textures/planets/earth_lights_2048.png"
  );
  earthLights.encoding = sRGBEncoding;

  const earthLightsMat = new MeshBasicMaterial({
    color: 0xffffff,
    blending: AdditiveBlending,
    transparent: true,
    depthTest: false,
    map: earthLights,
  });

  const clouds = textureLoader.load("textures/planets/earth_clouds_2048.png");
  clouds.encoding = sRGBEncoding;

  const earthCloudsMat = new MeshLambertMaterial({
    color: 0xffffff,
    blending: NormalBlending,
    transparent: true,
    depthTest: false,
    map: clouds,
  });

  const earthGeo = new SphereGeometry(600, 24, 24);
  const sphereMesh = new Mesh(earthGeo, earthMat);
  scene.add(sphereMesh);

  const sphereLightsMesh = new Mesh(earthGeo, earthLightsMat);
  scene.add(sphereLightsMesh);

  const sphereCloudsMesh = new Mesh(earthGeo, earthCloudsMat);
  scene.add(sphereCloudsMesh);

  const sphereAtmoMesh = new Mesh(earthGeo, earthAtmoMat);
  sphereAtmoMesh.scale.set(1.05, 1.05, 1.05);
  scene.add(sphereAtmoMesh);

  const vBGShader = [
    // "attribute vec2 uv;",
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join("\n");

  const pBGShader = [
    "uniform sampler2D map;",
    "varying vec2 vUv;",

    "void main() {",

    "vec2 sampleUV = vUv;",
    "vec4 color = texture2D( map, sampleUV, 0.0 );",

    "gl_FragColor = vec4( color.xyz, 1.0 );",

    "}",
  ].join("\n");

  // Skybox
  adaptiveLuminanceMat = new ShaderMaterial({
    uniforms: {
      map: { value: null },
    },
    vertexShader: vBGShader,
    fragmentShader: pBGShader,
    depthTest: false,
    // color: 0xffffff
    blending: NoBlending,
  });

  currentLuminanceMat = new ShaderMaterial({
    uniforms: {
      map: { value: null },
    },
    vertexShader: vBGShader,
    fragmentShader: pBGShader,
    depthTest: false,
    // color: 0xffffff
    // blending: NoBlending
  });

  let quadBG = new Mesh(new PlaneGeometry(0.1, 0.1), currentLuminanceMat);
  quadBG.position.z = -500;
  quadBG.position.x = -window.innerWidth * 0.5 + window.innerWidth * 0.05;
  quadBG.scale.set(window.innerWidth, window.innerHeight, 1);
  debugScene.add(quadBG);

  quadBG = new Mesh(new PlaneGeometry(0.1, 0.1), adaptiveLuminanceMat);
  quadBG.position.z = -500;
  quadBG.position.x = -window.innerWidth * 0.5 + window.innerWidth * 0.15;
  quadBG.scale.set(window.innerWidth, window.innerHeight, 1);
  debugScene.add(quadBG);

  const r = "textures/cube/MilkyWay/";
  const urls = [
    r + "dark-s_px.jpg",
    r + "dark-s_nx.jpg",
    r + "dark-s_py.jpg",
    r + "dark-s_ny.jpg",
    r + "dark-s_pz.jpg",
    r + "dark-s_nz.jpg",
  ];

  const textureCube = new CubeTextureLoader().load(urls);
  textureCube.encoding = sRGBEncoding;

  sceneCube.background = textureCube;

  renderer = new WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;

  container.appendChild(renderer.domElement);

  // let width = window.innerWidth || 1;
  const height = window.innerHeight || 1;

  const parameters = {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    format: RGBAFormat,
  };
  const regularRenderTarget = new WebGLRenderTarget(
    windowThirdX,
    height,
    parameters
  );
  ldrEffectComposer = new EffectComposer(renderer, regularRenderTarget);

  parameters.type = FloatType;

  if (
    renderer.capabilities.isWebGL2 === false &&
    renderer.extensions.has("OES_texture_half_float_linear") === false
  ) {
    parameters.type = undefined; // avoid usage of floating point textures
  }

  const hdrRenderTarget = new WebGLRenderTarget(
    windowThirdX,
    height,
    parameters
  );
  dynamicHdrEffectComposer = new EffectComposer(renderer, hdrRenderTarget);
  dynamicHdrEffectComposer.setSize(window.innerWidth, window.innerHeight);
  hdrEffectComposer = new EffectComposer(renderer, hdrRenderTarget);

  const debugPass = new RenderPass(debugScene, cameraBG);
  debugPass.clear = false;
  const scenePass = new RenderPass(
    scene,
    camera,
    undefined,
    undefined,
    undefined
  );
  const skyboxPass = new RenderPass(sceneCube, cameraCube);
  scenePass.clear = false;

  adaptToneMappingPass = new AdaptiveToneMappingPass(true, 256);
  adaptToneMappingPass.needsSwap = true;
  ldrToneMappingPass = new AdaptiveToneMappingPass(false, 256);
  hdrToneMappingPass = new AdaptiveToneMappingPass(false, 256);
  bloomPass = new BloomPass();
  const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

  dynamicHdrEffectComposer.addPass(skyboxPass);
  dynamicHdrEffectComposer.addPass(scenePass);
  dynamicHdrEffectComposer.addPass(adaptToneMappingPass);
  dynamicHdrEffectComposer.addPass(bloomPass);
  dynamicHdrEffectComposer.addPass(gammaCorrectionPass);

  hdrEffectComposer.addPass(skyboxPass);
  hdrEffectComposer.addPass(scenePass);
  hdrEffectComposer.addPass(hdrToneMappingPass);
  hdrEffectComposer.addPass(bloomPass);
  hdrEffectComposer.addPass(gammaCorrectionPass);

  ldrEffectComposer.addPass(skyboxPass);
  ldrEffectComposer.addPass(scenePass);
  ldrEffectComposer.addPass(ldrToneMappingPass);
  ldrEffectComposer.addPass(bloomPass);
  ldrEffectComposer.addPass(gammaCorrectionPass);

  const gui = new GUI();

  const sceneGui = gui.addFolder("Scenes");
  const toneMappingGui = gui.addFolder("ToneMapping");
  const staticToneMappingGui = gui.addFolder("StaticOnly");
  const adaptiveToneMappingGui = gui.addFolder("AdaptiveOnly");

  sceneGui.add(params, "bloomAmount", 0.0, 10.0);
  sceneGui.add(params, "sunLight", 0.1, 12.0);

  toneMappingGui.add(params, "enabled");
  toneMappingGui.add(params, "middleGrey", 0, 12);
  toneMappingGui.add(params, "maxLuminance", 1, 30);

  staticToneMappingGui.add(params, "avgLuminance", 0.001, 2.0);
  adaptiveToneMappingGui.add(params, "adaptionRate", 0.0, 10.0);

  gui.open();

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  windowThirdX = window.innerWidth / 3;

  camera.aspect = windowThirdX / window.innerHeight;
  camera.updateProjectionMatrix();

  cameraCube.aspect = windowThirdX / window.innerHeight;
  cameraCube.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  if (bloomPass) {
    bloomPass.copyUniforms["opacity"].value = params.bloomAmount;
  }

  if (adaptToneMappingPass) {
    adaptToneMappingPass.setAdaptionRate(params.adaptionRate);
    adaptiveLuminanceMat.uniforms["map"].value =
      adaptToneMappingPass.luminanceRT;
    currentLuminanceMat.uniforms["map"].value =
      adaptToneMappingPass.currentLuminanceRT;

    adaptToneMappingPass.enabled = params.enabled;
    adaptToneMappingPass.setMaxLuminance(params.maxLuminance);
    adaptToneMappingPass.setMiddleGrey(params.middleGrey);

    hdrToneMappingPass.enabled = params.enabled;
    hdrToneMappingPass.setMaxLuminance(params.maxLuminance);
    hdrToneMappingPass.setMiddleGrey(params.middleGrey);
    if (hdrToneMappingPass.setAverageLuminance) {
      hdrToneMappingPass.setAverageLuminance(params.avgLuminance);
    }

    ldrToneMappingPass.enabled = params.enabled;
    ldrToneMappingPass.setMaxLuminance(params.maxLuminance);
    ldrToneMappingPass.setMiddleGrey(params.middleGrey);
    if (ldrToneMappingPass.setAverageLuminance) {
      ldrToneMappingPass.setAverageLuminance(params.avgLuminance);
    }
  }

  directionalLight.intensity = params.sunLight;

  orbitControls.update();

  render();
}

function render() {
  camera.lookAt(scene.position);
  cameraCube.rotation.copy(camera.rotation);

  renderer.setViewport(0, 0, windowThirdX, window.innerHeight);
  ldrEffectComposer.render(0.017);

  renderer.setViewport(windowThirdX, 0, windowThirdX, window.innerHeight);
  hdrEffectComposer.render(0.017);

  renderer.setViewport(windowThirdX * 2, 0, windowThirdX, window.innerHeight);
  dynamicHdrEffectComposer.render(0.017);
}
