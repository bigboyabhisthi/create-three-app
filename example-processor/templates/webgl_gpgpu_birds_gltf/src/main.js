//Shaders

import fragmentShaderPosition from "./shaders/fragmentShaderPosition.glsl";
import fragmentShaderVelocity from "./shaders/fragmentShaderVelocity.glsl";

import "./style.css"; // For webpack support

import {
  BufferGeometry,
  DataTexture,
  RGBFormat,
  FloatType,
  BufferAttribute,
  PerspectiveCamera,
  Scene,
  Color,
  Fog,
  HemisphereLight,
  DirectionalLight,
  WebGLRenderer,
  HalfFloatType,
  Vector3,
  RepeatWrapping,
  MeshStandardMaterial,
  Mesh,
} from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

/* TEXTURE WIDTH FOR SIMULATION */
const WIDTH = 64;
const BIRDS = WIDTH * WIDTH;

/* BAKE ANIMATION INTO TEXTURE and CREATE GEOMETRY FROM BASE MODEL */
const BirdGeometry = new BufferGeometry();
let textureAnimation,
  durationAnimation,
  birdMesh,
  materialShader,
  vertexPerBird;

function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2)));
}

Math.lerp = function (value1, value2, amount) {
  amount = Math.max(Math.min(amount, 1), 0);
  return value1 + (value2 - value1) * amount;
};

const gltfs = ["models/gltf/Parrot.glb", "models/gltf/Flamingo.glb"];
const colors = [0xccffff, 0xffdeff];
const sizes = [0.2, 0.1];
const selectModel = Math.floor(Math.random() * gltfs.length);
new GLTFLoader().load(gltfs[selectModel], function (gltf) {
  const animations = gltf.animations;
  durationAnimation = Math.round(animations[0].duration * 60);
  const birdGeo = gltf.scene.children[0].geometry;
  const morphAttributes = birdGeo.morphAttributes.position;
  const tHeight = nextPowerOf2(durationAnimation);
  const tWidth = nextPowerOf2(birdGeo.getAttribute("position").count);
  vertexPerBird = birdGeo.getAttribute("position").count;
  const tData = new Float32Array(3 * tWidth * tHeight);

  for (let i = 0; i < tWidth; i++) {
    for (let j = 0; j < tHeight; j++) {
      const offset = j * tWidth * 3;

      const curMorph = Math.floor(
        (j / durationAnimation) * morphAttributes.length
      );
      const nextMorph =
        (Math.floor((j / durationAnimation) * morphAttributes.length) + 1) %
        morphAttributes.length;
      const lerpAmount = ((j / durationAnimation) * morphAttributes.length) % 1;

      if (j < durationAnimation) {
        let d0, d1;

        d0 = morphAttributes[curMorph].array[i * 3];
        d1 = morphAttributes[nextMorph].array[i * 3];

        if (d0 !== undefined && d1 !== undefined)
          tData[offset + i * 3] = Math.lerp(d0, d1, lerpAmount);

        d0 = morphAttributes[curMorph].array[i * 3 + 1];
        d1 = morphAttributes[nextMorph].array[i * 3 + 1];

        if (d0 !== undefined && d1 !== undefined)
          tData[offset + i * 3 + 1] = Math.lerp(d0, d1, lerpAmount);

        d0 = morphAttributes[curMorph].array[i * 3 + 2];
        d1 = morphAttributes[nextMorph].array[i * 3 + 2];

        if (d0 !== undefined && d1 !== undefined)
          tData[offset + i * 3 + 2] = Math.lerp(d0, d1, lerpAmount);
      }
    }
  }

  textureAnimation = new DataTexture(
    tData,
    tWidth,
    tHeight,
    RGBFormat,
    FloatType
  );
  textureAnimation.needsUpdate = true;

  const vertices = [],
    color = [],
    reference = [],
    seeds = [],
    indices = [];
  const totalVertices = birdGeo.getAttribute("position").count * 3 * BIRDS;
  for (let i = 0; i < totalVertices; i++) {
    const bIndex = i % (birdGeo.getAttribute("position").count * 3);
    vertices.push(birdGeo.getAttribute("position").array[bIndex]);
    color.push(birdGeo.getAttribute("color").array[bIndex]);
  }

  let r = Math.random();
  for (let i = 0; i < birdGeo.getAttribute("position").count * BIRDS; i++) {
    const bIndex = i % birdGeo.getAttribute("position").count;
    const bird = Math.floor(i / birdGeo.getAttribute("position").count);
    if (bIndex == 0) r = Math.random();
    const j = ~~bird;
    const x = (j % WIDTH) / WIDTH;
    const y = ~~(j / WIDTH) / WIDTH;
    reference.push(x, y, bIndex / tWidth, durationAnimation / tHeight);
    seeds.push(bird, r, Math.random(), Math.random());
  }

  for (let i = 0; i < birdGeo.index.array.length * BIRDS; i++) {
    const offset =
      Math.floor(i / birdGeo.index.array.length) *
      birdGeo.getAttribute("position").count;
    indices.push(birdGeo.index.array[i % birdGeo.index.array.length] + offset);
  }

  BirdGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertices), 3)
  );
  BirdGeometry.setAttribute(
    "birdColor",
    new BufferAttribute(new Float32Array(color), 3)
  );
  BirdGeometry.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(color), 3)
  );
  BirdGeometry.setAttribute(
    "reference",
    new BufferAttribute(new Float32Array(reference), 4)
  );
  BirdGeometry.setAttribute(
    "seeds",
    new BufferAttribute(new Float32Array(seeds), 4)
  );

  BirdGeometry.setIndex(indices);

  init();
  animate();
});

