<script setup lang="ts">
import { RouterView } from 'vue-router'
import {updateAuth} from "@/assets/js/api.js";
import {useAuthStore} from "@/stores/auth";

// 初始化存储
useAuthStore()
// 页面打开首先获取权限并保存
updateAuth();
</script>

<template>
  <RouterView />
</template>

<style scoped>

</style>
