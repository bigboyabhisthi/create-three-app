//Shaders

undefined;

import "./style.css"; // For webpack support

import {
  NoToneMapping,
  LinearToneMapping,
  ReinhardToneMapping,
  CineonToneMapping,
  ACESFilmicToneMapping,
  CustomToneMapping,
  WebGLRenderer,
  sRGBEncoding,
  ShaderChunk,
  Scene,
  PerspectiveCamera,
  EquirectangularReflectionMapping,
} from "three";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

let mesh, renderer, scene, camera, controls;
let gui,
  guiExposure = null;

const params = {
  exposure: 1.0,
  toneMapping: "ACESFilmic",
};

const toneMappingOptions = {
  None: NoToneMapping,
  Linear: LinearToneMapping,
  Reinhard: ReinhardToneMapping,
  Cineon: CineonToneMapping,
  ACESFilmic: ACESFilmicToneMapping,
  Custom: CustomToneMapping,
};

init().catch(function (err) {
  console.error(err);
});

async function init() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.toneMapping = toneMappingOptions[params.toneMapping];
  renderer.toneMappingExposure = params.exposure;

  renderer.outputEncoding = sRGBEncoding;

  // Set CustomToneMapping to Uncharted2
  // source: http://filmicworlds.com/blog/filmic-tonemapping-operators/

  ShaderChunk.tonemapping_pars_fragment =
    ShaderChunk.tonemapping_pars_fragment.replace(
      "vec3 CustomToneMapping( vec3 color ) { return color; }",
      `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
					float toneMappingWhitePoint = 1.0;
					vec3 CustomToneMapping( vec3 color ) {
						color *= toneMappingExposure;
						return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
					}`
    );

  scene = new Scene();

  camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.25,
    20
  );
  camera.position.set(-1.8, 0.6, 2.7);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render); // use if there is no animation loop
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.target.set(0, 0, -0.2);
  controls.update();

  const rgbeLoader = new RGBELoader().setPath("textures/equirectangular/");

  const gltfLoader = new GLTFLoader().setPath(
    "models/gltf/DamagedHelmet/glTF/"
  );

  const [texture, gltf] = await Promise.all([
    rgbeLoader.loadAsync("venice_sunset_1k.hdr"),
    gltfLoader.loadAsync("DamagedHelmet.gltf"),
  ]);

  // environment

  texture.mapping = EquirectangularReflectionMapping;

  scene.background = texture;
  scene.environment = texture;

  // model

  gltf.scene.traverse(function (child) {
    if (child.isMesh) {
      mesh = child;
      scene.add(mesh);
    }
  });

  render();

  window.addEventListener("resize", onWindowResize);

  gui = new GUI();

  gui
    .add(params, "toneMapping", Object.keys(toneMappingOptions))

    .onChange(function () {
      updateGUI();

      renderer.toneMapping = toneMappingOptions[params.toneMapping];
      mesh.material.needsUpdate = true;
      render();
    });

  updateGUI();

  gui.open();
}

function updateGUI() {
  if (guiExposure !== null) {
    gui.remove(guiExposure);
    guiExposure = null;
  }

  if (params.toneMapping !== "None") {
    guiExposure = gui
      .add(params, "exposure", 0, 2)

      .onChange(function () {
        renderer.toneMappingExposure = params.exposure;
        render();
      });
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}
