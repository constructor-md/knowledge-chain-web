<template>
  <div class="login-register-container">
    <div class="login-register-box">
      <!-- 登录框 -->
      <div v-if="!isRegistering">
        <h2>登录</h2>
        <form>
          <input type="text" placeholder="用户名" />
          <input type="password" placeholder="密码" />
        </form>
        <div class="button-container">
          <button class="transparent-button" @click="handleLogin">登录</button>
          <button class="transparent-button" @click="toggleRegistration">注册</button>
        </div>
      </div>
      <!-- 注册框 -->
      <div v-if="isRegistering">
        <h2>注册</h2>
        <form>
          <input type="text" placeholder="用户名" />
          <input type="password" placeholder="密码" />
        </form>
        <button class="transparent-button" @click="handleRegister">注册</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {defineEmits, ref} from 'vue'

const emits = defineEmits(['login'])
// 控制是否处于注册状态
const isRegistering = ref(false)
const handleLogin = () => {
  // todo 执行登录API方法 登陆成功后执行父组件功能显示3D模块，否则不执行


  emits('login')
}

// 切换注册/登录状态
const toggleRegistration = () => {
  isRegistering.value = !isRegistering.value
}

// 处理注册操作
const handleRegister = () => {
  // todo 执行注册API方法 注册成功则切换到登录状态 否则不切换



  isRegistering.value = false
}

</script>

<style scoped lang="scss">
// 登录和注册最外层容器
.login-register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

// 登录注册框
.login-register-box {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 20px;
  color: #fff;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.login-register-box h2 {
  margin-bottom: 10px;
}

.login-register-box form {
  margin-bottom: 10px;
}

.login-register-box input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.button-container {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.transparent-button {
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  border: 1px solid #fff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.transparent-button:hover {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
