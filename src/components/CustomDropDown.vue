<template>
  <div class="custom-dropdown-container" @click.stop>
    <!-- 无内容时仅显示加号按钮 -->
    <div v-if="options.length === 0 && editAuth" class="add-button" @click="openCreateModal">
      <span class="plus-icon">+</span>
    </div>
    <!-- 有内容时显示下拉框和加号按钮 -->
    <div v-else class="dropdown-with-add">
      <!--   下拉框的选中展示部分 点击触发下拉框的展开和收起   -->
      <div class="custom-dropdown-trigger" @click.stop="toggleDropdown">
        <!--    展示当前选中项的label   -->
        {{ selectedOption.label }}
        <span class="dropdown-icon"></span>
      </div>
      <!--   下拉框展开部分 点击选项触发选中函数   -->
      <div v-show="isDropdownOpen" class="custom-dropdown-options">
        <div
          v-for="option in options"
          :key="option.value"
          :class="{ 'selected': option.value === selectedOption.value }"
          @click.stop="selectOption(option)"
        >
          {{ option.label }}
        </div>
      </div>
      <div v-if="editAuth" class="add-button" @click="openCreateModal">
        <span class="plus-icon">+</span>
      </div>
    </div>
    <!-- 新建知识库模态框 -->
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
  </div>
</template>

<script setup>
import {ref, defineProps, defineEmits, onMounted, onUnmounted, watch} from 'vue';
import {useAuthStore} from "@/stores/auth.js";

const props = defineProps({
  // 下拉框列表 [{label, value}]
  options: {
    type: Array,
    required: true,
    default:[]
  }
});

const emits = defineEmits(['optionChanged']);
// 当前选中项目 初始化为第一项 如果数据列表不存在，下拉框不会展示 而是展示加号提示增加内容
const selectedOption = ref(props.options[0]);
// 下拉框展开控制
const isDropdownOpen = ref(false);
// 新建知识库弹框控制
const isCreateModalOpen = ref(false);
// 输入框知识库名称双向绑定值
const newKnowledgeBaseName = ref('');
const authStore = useAuthStore();
// 编辑权限
const editAuth = ref(false)
// 开启监听 通过对状态变量的监听实现响应式同步页面效果
watch(() => authStore.authStatus, (newStatus) => {
  editAuth.value = newStatus;
});

// 下拉框展开状态置反
const toggleDropdown = () => {
  isDropdownOpen.value =!isDropdownOpen.value;
};

// 选中某项触发的函数
const selectOption = (option) => {
  // 更新当前选中项
  selectedOption.value = option;
  // 收起下拉框
  isDropdownOpen.value = false;
  // 将value传递给父组件 触发父组件函数 比如查询知识库数据并画图
  emits('optionChanged', option.value);
};

// 打开创建知识库的模态框
const openCreateModal = () => {
  isCreateModalOpen.value = true;
  // 打开模态框时关闭下拉框
  isDropdownOpen.value = false;
};

// 关闭知识库模态框
const closeCreateModal = () => {
  // 清除输入数据
  newKnowledgeBaseName.value = '';
  isCreateModalOpen.value = false;
};

// 创建知识库按钮
const createKnowledgeBase = () => {
  // 值校验
  if (newKnowledgeBaseName.value) {
    //  todo 执行新建知识库API 新建知识库API后端应该建立一个原始点


    // 新建接口返回成功后和新建知识库的ID
    // 调用刷新options接口
    // 指定返回的ID 即新建的知识库 为当前选中

    const newOption = {
      value: newKnowledgeBaseName.value,
      label: newKnowledgeBaseName.value
    };
    props.options.push(newOption);
    selectedOption.value = newOption;

    // 关闭新建框
    isCreateModalOpen.value = false;
    // 清理输入框数据
    newKnowledgeBaseName.value = '';
    // 触发父组件查询知识库数据并画图
    emits('optionChanged', newOption.value);
  }
};


// 全局点击事件函数
// 如果点击事件发生在组件之外，则关闭下拉框
const closeDropdownOnOutsideClick = (event) => {
  const container = document.querySelector('.custom-dropdown-container');
  if (container &&!container.contains(event.target)) {
    isDropdownOpen.value = false;
    isCreateModalOpen.value = false;
  }
};

onMounted(() => {
  // 注册全局点击事件
  window.addEventListener('click', closeDropdownOnOutsideClick);
});

onUnmounted(() => {

  // 卸载全局点击事件
  window.removeEventListener('click', closeDropdownOnOutsideClick);
});
</script>

<style scoped lang="scss">
// 下拉框容器
.custom-dropdown-container {
  position: absolute;
  top: 20px;
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
}

// 加号文本
.plus-icon {
  font-size: 18px;
}

// 带有下拉框和加号的容器
.dropdown-with-add {
  display: flex;
  align-items: center;
}

// 下拉框的展示部分
.custom-dropdown-trigger {
  background-color: transparent;
  border: 1px solid #fff;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  white-space: nowrap; /* 防止文本换行 */
}

// 下拉图标
.dropdown-icon {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #fff;
  margin-left: 8px;
}

// 下拉框下拉部分
.custom-dropdown-options {
  position: absolute;
  top: calc(100% + 5px); /* 调整下拉框位置，避免与加号按钮重叠 */
  left: 0;
  background-color: transparent;
  border: 1px solid #fff;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-sizing: border-box;
  white-space: nowrap; /* 防止文本换行 */
  min-width: 100%; /* 确保下拉框宽度不小于触发按钮 */
}

// 下拉框的下拉部分的选项
.custom-dropdown-options div {
  padding: 5px 10px;
  color: #fff;
  cursor: pointer;
}

.custom-dropdown-options div:hover,
.custom-dropdown-options div.selected {
  background-color: rgba(0, 0, 0, 0.5);
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
