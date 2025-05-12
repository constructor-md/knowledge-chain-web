<template>
  <main>
    <!-- 全局背景图片 -->
    <img src="/background.png" alt="背景图片" class="fullscreen-background" />
    <!-- 登录和注册组件 -->
    <LoginRegister v-if="notLogin" />
    <template v-else>
      <div class="dropdown-with-add">
        <CustomDropDown
          :options="dropdownOptions"
          :selectedValue="selectedValue"
          @optionChanged="handleOptionChanged"
          v-if="dropdownOptions.length > 0"
        />
        <div v-if="editAuth" class="add-button" @click="openCreateModal">
          <span class="plus-icon">+</span>
        </div>
      </div>
      <!-- 3D模块 -->
      <ThreeD :kId="selectedValue" />
    </template>
    <div v-if="isCreateModalOpen" class="modal">
      <div class="modal-content">
        <h2>知识库新建</h2>
        <input
          type="text"
          v-model="newKnowledgeBaseName"
          placeholder="输入知识库名称"
        />
        <button @click="createKnowledgeBase">新建</button>
        <button @click="closeCreateModal">取消</button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import ThreeD from '../components/ThreeD.vue'
import LoginRegister from '../components/LoginRegister.vue'
import CustomDropDown from "@/components/CustomDropDown.vue";
import {ref, onMounted, watchEffect} from 'vue'
import {setLogin, useAuthStore} from "@/stores/auth";
import {apiAddKnowLedgeBase, apiGetKnowLedgeBaseList} from '../api/api.js'

// 下拉框选中值 kId
const selectedValue = ref('');
// 下拉框内容
const dropdownOptions = ref([]);

// 新建知识库弹框控制
const isCreateModalOpen = ref(false);
// 输入框知识库名称双向绑定值
const newKnowledgeBaseName = ref('');

const handleOptionChanged = async (value:string) => {
  selectedValue.value = value;
}

// 登陆后才可显示具体内容，否则不显示
const notLogin = ref(true);
const authStore = useAuthStore();
// 开启监听 通过对状态变量的监听实现响应式同步页面效果
watchEffect(async () =>  {
  // 状态记录
  notLogin.value = !authStore.loginStatus;
  // 如果处于登陆状态 就查询下拉框并更新数据
  if (authStore.loginStatus) {
    await initDropdown()
  }
});

const initDropdown = async () => {
  // 查询知识库列表
  await getKnowLedgeBaseList()
  selectedValue.value = dropdownOptions.value[0].value
}

// 编辑权限
const editAuth = ref(false)
// 开启监听 通过对状态变量的监听实现响应式同步页面效果
watchEffect(() => {
  editAuth.value = authStore.authStatus;
});

const getKnowLedgeBaseList = async () => {
  let res = await apiGetKnowLedgeBaseList()
  dropdownOptions.value = res.data.map(
    item => {
      return {
        value: item.id,
        label: item.name
      }
    }
  )
}

// 打开创建知识库的模态框
const openCreateModal = () => {
  isCreateModalOpen.value = true;
};

// 关闭知识库模态框
const closeCreateModal = () => {
  // 清除输入数据
  newKnowledgeBaseName.value = '';
  isCreateModalOpen.value = false;
};

// 创建知识库按钮
const createKnowledgeBase = async () => {
  // 值校验
  if (newKnowledgeBaseName.value) {
    let res = await apiAddKnowLedgeBase(newKnowledgeBaseName.value)
    if (res.code === 200) {
      // 关闭新建框
      isCreateModalOpen.value = false;
      // 清理输入框数据
      newKnowledgeBaseName.value = '';
      // 知识库新建成功 刷新知识库列表 选中新建知识库
      let resList = await apiGetKnowLedgeBaseList()
      if (resList.code === 200) {
        // 查询知识库列表
        await getKnowLedgeBaseList()
        selectedValue.value = res.data
      }
    }
  }
};


onMounted(() => {
  // 存在token 就不登陆 如果响应拦截器发现登录过期 再触发登录框显示进行登录
  if (localStorage.getItem("token")) {
    setLogin()
  }
});
</script>

<style lang="scss" scoped>
.fullscreen-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

// 带有下拉框和加号的容器
.dropdown-with-add {
  position: fixed;
  top: 10px;
  left: 20px;
  z-index: 1;
  display: flex; /* 使用 flex 布局 */
  align-items: center; /* 垂直居中对齐 */
}

// 加号按钮
.add-button {
  background-color: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap; /* 防止文本换行 */
  margin-left: 10px; /* 与下拉框保持间距 */
  width: 25px;
  height: 25px;
}

// 加号文本
.plus-icon {
  font-size: 18px;
}

// 新建知识库的模态框
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

// 新建知识库模态框的内容
.modal-content {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 20px;
  color: #fff;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-bottom: 10px;
}

.modal-content input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal-content button {
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  border: 1px solid #fff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin: 0 5px;
}

.modal-content button:hover {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
