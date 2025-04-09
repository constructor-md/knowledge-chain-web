<template>
  <!-- 用于渲染 Three.js 场景的容器，通过 ref 属性关联到 JavaScript 中的 canvasContainer 变量 -->
  <div ref="canvasContainer" class="canvas-container"></div>
  <!-- 保存按钮，位于右上角，设置为透明背景和白色文字 -->
  <button v-if="positionChange" @click="saveData" class="save-button">保存修改</button>
  <!-- 右键菜单，showContextMenu 的值决定是否显示，通过样式绑定动态设置位置 -->
  <div
    v-if="showContextMenu"
    class="context-menu"
    :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
  >
    <button @click="handleContextMenuAction('add')">新增</button>
    <button @click="handleContextMenuAction('edit')">编辑</button>
    <button @click="handleContextMenuAction('delete')">删除</button>
  </div>

  <MarkdownModal v-if="showMarkdownModal" :ballId="selectedBallId" @close="closeMarkdownModal" />

  <EditModal
    v-if="showEditModal"
    :ballId="selectedBallId"
    :ballTitle="selectedBallTitle"
    @close="closeEditModal"
    @save="saveEdit"
  />

  <DeleteConfirmModal
    v-if="showDeleteConfirmModal"
    :ballId="selectedBallId"
    :ballTitle="selectedBallTitle"
    @close="closeDeleteConfirmModal"
    @confirm="confirmDelete"
  />
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
// 导入 Three.js 库的所有内容
import * as THREE from 'three'
// 导入 Three.js 的 DragControls 插件，用于实现小球的拖动交互
import { DragControls } from 'three/addons/controls/DragControls.js'
// 导入 Three.js 的 OrbitControls 插件，用于实现相机的轨道控制
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// 导入 Three.js 的 FontLoader 插件，用于加载字体
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
// 导入自定义的编辑弹框组件
import EditModal from './EditModal.vue'
// 导入自定义的删除确认弹框组件
import DeleteConfirmModal from './DeleteConfirmModal.vue'
// 引入 Markdown 弹框组件
import MarkdownModal from './MarkdownModal.vue'

/**
 * 父组件传入数据
 */
const props = defineProps({
  kId: {
    type: [String, Number],
    default: 0,
  },
})

//-------------------------------------------全局数据管理-------------------------------------------------------
// 从接口获取的小球数据，包含每个小球的 ID、标题、初始位置
let ballData = new Map([
  ['1111', { title: '小球1', x: 0, y: 0, z: 0 }],
  ['2222', { title: '小球2', x: 1, y: 1, z: 1 }],
  ['3333', { title: '小球3', x: -1, y: -1, z: -1 }],
  ['4444', { title: '小球4', x: -3, y: -1, z: -1 }],
])
// 从接口获取的连接数据，定义了哪些小球之间需要连接
const connectionsData = ref([
  ['1111', '2222'],
  ['2222', '3333'],
  ['4444', '2222'],
])
// 从接口获取的高亮连接数据，定义了哪些连接需要高亮显示
const highlightedConnectionsData = ref([['1111', '2222']])

// 创建响应式变量，用于存储右键菜单的 x 坐标
const contextMenuX = ref(0)
// 创建响应式变量，用于存储右键菜单的 y 坐标
const contextMenuY = ref(0)
// 创建响应式变量，用于存储选中小球的 ID
const selectedBallId = ref(null)
// 创建响应式变量，用于存储选中小球的标题
const selectedBallTitle = ref('')

// 清除场景内容 但场景仍旧是初始化的 清除后不用重复初始化
function clearScene() {
  // 暂停动画 以免动画仍在访问被清除的场景元素
  isAnimating.value = false
  // 从场景中移除所有小球
  Array.from(balls.values()).forEach((ball) => scene.remove(ball))
  balls.clear()
  // 从场景中移除所有连接线条
  lines.forEach((line) => scene.remove(line))
  lines.length = 0
  // 从场景中移除所有文本精灵
  Array.from(texts.values()).forEach((text) => scene.remove(text))
  texts.clear()
  // 清楚小球的拖拽控制器 避免其仍持有被释放的小球对象
  if (controls) {
    controls.dispose()
    controls = null // 清空引用
  }
}

