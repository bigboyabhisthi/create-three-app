//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  ShaderChunk,
  DataTexture,
  RGBAFormat,
  FloatType,
  Vector3,
  PerspectiveCamera,
  Scene,
  Color,
  WebGLRenderer,
  NoToneMapping,
  WebGLRenderTarget,
  AmbientLight,
  PointLight,
  Vector2,
  SphereGeometry,
  Group,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Mesh,
  FrontSide,
  DoubleSide,
  MeshBasicMaterial,
} from "three";

import Stats from "three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Simple form of tiled forward lighting
// using texels as bitmasks of 32 lights

const RADIUS = 75;

ShaderChunk["lights_pars_begin"] += [
  "",
  "#if defined TILED_FORWARD",
  "uniform vec4 tileData;",
  "uniform sampler2D tileTexture;",
  "uniform sampler2D lightTexture;",
  "#endif",
].join("\n");

ShaderChunk["lights_fragment_end"] += [
  "",
  "#if defined TILED_FORWARD",
  "vec2 tUv = floor(gl_FragCoord.xy / tileData.xy * 32.) / 32. + tileData.zw;",
  "vec4 tile = texture2D(tileTexture, tUv);",
  "for (int i=0; i < 4; i++) {",
  "	float tileVal = tile.x * 255.;",
  "  	tile.xyzw = tile.yzwx;",
  "	if(tileVal == 0.){ continue; }",
  "  	float tileDiv = 128.;",
  "	for (int j=0; j < 8; j++) {",
  "  		if (tileVal < tileDiv) {  tileDiv *= 0.5; continue; }",
  "		tileVal -= tileDiv;",
  "		tileDiv *= 0.5;",
  "  		PointLight pointlight;",
  "		float uvx = (float(8 * i + j) + 0.5) / 32.;",
  "  		vec4 lightData = texture2D(lightTexture, vec2(uvx, 0.));",
  "  		vec4 lightColor = texture2D(lightTexture, vec2(uvx, 1.));",
  "  		pointlight.position = lightData.xyz;",
  "  		pointlight.distance = lightData.w;",
  "  		pointlight.color = lightColor.rgb;",
  "  		pointlight.decay = lightColor.a;",
  "  		getPointLightInfo( pointlight, geometry, directLight );",
  "		RE_Direct( directLight, geometry, material, reflectedLight );",
  "	}",
  "}",
  "#endif",
].join("\n");

const lights = [];

const State = {
  rows: 0,
  cols: 0,
  width: 0,
  height: 0,
  tileData: { value: null },
  tileTexture: { value: null },
  lightTexture: {
    value: new DataTexture(
      new Float32Array(32 * 2 * 4),
      32,
      2,
      RGBAFormat,
      FloatType
    ),
  },
};

function resizeTiles() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  State.width = width;
  State.height = height;
  State.cols = Math.ceil(width / 32);
  State.rows = Math.ceil(height / 32);
  State.tileData.value = [
    width,
    height,
    0.5 / Math.ceil(width / 32),
    0.5 / Math.ceil(height / 32),
  ];
  State.tileTexture.value = new DataTexture(
    new Uint8Array(State.cols * State.rows * 4),
    State.cols,
    State.rows
  );
}

// Generate the light bitmasks and store them in the tile texture
function tileLights(renderer, scene, camera) {
  if (!camera.projectionMatrix) return;

  const d = State.tileTexture.value.image.data;
  const ld = State.lightTexture.value.image.data;

  const viewMatrix = camera.matrixWorldInverse;

  d.fill(0);

  const vector = new Vector3();

  lights.forEach(function (light, index) {
    vector.setFromMatrixPosition(light.matrixWorld);

    const bs = lightBounds(camera, vector, light._light.radius);

    vector.applyMatrix4(viewMatrix);
    vector.toArray(ld, 4 * index);
    ld[4 * index + 3] = light._light.radius;
    light._light.color.toArray(ld, 32 * 4 + 4 * index);
    ld[32 * 4 + 4 * index + 3] = light._light.decay;

    if (bs[1] < 0 || bs[0] > State.width || bs[3] < 0 || bs[2] > State.height)
      return;
    if (bs[0] < 0) bs[0] = 0;
    if (bs[1] > State.width) bs[1] = State.width;
    if (bs[2] < 0) bs[2] = 0;
    if (bs[3] > State.height) bs[3] = State.height;

    const i4 = Math.floor(index / 8),
      i8 = 7 - (index % 8);

    for (let i = Math.floor(bs[2] / 32); i <= Math.ceil(bs[3] / 32); i++) {
      for (let j = Math.floor(bs[0] / 32); j <= Math.ceil(bs[1] / 32); j++) {
        d[(State.cols * i + j) * 4 + i4] |= 1 << i8;
      }
    }
  });

  State.tileTexture.value.needsUpdate = true;
  State.lightTexture.value.needsUpdate = true;
}

// Screen rectangle bounds from light sphere's world AABB
const lightBounds = (function () {
  const v = new Vector3();
  return function (camera, pos, r) {
    let minX = State.width,
      maxX = 0,
      minY = State.height,
      maxY = 0;
    const hw = State.width / 2,
      hh = State.height / 2;

    for (let i = 0; i < 8; i++) {
      v.copy(pos);
      v.x += i & 1 ? r : -r;
      v.y += i & 2 ? r : -r;
      v.z += i & 4 ? r : -r;
      const vector = v.project(camera);
      const x = vector.x * hw + hw;
      const y = vector.y * hh + hh;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    return [minX, maxX, minY, maxY];
  };
})();

// Rendering

const container = document.createElement("div");
document.body.appendChild(container);
const camera = new PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  1,
  2000
);
camera.position.set(0.0, 0.0, 240.0);
const scene = new Scene();
scene.background = new Color(0x111111);

