import * as THREE from 'three';

/**
 Класс операций над объектами three.js
 @class Site3dThree
 @constructor
 @param    {Scene} scene    Объект сцены
 */
class Site3dThree {

  constructor() {
    this.boxHelpers = [];  // массив для BoxHelpers
  }

  /**
   Метод возвращает массив мешей объекта three.js
   @method getObject3dMeshes
   @param     {Object3D} object3d    Объект three.js
   @param     {object} options       Дополнительные параметры:
   - exceptions - массив имен мешей для исключения
   @return    {Mesh[]}               Массив мешей
   */

  /*извлечь все меши из любого объекта three.js, исключая указанные в опциях */
  getObject3dMeshes(object3d, options = undefined) {
    if (object3d.isMesh) {
      return [object3d];
    }

    const exceptions = options?.exceptions ?? [];
    const result = [];

    object3d.traverse(child => {
      /* Если объект является мешем и не найден в списке исключений */
      if (child.isMesh && exceptions.find(name => name === child.name) === undefined) {
        /* добавить в массив результатов */
        result.push(child);
      }
    });

    return result;
  }

  /**
   Метод устанавливает позицию объекта three.js в его геометрическом центре
   @method object3dToBoundCenter
   @param    {Object3D} object3d    Объект three.js
   @param    {object} options       Дополнительные параметры
   */
  object3dToBoundCenter(object3D, options = undefined) {
    const meshes = this.getObject3dMeshes(object3D, options ? options : undefined);

    // Замена метода чтобы обработать меши второго и последующих вложенных уровней
    object3D.traverse((child) => {
      if (child.isMesh && meshes.includes(child)) {
        this.meshToBoundCenter(child);
        this.addBoxHelper(child); // Добавляем BoxHelper
      }
    });
  }

  /**
   Метод инициализирует начальные параметры меша
   @method meshInitParams
   @param    {Mesh} mesh   Клонируемые меши
   */
  meshInitParams(mesh) {
    /*сохранить первоначальную позицию объекта в данных пользователя объекта */
    mesh.userData.initParams = {
      position: mesh.position.clone(),
      scale: mesh.scale.clone(),
      rotation: mesh.rotation.clone()
    };
  }

  /**
   Метод устанавливает позицию меша в его геометрическом центре
   @method meshToBoundCenter
   @param     {Mesh} mesh         Меш
   @param     {object} options    Дополнительные параметры
   @return    {Vector3}           Новая позиция меша
   */

  meshToBoundCenter(mesh, options = undefined) {
    // Проверка skinned meshes
    if (mesh.isSkinnedMesh || mesh.userData.isBoundCenter === true) {
      return mesh.position;
    }

    // Сохранение начальных параметров
    this.meshInitParams(mesh);

    // Извлечение geometry для облегчения веса переменной
    const geometry = mesh.geometry;

    // Создание вектора для хранения центра
    const center = new THREE.Vector3();

    // Вычисление bounding box
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox;

    // Вычисление центра bounding box
    if (boundingBox) {
      boundingBox.getCenter(center);
    }

    // Центрирование geometry
    geometry.center();

    // Применение позиции к мешу
    const offset = center.clone().applyMatrix4(mesh.matrixWorld);
    mesh.position.copy(offset);

    // Обновление матрицы
    mesh.updateMatrixWorld(true);

    // Отметка о применении центрирования
    mesh.userData.isBoundCenter = true;

    // Сохранение обновленных параметров
    this.meshInitParams(mesh);

    return center;
  }

  /**
   Метод для добавления BoxHelper к мешу
   @method addBoxHelper
   @param    {Mesh} mesh   Меш
   */
  addBoxHelper(mesh) {
    const boxHelper = new THREE.BoxHelper(mesh, 0xffff00);
    this.boxHelpers.push(boxHelper);
    mesh.parent.add(boxHelper);
  }

  /**
   Метод для обновления всех BoxHelper в сцене
   @method updateBoxHelpers
   */
  updateBoxHelpers() {
    this.boxHelpers.forEach(helper => {
      helper.update();
    });
  }
}

export default Site3dThree;