// 记录小球位置变化的函数
function recordBallPosition() {
  // 遍历 ballData 数据
  ballData.forEach((ballInfo, id) => {
    // 获取当前id对应的小球对象
    const ball = balls.get(id)
    // 更新 ballData 中对应小球的位置
    ballInfo.x = ball.position.x
    ballInfo.y = ball.position.y
    ballInfo.z = ball.position.z
  })
}

//---------------------------------------组件生命周期钩子-----------------------------------------------------------

// 组件挂载时执行的钩子函数
onMounted(() => {
  // 初始化场景
  initScene()
  // 绘制元素
  draw()
})


//---------------------------------------绘图相关方法-----------------------------------------------------------
// kId变化时触发重绘
const redraw = () => {
  // 请求获取最新知识库数据
  ballData = new Map([
    ['1111', { title: 'newBall11', x: 0, y: 7, z: 0 }],
    ['2222', { title: 'newBall22', x: 2, y: 1, z: 1 }],
    ['3333', { title: 'newBall33', x: -1, y: -6, z: -1 }],
    ['4444', { title: 'newBall44', x: -3, y: -4, z: -1 }],
  ])
  // 清除现有的场景内容
  clearScene()
  // 根据新的 ballData 重新创建小球、连接线条和文本
  draw()
}

// 监听外部传入的kId的变化 触发获取数据和重绘
watch(() => props.kId, redraw)

// 存放3D场景的容器
const canvasContainer = ref(null)
// 声明 场景，相机和渲染器
let scene, camera, renderer

// 3D小球元素Map id-ball
const balls = new Map()
// 3D 线条元素数组
const lines = []
// 3D 文本元素Map id-text
const texts = new Map()

// 拖动控制对象和轨道控制对象，用于实现小球的拖动和相机的控制
let controls, orbitControls
// 创建射线投射器，用于检测鼠标点击的对象
let raycaster = new THREE.Raycaster()
// 创建鼠标位置向量，用于存储鼠标在标准化设备坐标中的位置
let mouse = new THREE.Vector2()