const renderer = new WebGLRenderer();
renderer.toneMapping = NoToneMapping;
container.appendChild(renderer.domElement);

const renderTarget = new WebGLRenderTarget();

scene.add(new AmbientLight(0xffffff, 0.33));
// At least one regular Pointlight is needed to activate light support
scene.add(new PointLight(0xff0000, 0.1, 0.1));

const bloom = new UnrealBloomPass(
  new Vector2(window.innerWidth, window.innerHeight),
  0.8,
  0.6,
  0.8
);
bloom.renderToScreen = true;

const stats = new Stats();
container.appendChild(stats.dom);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 120;
controls.maxDistance = 320;

const materials = [];

const Heads = [
  {
    type: "physical",
    uniforms: { diffuse: 0x888888, metalness: 1.0, roughness: 0.66 },
    defines: {},
  },
  {
    type: "standard",
    uniforms: { diffuse: 0x666666, metalness: 0.1, roughness: 0.33 },
    defines: {},
  },
  {
    type: "phong",
    uniforms: { diffuse: 0x777777, shininess: 20 },
    defines: {},
  },
  {
    type: "phong",
    uniforms: { diffuse: 0x555555, shininess: 10 },
    defines: { TOON: 1 },
  },
];

function init(geom) {
  const sphereGeom = new SphereGeometry(0.5, 32, 32);
  const tIndex = Math.round(Math.random() * 3);

  Object.keys(Heads).forEach(function (t, index) {
    let g = new Group();
    const conf = Heads[t];
    const ml = ShaderLib[conf.type];
    const mtl = new ShaderMaterial({
      lights: true,
      fragmentShader: ml.fragmentShader,
      vertexShader: ml.vertexShader,
      uniforms: UniformsUtils.clone(ml.uniforms),
      defines: conf.defines,
      transparent: tIndex === index ? true : false,
    });

    mtl.extensions.derivatives = true;

    mtl.uniforms["opacity"].value = tIndex === index ? 0.9 : 1;
    mtl.uniforms["tileData"] = State.tileData;
    mtl.uniforms["tileTexture"] = State.tileTexture;
    mtl.uniforms["lightTexture"] = State.lightTexture;

    for (const u in conf.uniforms) {
      const vu = conf.uniforms[u];

      if (mtl.uniforms[u].value.set) {
        mtl.uniforms[u].value.set(vu);
      } else {
        mtl.uniforms[u].value = vu;
      }
    }

    mtl.defines["TILED_FORWARD"] = 1;
    materials.push(mtl);

    const obj = new Mesh(geom, mtl);
    obj.position.y = -37;
    mtl.side = tIndex === index ? FrontSide : DoubleSide;

    g.rotation.y = (index * Math.PI) / 2;
    g.position.x = Math.sin((index * Math.PI) / 2) * RADIUS;
    g.position.z = Math.cos((index * Math.PI) / 2) * RADIUS;
    g.add(obj);

    for (let i = 0; i < 8; i++) {
      const color = new Color().setHSL(Math.random(), 1.0, 0.5);
      const l = new Group();

      l.add(
        new Mesh(
          sphereGeom,
          new MeshBasicMaterial({
            color: color,
          })
        )
      );

      l.add(
        new Mesh(
          sphereGeom,
          new MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.033,
          })
        )
      );

      l.children[1].scale.set(6.66, 6.66, 6.66);

      l._light = {
        color: color,
        radius: RADIUS,
        decay: 1,
        sy: Math.random(),
        sr: Math.random(),
        sc: Math.random(),
        py: Math.random() * Math.PI,
        pr: Math.random() * Math.PI,
        pc: Math.random() * Math.PI,
        dir: Math.random() > 0.5 ? 1 : -1,
      };

      lights.push(l);
      g.add(l);
    }

    scene.add(g);
  });
}

function update(now) {
  lights.forEach(function (l) {
    const ld = l._light;
    const radius = 0.8 + 0.2 * Math.sin(ld.pr + (0.6 + 0.3 * ld.sr) * now);
    l.position.x =
      Math.sin(ld.pc + (0.8 + 0.2 * ld.sc) * now * ld.dir) * radius * RADIUS;
    l.position.z =
      Math.cos(ld.pc + (0.8 + 0.2 * ld.sc) * now * ld.dir) * radius * RADIUS;
    l.position.y = Math.sin(ld.py + (0.8 + 0.2 * ld.sy) * now) * radius * 32;
  });
}

function onWindowResize() {
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderTarget.setSize(window.innerWidth, window.innerHeight);
  bloom.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  resizeTiles();
}

function postEffect(renderer) {
  bloom.render(renderer, null, renderTarget);
}

scene.onBeforeRender = tileLights;

scene.onAfterRender = postEffect;

const loader = new OBJLoader();

loader.load("models/obj/walt/WaltHead.obj", function (object) {
  const geometry = object.children[0].geometry;

  window.addEventListener("resize", onWindowResize);

  init(geometry);
  onWindowResize();

  renderer.setAnimationLoop(function (time) {
    update(time / 1000);
    stats.begin();
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    stats.end();
  });
});
