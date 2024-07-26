import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Model from './model.glb';
import Site3dThree from './site3d_dev';

// Функция для инициализации сцены
function initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x008B8B);
  return scene;
}

// Функция для инициализации камеры
function initCamera(sizes) {
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
  camera.position.set(0, 3, 1);
  return camera;
}

// Функция для добавления освещения в сцену
function addLights(scene) {
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(-3, -3, 1);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.1);
  directionalLight2.position.set(3, 3, -1);
  scene.add(directionalLight2);

  const pointLight = new THREE.PointLight(0xffffff, 3);
  pointLight.position.set(-5, -2, 2);
  scene.add(pointLight);
}

// Функция для инициализации рендерера
function initRenderer(sizes) {
  const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('.canvas') });
  renderer.setSize(sizes.width, sizes.height);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

// Функция для настройки контролов
function initControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.5;
  controls.maxDistance = 5;
  return controls;
}

// Функция для обработки загруженной модели
function handleLoadedModel(scene, model) {
  const site3d = new Site3dThree();

  // Трансформация родительского объекта
  model.position.set(0, 1, 0);
  model.rotation.set(Math.PI / 4, Math.PI / 4, Math.PI / 4);
  model.scale.set(1.5, 1.5, 1);

  // Опции для исключения мешей из списка трасформируемых
  const options = {
    exceptions: ['mesh1', 'mesh2', 'mesh3']
  };

  // Применение класса site3dThree
  site3d.object3dToBoundCenter(model, options);

  model.traverse((child) => {
    if (child.isMesh) {
      //apply transformations on
      child.geometry.applyMatrix4(child.matrixWorld);
      child.position.set(0, 0, 0);
      child.rotation.set(0, 0, 0);
      child.scale.set(1, 1, 1);
      child.updateMatrix();
      //off

      const material = child.material;
      if (material) {
        material.color = new THREE.Color(0xE0FFFF);
        material.needsUpdate = true;
        material.side = THREE.DoubleSide;
        material.flatShading = false;
      }
    }
  });

  // Обновляем BoxHelpers после начальной настройки модели
  site3d.updateBoxHelpers();

  scene.add(model);
}

// Функция для анимации
function animate(renderer, scene, camera, controls, site3d) {
  const animateFrame = () => {
    requestAnimationFrame(animateFrame);
    controls.update();
    site3d.updateBoxHelpers(); // Обновляем BoxHelpers на каждом кадре
    renderer.render(scene, camera);
  };
  animateFrame();
}

// Основной код
const sizes = { width: 1200, height: 920 };
const scene = initScene();
const camera = initCamera(sizes);
scene.add(camera);
addLights(scene);
const renderer = initRenderer(sizes);
const controls = initControls(camera, renderer);

// Загрузка GLB файла
const loader = new GLTFLoader();
loader.load(
  Model,
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    handleLoadedModel(scene, model);
    animate(renderer, scene, camera, controls, new Site3dThree());
  },
  (xhr) => {
    console.log(`${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
  },
  (error) => {
    console.error('An error occurred during model loading:', error);
  }
);

// Начальный рендеринг сцены
renderer.render(scene, camera);