// 初始化 Three.js 场景
function initScene() {
  // 创建一个新的 Three.js 场景对象
  scene = new THREE.Scene()
  // 添加聚光灯
  const spotLight = new THREE.SpotLight(0xffffff, 1)
  // 调整聚光灯位置到场景中心上方
  spotLight.position.set(0, 5, 0)
  // 增大角度以扩大照射范围
  spotLight.angle = Math.PI / 2
  // 减小衰减值，让光线在远距离也能保持强度
  spotLight.decay = 0.5
  // 增加有效距离
  spotLight.distance = 100
  spotLight.penumbra = 0.2
  spotLight.castShadow = true
  scene.add(spotLight)
  // 创建环境光，照亮整个场景，设置颜色和强度
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  // 将环境光添加到场景中
  scene.add(ambientLight)
  // 创建点光源，提供局部照明，设置颜色、强度和位置
  const pointLight = new THREE.PointLight(0xffffff, 1.2)
  pointLight.position.set(5, 5, 5)
  // 开启点光源的阴影投射功能
  pointLight.castShadow = true
  // 设置阴影映射的分辨率
  pointLight.shadow.mapSize.width = 2048
  pointLight.shadow.mapSize.height = 2048
  // 设置阴影相机的近裁剪面
  pointLight.shadow.camera.near = 0.1
  // 设置阴影相机的远裁剪面
  pointLight.shadow.camera.far = 20
  // 将点光源添加到场景中
  scene.add(pointLight)
  // 创建透视相机，设置视角、宽高比、近裁剪面和远裁剪面
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  // 设置相机的初始位置
  camera.position.z = 5
  // 创建 WebGL 渲染器，开启抗锯齿功能，背景透明
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true,
  })
  // 设置渲染器的大小为窗口的大小
  renderer.setSize(window.innerWidth, window.innerHeight)
  // 开启渲染器的阴影映射功能
  renderer.shadowMap.enabled = true
  // 设置阴影映射的类型为 PCF 软阴影
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  // 将渲染器的 DOM 元素添加到 canvas 容器中
  canvasContainer.value.appendChild(renderer.domElement)
  // 创建轨道控制器，允许用户通过鼠标交互控制相机
  orbitControls = new OrbitControls(camera, renderer.domElement)
  // 开启阻尼效果，使相机运动更平滑
  orbitControls.enableDamping = true
  // 设置阻尼系数
  orbitControls.dampingFactor = 0.05
  // 禁用屏幕空间平移
  orbitControls.screenSpacePanning = false
  // 设置相机的最小距离
  orbitControls.minDistance = 1
  // 设置相机的最大距离
  orbitControls.maxDistance = 50
  // 设置相机的最小方位角
  orbitControls.minAzimuthAngle = -Infinity
  // 设置相机的最大方位角
  orbitControls.maxAzimuthAngle = Infinity
  // 禁用自动旋转
  orbitControls.autoRotate = false
  // 设置自动旋转速度
  orbitControls.autoRotateSpeed = 0
  // 设置旋转速度
  orbitControls.rotateSpeed = 1
  // 设置平移速度
  orbitControls.panSpeed = 1
  // 设置缩放速度
  orbitControls.zoomSpeed = 1
  // 启用旋转功能
  orbitControls.enableRotate = true
  // 启用平移功能
  orbitControls.enablePan = true
  // 启用缩放功能
  orbitControls.enableZoom = true
  // 禁用碰撞检测
  orbitControls.checkCollision = false
  // 监听轨道控制器的变化事件，当相机位置改变时更新连接线条和文本位置
  orbitControls.addEventListener('change', () => {
    updateConnections()
    updateAllTextPositions()
  })
}

// 场景事先初始化完毕，执行绘制
function draw() {
  const loader = new FontLoader()
  // 在字体加载成功的回调中初始化场景中的元素
  loader.load('/YouYuan_Regular.json', (font) => {
    // 暂停动画
    isAnimating.value = false
    // 创建小球
    createBalls()
    // 创建连接线条
    createConnections()
    // 绑定拖动控制器
    rebindDragControls()
    // 元素创建完毕 开启动画
    // 暂停动画
    isAnimating.value = true
    setTimeout(() => {
      // 启动动画循环
      animate()
    }, 0)
  })
}

// 根据ballData创建小球
function createBalls() {
  // 创建小球的几何体，增加分段数以提高清晰度
  const geometry = new THREE.SphereGeometry(0.1, 128, 128)
  // 创建小球的材质，设置颜色、粗糙度和金属度
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.8,
    metalness: 0.2,
  })
  // 遍历 ballData，为每个数据创建一个小球
  ballData.forEach((ballInfo, id) => {
    // 创建小球网格对象，将几何体和材质组合
    const ball = new THREE.Mesh(geometry, material)
    // 开启小球的阴影投射功能
    ball.castShadow = true
    // 开启小球的阴影接收功能
    ball.receiveShadow = true
    // 设置小球的位置
    ball.position.set(ballInfo.x, ballInfo.y, ballInfo.z)
    // 为小球添加用户数据，存储其 ID、标题和初始位置
    ball.userData = {
      id: id,
      title: ballInfo.title,
      initialPosition: ball.position.clone(),
    }
    // 将小球添加到场景中
    scene.add(ball)
    // 将小球添加到 balls Map中 索引为id
    balls.set(id, ball)

    // 创建文本精灵材质
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const fontSize = 64 // 增大字体大小以提高分辨率
    ctx.font = `bold ${fontSize}px Arial`
    const textWidth = ctx.measureText(ballInfo.title).width
    // 适当增加 canvas 高度以避免文本截断
    canvas.width = textWidth
    canvas.height = fontSize * 1.2
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(ballInfo.title, 0, fontSize * 0.6)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)

    // 调整文本精灵的大小
    sprite.scale.set((0.05 * textWidth) / fontSize, 0.05 * 1.2, 1) // 相应调整缩放比例

    // 将文本精灵添加到场景中
    scene.add(sprite)
    // 将文本精灵添加到 texts 数组中
    texts.set(id, sprite)

    // 文本对齐
    updateTextSymmetry(ball, sprite)
  })
}