let container, stats;
let camera, scene, renderer;
let mouseX = 0,
  mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const BOUNDS = 800,
  BOUNDS_HALF = BOUNDS / 2;

let last = performance.now();

let gpuCompute;
let velocityVariable;
let positionVariable;
let positionUniforms;
let velocityUniforms;

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    3000
  );
  camera.position.z = 350;

  scene = new Scene();
  scene.background = new Color(colors[selectModel]);
  scene.fog = new Fog(colors[selectModel], 100, 1000);

  // LIGHTS

  const hemiLight = new HemisphereLight(colors[selectModel], 0xffffff, 1.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const dirLight = new DirectionalLight(0x00ced1, 0.6);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  initComputeRenderer();

  stats = new Stats();
  container.appendChild(stats.dom);

  container.style.touchAction = "none";
  container.addEventListener("pointermove", onPointerMove);

  window.addEventListener("resize", onWindowResize);

  const gui = new GUI();

  const effectController = {
    separation: 20.0,
    alignment: 20.0,
    cohesion: 20.0,
    freedom: 0.75,
    size: sizes[selectModel],
    count: BIRDS,
  };

  const valuesChanger = function () {
    velocityUniforms["separationDistance"].value = effectController.separation;
    velocityUniforms["alignmentDistance"].value = effectController.alignment;
    velocityUniforms["cohesionDistance"].value = effectController.cohesion;
    velocityUniforms["freedomFactor"].value = effectController.freedom;
    if (materialShader)
      materialShader.uniforms["size"].value = effectController.size;
    BirdGeometry.setDrawRange(0, vertexPerBird * effectController.count);
  };

  valuesChanger();

  gui
    .add(effectController, "separation", 0.0, 100.0, 1.0)
    .onChange(valuesChanger);
  gui
    .add(effectController, "alignment", 0.0, 100, 0.001)
    .onChange(valuesChanger);
  gui
    .add(effectController, "cohesion", 0.0, 100, 0.025)
    .onChange(valuesChanger);
  gui.add(effectController, "size", 0, 1, 0.01).onChange(valuesChanger);
  gui.add(effectController, "count", 0, BIRDS, 1).onChange(valuesChanger);
  gui.close();

  initBirds(effectController);
}

function initComputeRenderer() {
  gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

  if (isSafari()) {
    gpuCompute.setDataType(HalfFloatType);
  }

  const dtPosition = gpuCompute.createTexture();
  const dtVelocity = gpuCompute.createTexture();
  fillPositionTexture(dtPosition);
  fillVelocityTexture(dtVelocity);

  velocityVariable = gpuCompute.addVariable(
    "textureVelocity",
    document.getElementById("fragmentShaderVelocity").textContent,
    dtVelocity
  );
  positionVariable = gpuCompute.addVariable(
    "texturePosition",
    document.getElementById("fragmentShaderPosition").textContent,
    dtPosition
  );

  gpuCompute.setVariableDependencies(velocityVariable, [
    positionVariable,
    velocityVariable,
  ]);
  gpuCompute.setVariableDependencies(positionVariable, [
    positionVariable,
    velocityVariable,
  ]);

  positionUniforms = positionVariable.material.uniforms;
  velocityUniforms = velocityVariable.material.uniforms;

  positionUniforms["time"] = { value: 0.0 };
  positionUniforms["delta"] = { value: 0.0 };
  velocityUniforms["time"] = { value: 1.0 };
  velocityUniforms["delta"] = { value: 0.0 };
  velocityUniforms["testing"] = { value: 1.0 };
  velocityUniforms["separationDistance"] = { value: 1.0 };
  velocityUniforms["alignmentDistance"] = { value: 1.0 };
  velocityUniforms["cohesionDistance"] = { value: 1.0 };
  velocityUniforms["freedomFactor"] = { value: 1.0 };
  velocityUniforms["predator"] = { value: new Vector3() };
  velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed(2);

  velocityVariable.wrapS = RepeatWrapping;
  velocityVariable.wrapT = RepeatWrapping;
  positionVariable.wrapS = RepeatWrapping;
  positionVariable.wrapT = RepeatWrapping;

  const error = gpuCompute.init();

  if (error !== null) {
    console.error(error);
  }
}

