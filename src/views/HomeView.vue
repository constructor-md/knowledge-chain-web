<template>
  <main>
    <!-- 全局背景图片 -->
    <img src="/background.png" alt="背景图片" class="fullscreen-background" />
    <!-- 登录和注册组件 -->
    <LoginRegister v-if="notLogin" />
    <template v-else>
      <!-- 新增下拉框 -->
      <CustomDropDown
        :options="dropdownOptions"
        :initialValue="selectedValue"
        @optionChanged="handleOptionChanged"
      />
      <!-- 3D模块 -->
      <ThreeD :kId="selectedValue" />
    </template>
  </main>
</template>

<script setup lang="ts">
import ThreeD from '../components/ThreeD.vue'
import LoginRegister from '../components/LoginRegister.vue'
import CustomDropDown from "@/components/CustomDropDown.vue";
import {ref, watch, onMounted} from 'vue'
import {setLogin, useAuthStore} from "@/stores/auth";

// 下拉框选中值 kId
const selectedValue = ref('option1');
// 下拉框内容
const dropdownOptions = [
  { value: 'option1', label: '选项 1 dsauihaidainasnkaSNIABDUIAWDIAX' },
  { value: 'option2', label: '选项 2 第三丹尼斯当时的五年' },
  { value: 'option3', label: '选项 3 大碗大碗滴哦挖的' }
];

const handleOptionChanged = (value:string) => {
  selectedValue.value = value;
}

// 登陆后才可显示具体内容，否则不显示
const notLogin = ref(true);
const authStore = useAuthStore();
// 开启监听 通过对状态变量的监听实现响应式同步页面效果
watch(() => authStore.loginStatus, (newStatus) => {
  notLogin.value = !newStatus;
});

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
</style>