// 根据connections创建连接线条
function createConnections() {
  // 遍历 connectionsData 数组，为每对小球创建连接线条
  connectionsData.value.forEach(([startId, endId]) => {
    // 获取起始小球
    const startBall = balls.get(startId)
    // 获取结束小球
    const endBall = balls.get(endId)
    // 判断该连接是否需要高亮显示
    const isHighlighted = highlightedConnectionsData.value.some(
      ([hStart, hEnd]) =>
        (hStart === startId && hEnd === endId) || (hStart === endId && hEnd === startId),
    )
    // 根据是否高亮选择线条的材质颜色
    const material = new THREE.LineBasicMaterial({
      color: isHighlighted ? 0xff0000 : 0xffffff,
    })
    // 直接使用两个小球的位置创建直线
    const points = [startBall.position, endBall.position]
    // 创建线条的几何体
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    // 创建线条对象
    const line = new THREE.Line(geometry, material)
    // 将线条添加到场景中
    scene.add(line)
    // 将线条添加到 lines 数组中
    lines.push(line)
  })
}

// 重新绑定 DragControls
// 有新的小球需要加入控制，就要重新绑定所有小球拖动
// 重新绑定 DragControls
// 有新的小球需要加入控制，就要重新绑定所有小球拖动
function rebindDragControls() {
  const allBalls = Array.from(balls.values());

  // 释放旧的 DragControls
  if (controls) {
    controls.dispose();
  }

  // 创建新的 DragControls
  controls = new DragControls(allBalls, camera, renderer.domElement);

  controls.addEventListener('dragstart', (event) => {
    // 记录小球的初始位置
    event.object.userData.initialPosition = event.object.position.clone();
    // 禁用轨道控制器
    orbitControls.enabled = false;
  });

  controls.addEventListener('drag', (event) => {
    const ball = event.object;
    const initialPosition = ball.userData.initialPosition;
    // 计算当前位置和初始位置的偏移量
    const delta = ball.position.clone().sub(initialPosition);
    if (delta.length() > 0) { // 检查偏移量是否不为零
      // 更新小球的位置
      ball.position.copy(initialPosition).add(delta);
      // 更新连接线条
      updateConnections();
      // 更新文本位置
      updateAllTextPositions();
      // 记录小球位置变化
      recordBallPosition();
      // 小球被拖动，就显示位置改变 寻求保存的按钮
      positionChange.value = true;
    }
  });

  controls.addEventListener('dragend', (event) => {
    // 启用轨道控制器
    orbitControls.enabled = true;
    // 重新计算聚光灯位置和角度以覆盖所有小球
    const center = new THREE.Vector3();
    Array.from(balls.values()).forEach((ball) => {
      center.add(ball.position);
    });
    center.divideScalar(balls.size);

    const spotLight = scene.getObjectByName('spotLight');
    if (spotLight) {
      spotLight.position.copy(center).add(new THREE.Vector3(0, 5, 0));
    }
  });
}

