<template>
  <main>
    <!-- 全局背景图片 -->
    <img src="/background.png" alt="背景图片" class="fullscreen-background" />
    <!-- 新增下拉框 -->
    <CustomDropDown
      v-if="showThreeD"
      :options="dropdownOptions"
      :initialValue="selectedValue"
      @optionChanged="handleOptionChanged"
    />
    <!-- 3D模块 -->
    <ThreeD v-if="showThreeD" :kId="selectedValue" />
    <!-- 登录和注册组件 -->
    <LoginRegister v-else @login="handleLogin" />

  </main>
</template>

<script setup lang="ts">
import ThreeD from '../components/ThreeD.vue'
import LoginRegister from '../components/LoginRegister.vue'
import CustomDropDown from "@/components/CustomDropDown.vue";
import { ref } from 'vue'

// 下拉框选中值 kId
const selectedValue = ref('option1');
// 下拉框内容
const dropdownOptions = [
  { value: 'option1', label: '选项 1 dsauihaidainasnkaSNIABDUIAWDIAX' },
  { value: 'option2', label: '选项 2 第三丹尼斯当时的五年' },
  { value: 'option3', label: '选项 3 大碗大碗滴哦挖的' }
];

const handleOptionChanged = (value) => {
  selectedValue.value = value;
}


// true显示3D模块 false显示登陆注册模块
const showThreeD = ref(false)

// 登录后隐藏登录注册模块 显示3D模块
const handleLogin = () => {
  showThreeD.value = true
}
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
</style>