function isSafari() {
  return (
    !!navigator.userAgent.match(/Safari/i) &&
    !navigator.userAgent.match(/Chrome/i)
  );
}

function initBirds(effectController) {
  const geometry = BirdGeometry;

  const m = new MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });

  m.onBeforeCompile = (shader) => {
    shader.uniforms.texturePosition = { value: null };
    shader.uniforms.textureVelocity = { value: null };
    shader.uniforms.textureAnimation = { value: textureAnimation };
    shader.uniforms.time = { value: 1.0 };
    shader.uniforms.size = { value: effectController.size };
    shader.uniforms.delta = { value: 0.0 };

    let token = "#define STANDARD";

    let insert = /* glsl */ `
						attribute vec4 reference;
						attribute vec4 seeds;
						attribute vec3 birdColor;
						uniform sampler2D texturePosition;
						uniform sampler2D textureVelocity;
						uniform sampler2D textureAnimation;
						uniform float size;
						uniform float time;
					`;

    shader.vertexShader = shader.vertexShader.replace(token, token + insert);

    token = "#include <begin_vertex>";

    insert = /* glsl */ `
						vec4 tmpPos = texture2D( texturePosition, reference.xy );

						vec3 pos = tmpPos.xyz;
						vec3 velocity = normalize(texture2D( textureVelocity, reference.xy ).xyz);
						vec3 aniPos = texture2D( textureAnimation, vec2( reference.z, mod( time + ( seeds.x ) * ( ( 0.0004 + seeds.y / 10000.0) + normalize( velocity ) / 20000.0 ), reference.w ) ) ).xyz;
						vec3 newPosition = position;

						newPosition = mat3( modelMatrix ) * ( newPosition + aniPos );
						newPosition *= size + seeds.y * size * 0.2;

						velocity.z *= -1.;
						float xz = length( velocity.xz );
						float xyz = 1.;
						float x = sqrt( 1. - velocity.y * velocity.y );

						float cosry = velocity.x / xz;
						float sinry = velocity.z / xz;

						float cosrz = x / xyz;
						float sinrz = velocity.y / xyz;

						mat3 maty =  mat3( cosry, 0, -sinry, 0    , 1, 0     , sinry, 0, cosry );
						mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0     , 0    , 1 );

						newPosition =  maty * matz * newPosition;
						newPosition += pos;

						vec3 transformed = vec3( newPosition );
					`;

    shader.vertexShader = shader.vertexShader.replace(token, insert);

    materialShader = shader;
  };

  birdMesh = new Mesh(geometry, m);
  birdMesh.rotation.y = Math.PI / 2;

  birdMesh.castShadow = true;
  birdMesh.receiveShadow = true;

  scene.add(birdMesh);
}

function fillPositionTexture(texture) {
  const theArray = texture.image.data;

  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    const x = Math.random() * BOUNDS - BOUNDS_HALF;
    const y = Math.random() * BOUNDS - BOUNDS_HALF;
    const z = Math.random() * BOUNDS - BOUNDS_HALF;

    theArray[k + 0] = x;
    theArray[k + 1] = y;
    theArray[k + 2] = z;
    theArray[k + 3] = 1;
  }
}

function fillVelocityTexture(texture) {
  const theArray = texture.image.data;

  for (let k = 0, kl = theArray.length; k < kl; k += 4) {
    const x = Math.random() - 0.5;
    const y = Math.random() - 0.5;
    const z = Math.random() - 0.5;

    theArray[k + 0] = x * 10;
    theArray[k + 1] = y * 10;
    theArray[k + 2] = z * 10;
    theArray[k + 3] = 1;
  }
}

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onPointerMove(event) {
  if (event.isPrimary === false) return;

  mouseX = event.clientX - windowHalfX;
  mouseY = event.clientY - windowHalfY;
}

//

function animate() {
  requestAnimationFrame(animate);

  render();
  stats.update();
}

function render() {
  const now = performance.now();
  let delta = (now - last) / 1000;

  if (delta > 1) delta = 1; // safety cap on large deltas
  last = now;

  positionUniforms["time"].value = now;
  positionUniforms["delta"].value = delta;
  velocityUniforms["time"].value = now;
  velocityUniforms["delta"].value = delta;
  if (materialShader) materialShader.uniforms["time"].value = now / 1000;
  if (materialShader) materialShader.uniforms["delta"].value = delta;

  velocityUniforms["predator"].value.set(
    (0.5 * mouseX) / windowHalfX,
    (-0.5 * mouseY) / windowHalfY,
    0
  );

  mouseX = 10000;
  mouseY = 10000;

  gpuCompute.compute();

  if (materialShader)
    materialShader.uniforms["texturePosition"].value =
      gpuCompute.getCurrentRenderTarget(positionVariable).texture;
  if (materialShader)
    materialShader.uniforms["textureVelocity"].value =
      gpuCompute.getCurrentRenderTarget(velocityVariable).texture;

  renderer.render(scene, camera);
}