//---------------------------------------3D元素鼠标交互-----------------------------------------------------------
// 控制右键菜单的显示与隐藏
const showContextMenu = ref(false)
// 小球上鼠标右键打开菜单
function onMouseRightClick(event) {
  // 阻止事件冒泡
  event.stopPropagation()
  // 阻止默认的右键菜单行为
  event.preventDefault()
  // 计算鼠标在标准化设备坐标中的位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  // 根据鼠标位置更新射线投射器
  raycaster.setFromCamera(mouse, camera)
  // 获取射线与小球的交点
  const intersects = raycaster.intersectObjects(Array.from(balls.values()))
  if (intersects.length > 0) {
    // 获取选中的小球
    const selectedBall = intersects[0].object
    console.log('selectedBall.userData', selectedBall.userData)
    // 获取选中小球的 ID
    selectedBallId.value = selectedBall.userData.id
    // 获取选中小球的标题
    selectedBallTitle.value = selectedBall.userData.title
    // 设置右键菜单的 x 坐标
    contextMenuX.value = event.clientX
    // 设置右键菜单的 y 坐标
    contextMenuY.value = event.clientY
    // 显示右键菜单
    showContextMenu.value = true
  }
  console.log('selectedBallId.value', selectedBallId.value)
  console.log('selectedBallTitle.value', selectedBallTitle.value)
}

window.addEventListener('contextmenu', onMouseRightClick)

// 小球以外的位置点击关闭右键菜单
const handleGlobalClick = (event) => {
  // 获取右键菜单dom
  const contextMenuElement = document.querySelector('.context-menu')
  // 如果右键菜单处于显示状态、获取到了右键菜单元素，且点击事件目标元素不在右键菜单内，就隐藏右键菜单
  if (showContextMenu.value && contextMenuElement && !contextMenuElement.contains(event.target)) {
    // 隐藏右键菜单
    showContextMenu.value = false
  }
}

window.addEventListener('click', handleGlobalClick)

// 右键菜单选项点击函数
function handleContextMenuAction(action) {
  // 隐藏右键菜单
  showContextMenu.value = false
  if (action === 'add') {
    // 显示编辑弹框，准备新增小球
    showEditModal.value = true
    // 清空选中小球的 ID
    selectedBallId.value = null
    // 清空选中小球的标题
    selectedBallTitle.value = ''
  } else if (action === 'edit') {
    // 显示编辑弹框，准备编辑选中的小球
    showEditModal.value = true
  } else if (action === 'delete') {
    // 显示删除确认弹框，准备删除选中的小球
    showDeleteConfirmModal.value = true
  }
}

// 小球上双击鼠标打开Markdown弹框
function onDoubleClick(event) {
  console.log('鼠标双击')
  // 计算鼠标在标准化设备坐标中的位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  // 根据鼠标位置更新射线投射器
  raycaster.setFromCamera(mouse, camera)
  // 获取射线与小球的交点
  const intersects = raycaster.intersectObjects(Array.from(balls.values()))
  if (intersects.length > 0) {
    // 获取选中的小球
    const selectedBall = intersects[0].object
    // 更新选中小球id，会单向传入组件中
    selectedBallId.value = selectedBall.userData.id
    // 显示 Markdown 弹框
    showMarkdownModal.value = true
  }
}

window.addEventListener('dblclick', onDoubleClick)

// ------------------------------------------组件交互-------------------------------------------------------

/**
 * 新建/编辑 弹框
 */
const showEditModal = ref(false)

