<template>
  <div class="custom-dropdown-container">
    <!--   下拉框的选中展示部分 点击触发下拉框的展开和收起   -->
    <div class="custom-dropdown-trigger" @click.stop="toggleDropdown">
      <!--    展示当前选中项的label   -->
      <div class="dropdown-text">{{ selectedOption?.label }}</div>
      <span class="dropdown-icon"></span>
    </div>
    <!--   下拉框展开部分 点击选项触发选中函数   -->
    <div v-show="isDropdownOpen" class="custom-dropdown-options">
      <div
        v-for="option in options"
        :key="option.value"
        :class="{ selected: option.value === selectedOption }"
        @click.stop="selectOption(option)"
      >
        <div class="dropdown-text">{{ option.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  // 下拉框列表 [{label, value}]
  options: {
    type: Array,
    required: true,
    default: [],
  },
  selectedValue: {
    type: String,
    default: '',
  },
})

const emits = defineEmits(['optionChanged'])
// 当前选中项目 初始化为第一项 如果数据列表不存在，下拉框不会展示 而是展示加号提示增加内容
const selectedOption = computed(() =>
  props.options.find((item) => item.value === props.selectedValue),
)
// 下拉框展开控制
const isDropdownOpen = ref(false)

// 下拉框展开状态置反
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 选中某项触发的函数
const selectOption = (option) => {
  // 收起下拉框
  isDropdownOpen.value = false
  // 将value传递给父组件 触发父组件函数 比如查询知识库数据并画图
  emits('optionChanged', option.value)
}

// 全局点击事件函数
// 如果点击事件发生在组件之外，则关闭下拉框
const closeDropdownOnOutsideClick = (event) => {
  const container = document.querySelector('.custom-dropdown-container')
  if (container && !container.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  // 注册全局点击事件
  window.addEventListener('click', closeDropdownOnOutsideClick)
})

onUnmounted(() => {
  // 卸载全局点击事件
  window.removeEventListener('click', closeDropdownOnOutsideClick)
})
</script>

<style scoped lang="scss">
// 下拉框容器
.custom-dropdown-container {
  z-index: 1;
  position: relative;
  display: inline-block; /* 使容器宽度由内容决定 */
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

.dropdown-text {
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 下拉框下拉部分
.custom-dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: transparent;
  border: 1px solid #fff;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
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
</style>
