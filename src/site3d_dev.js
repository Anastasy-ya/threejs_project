import * as THREE from 'three';

/**
 Класс операций над объектами three.js
 @class Site3dThree
 @constructor
 @param    {Scene} scene    Объект сцены
 */
class Site3dThree {
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
    const transformMatrix = new THREE.Matrix4();
    // object3D.updateMatrixWorld(true);
    transformMatrix.copy(object3D.matrixWorld);

    const meshes = this.getObject3dMeshes(object3D, options ? options : undefined);

    // Замена метода чтобы обработать меши второго и последующих вложенных уровней
    object3D.traverse((child) => {
        if (child.isMesh && meshes.includes(child)) {
            this.meshToBoundCenter(child, { transformMatrix });
        }
    });
}

  /**
   Метод инициализирует начальные параметры меша
   @method meshInitParams
   @param    {Mesh} mesh   Клонируемые меши
   */
  meshInitParams(mesh)
  /*сохранить первоначальную позицию объекта в данных пользователя объекта */ {
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
    const boundingBox = geometry.boundingBox;

    // Вычисление центра bounding box
    if (boundingBox) {
      boundingBox.getCenter(center);
      // boundingBox.update();//
    }

    // Центрирование geometry
    geometry.center();

    // Применение позиции к мешу
    mesh.position.copy(center);

    // Сохранение начальной позиции
    const initPosition = mesh.userData?.initParams?.position;
    if (initPosition) {
      mesh.position.add(initPosition);
    }

    // Отметка о применении центрирования
    mesh.userData.isBoundCenter = true;

    // Сохранение обновленных параметров
    this.meshInitParams(mesh);

    return center;
  }

}

export default Site3dThree