// 保存
function saveEdit(newTitle) {
  console.log('selectedBallId.value', selectedBallId.value)
  // 编辑逻辑
  //    根据当前小球ID 获取ballData中小球对象，更新其中title
  //    获取小球元素，更新小球元素中的title
  //    获取对应的文本对象，更新文本对象的内容
  if (selectedBallId.value) {
    // 查找选中小球在 ballData 数组中的索引
    const ballInfo = ballData.get(selectedBallId.value)
    // 更新 ballData 中对应小球的标题
    ballInfo.title = newTitle
    // 获取对应的小球对象
    const ball = balls.get(selectedBallId.value)
    // 更新小球的用户数据中的标题
    ball.userData.title = newTitle
    // 获取对应的文本精灵
    const textSprite = texts.get(selectedBallId.value)

    // 更新文本精灵的内容
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const fontSize = 64
    ctx.font = `bold ${fontSize}px Arial`
    const textWidth = ctx.measureText(newTitle).width
    // 适当增加 canvas 高度以避免文本截断
    canvas.width = textWidth
    canvas.height = fontSize * 1.2
    ctx.font = `bold ${fontSize}px Arial`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'middle'
    ctx.fillText(newTitle, 0, fontSize * 0.6)

    textSprite.material.map = new THREE.CanvasTexture(canvas)
    textSprite.material.needsUpdate = true

    // 调整文本精灵的大小
    textSprite.scale.set((0.05 * textWidth) / fontSize, 0.05 * 1.2, 1)

    // 文本对齐
    updateTextSymmetry(ball, textSprite)
  } else {
    // 新建逻辑：
    //      创建新的小球对象 添加到ballData
    //      在字体加载的成功回调中，创建单一小球元素和title文本元素
    //      不定义链接关系

    let newBallData = { title: newTitle, x: 0, y: 0, z: 0 }
    // 将新的小球数据添加到 ballData 数组中
    ballData.set('' + Date.now(), newBallData)
    const loader = new FontLoader()
    loader.load('/YouYuan_Regular.json', (font) => {
      // 创建新小球的几何体
      const geometry = new THREE.SphereGeometry(0.1, 128, 128)
      // 创建新小球的材质
      const material = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.8,
        metalness: 0.2,
      })
      // 创建新小球的网格对象
      const ball = new THREE.Mesh(geometry, material)
      ball.castShadow = true
      ball.receiveShadow = true
      // 设置新小球的位置
      ball.position.set(newBallData.x, newBallData.y, newBallData.z)
      // 为新小球添加用户数据
      ball.userData = {
        id: newBallData.id,
        title: newBallData.title,
        initialPosition: ball.position.clone(),
      }
      // 将新小球添加到场景中
      scene.add(ball)
      // 将新小球添加到 balls 数组中
      balls.set(newBallData.id, ball)

      // 创建文本精灵材质
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const fontSize = 64
      ctx.font = `bold ${fontSize}px Arial`
      const textWidth = ctx.measureText(newBallData.title).width
      // 适当增加 canvas 高度以避免文本截断
      canvas.width = textWidth
      canvas.height = fontSize * 1.2
      ctx.font = `bold ${fontSize}px Arial`
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'middle'
      ctx.fillText(newBallData.title, 0, fontSize * 0.6)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(spriteMaterial)

      // 调整文本精灵的大小
      sprite.scale.set((0.05 * textWidth) / fontSize, 0.05 * 1.2, 1)

      // 将文本精灵添加到场景中
      scene.add(sprite)
      // 将文本精灵添加到 texts 数组中
      texts.set(newBallData.id, sprite)

      // 文本对齐
      updateTextSymmetry(ball, sprite)
      // 绑定拖动控制器
      rebindDragControls()
    })
  }
  // 隐藏编辑弹框
  showEditModal.value = false
}

// 关闭
function closeEditModal() {
  console.log('触发编辑弹框关闭')
  // 隐藏编辑弹框
  showEditModal.value = false
}

/**
 * 删除确认弹框
 */
// 控制删除确认弹框的显示与隐藏
const showDeleteConfirmModal = ref(false)

// 取消删除
function closeDeleteConfirmModal() {
  // 隐藏删除确认弹框
  showDeleteConfirmModal.value = false
}

// 确认删除
function confirmDelete() {
  // 获取选中的小球对象
  const ball = balls.get(selectedBallId.value)
  // 获取选中小球的 ID
  const ballId = ball.userData.id
  // 从场景中移除选中的小球
  scene.remove(ball)
  // 从 balls Map中移除选中的小球
  balls.delete(ballId)
  // 从 ballData 数组中移除选中的小球
  ballData.delete(ballId)

  // 创建新的连接数组
  const newConnections = []
  connectionsData.value.forEach(([start, end]) => {
    if (start !== ballId && end !== ballId) {
      newConnections.push([start, end])
    }
  })
  // 更新连接数组
  connectionsData.value = newConnections
  // 移除所有旧的连接线条
  lines.forEach((line) => scene.remove(line))
  lines.length = 0
  // 重新创建所有连接线条
  createConnections()
  // 获取对应的文本精灵
  const textSprite = texts.get(ballId)
  // 从场景中移除文本精灵
  scene.remove(textSprite)
  // 从 texts 数组中移除文本精灵
  texts.delete(ballId)
  // 隐藏删除确认弹框
  showDeleteConfirmModal.value = false
}

/**
 * Markdown弹框
 */
// 控制 Markdown 弹框的显示与隐藏
const showMarkdownModal = ref(false)

// Markdown关闭事件函数
function closeMarkdownModal() {
  showMarkdownModal.value = false
}

/**
 * 位置变化保存按钮
 */
// 控制位置变化保存按钮的显示和隐藏
const positionChange = ref(false)
const saveData = () => {}

// ------------------------------------------动画效果-------------------------------------------------------
// 控制动画循环是否执行
const isAnimating = ref(true)
// 动画循环函数，用于不断更新场景并渲染
function animate() {
  if (isAnimating) {
    // 请求下一帧动画
    requestAnimationFrame(animate)
    // 让所有小球旋转
    Array.from(balls.values()).forEach((ball) => {
      ball.rotation.x += 0.01
      ball.rotation.y += 0.01
    })
    // 更新连接线条
    updateConnections()
    // 更新文本位置
    updateAllTextPositions()
    // 更新轨道控制器
    orbitControls.update()
    // 渲染场景
    renderer.render(scene, camera)
  }
}

// 遍历 connectionsData 每一组关系
// 根据小球位置 更新连接线条的起始结束位置 和线条弧度
// 绑定在小球拖动事件、相机位置改变事件 上触发
// 并在动画循环和窗口大小变化 中触发
function updateConnections() {
  connectionsData.value.forEach(([startId, endId], index) => {
    // 获取起始小球
    const startBall = balls.get(startId)
    // 获取结束小球
    const endBall = balls.get(endId)
    if (startBall && endBall) {
      // 获取对应的线条对象
      const line = lines[index]
      // 直接使用两个小球的位置更新直线
      const points = [startBall.position, endBall.position]
      // 创建新的位置数组
      const positions = new Float32Array(points.length * 3)
      for (let i = 0; i < points.length; i++) {
        positions[i * 3] = points[i].x
        positions[i * 3 + 1] = points[i].y
        positions[i * 3 + 2] = points[i].z
      }
      // 更新线条的位置属性
      line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      line.geometry.attributes.position.needsUpdate = true
    }
  })
}

// 根据balls中小球的位置 更新所有文本位置
// 绑定在小球拖动事件 相机位置改变事件 上触发
// 并在动画循环和窗口大小变化 中触发
// 以及编辑小球tile文本后更新一下 -- 也许只有一些时候需要更新全部
function updateAllTextPositions() {
  // 遍All历所有小球
  balls.forEach((ball, id) => {
    // 获取当前小球对应的文本精灵
    const textSprite = texts.get(id)
    updateTextSymmetry(ball, textSprite)
  })
}

// 单一文本位置更新在小球上方中轴线位置
function updateTextSymmetry(ball, textSprite) {
  // 获取小球的几何体
  const geometry = ball.geometry
  // 设置文本精灵的位置，使其位于小球上方中轴线对称位置
  textSprite.position.set(
    ball.position.x,
    ball.position.y + geometry.parameters.radius + 0.1,
    ball.position.z,
  )
}

// 窗口大小自适应
window.addEventListener('resize', () => {
  // 更新相机的宽高比
  camera.aspect = window.innerWidth / window.innerHeight
  // 更新相机的投影矩阵
  camera.updateProjectionMatrix()
  // 更新渲染器的大小
  renderer.setSize(window.innerWidth, window.innerHeight)
  // 更新连接线条
  updateConnections()
  // 更新文本位置
  updateAllTextPositions()
})
</script>

<style lang="scss" scoped>
// 保存按钮
.save-button {
  position: absolute;
  top: 20px; /* 距离顶部 20px，增加与右上角的垂直间距 */
  right: 20px; /* 距离右侧 20px，增加与右上角的水平间距 */
  background-color: transparent;
  color: white;
  border: 2px solid white; /* 设置 2px 宽的白色边框 */
  padding: 8px 16px; /* 设置内边距，使按钮有一定的长宽 */
  cursor: pointer;
  font-size: 16px; /* 设置字体大小，让文字更显眼 */
  transition: all 0.3s ease; /* 添加过渡效果，使交互更平滑 */
  border-radius: 50px;
}

.save-button:hover {
  background-color: white; /* 鼠标悬停时，背景变为白色 */
  color: black; /* 鼠标悬停时，文字变为黑色 */
}
// 定义 canvas 容器的样式
.canvas-container {
  // 设置容器宽度为 100%
  width: 100%;
  // 设置容器高度为 100%
  height: 100%;
  // 移除容器的外边距
  margin: 0;
  // 隐藏溢出内容
  overflow: hidden;
  // 设置容器为相对定位
  position: relative;
  // 设置容器的层级为 0
  z-index: 0;
}

// 定义右键菜单的样式
.context-menu {
  // 设置菜单为绝对定位
  position: absolute;
  // 设置菜单的背景颜色为白色
  background-color: white;
  // 设置菜单的边框为 1 像素的灰色边框
  border: 1px solid #ccc;
  // 为菜单添加阴影效果
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  // 设置菜单的层级为 100
  z-index: 100;

  // 定义菜单内按钮的样式
  button {
    // 设置按钮为块级元素
    display: block;
    // 设置按钮宽度为 100%
    width: 100%;
    // 设置按钮的内边距
    padding: 8px 16px;
    // 移除按钮的边框
    border: none;
    // 设置按钮的背景颜色为透明
    background-color: transparent;
    // 设置按钮的文本左对齐
    text-align: left;
    // 设置按钮的鼠标指针为手型
    cursor: pointer;

    // 定义按钮悬停时的样式
    &:hover {
      // 设置按钮悬停时的背景颜色为浅灰色
      background-color: #f0f0f0;
    }
  }
}

// 新增下拉框样式
.custom-dropdown {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

// 设置下拉框选项样式
.custom-dropdown option {
  background-color: transparent;
  color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

/* 选中项样式 */
.custom-dropdown option:checked {
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 鼠标悬停项样式 */
.custom-dropdown option:hover {
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 针对 Firefox 浏览器设置选中和悬停状态 */
@-moz-document url-prefix() {
  .custom-dropdown option {
    background-color: transparent;
    color: #fff;
    -moz-appearance: none;
  }
  .custom-dropdown option:-moz-focusring {
    color: transparent;
    text-shadow: 0 0 0 #fff;
    background-color: rgba(0, 0, 0, 0.5);
    -moz-appearance: none;
  }
  .custom-dropdown option:checked {
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    -moz-appearance: none;
  }
  .custom-dropdown option:hover {
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    -moz-appearance: none;
  }
}

/* 针对 Chrome、Safari 等 WebKit 浏览器 */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .custom-dropdown option {
    background-color: transparent;
    color: #fff;
  }
  .custom-dropdown option:checked {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
    color: #fff;
  }
  .custom-dropdown option:hover {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
    color: #fff;
  }
}

/* 针对 Edge 浏览器设置选中和悬停状态 */
@supports (-ms-ime-align: auto) {
  .custom-dropdown option:checked {
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
  }
  .custom-dropdown option:hover {
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
  }
}
</style>
