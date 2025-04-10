<template>
  <div class="login-register-container">
    <div class="login-register-box">
      <!-- 登录框 -->
      <div v-if="!isRegistering">
        <h2>登录</h2>
        <form>
          <input type="text" placeholder="用户名" v-model="data.username" />
          <input type="password" placeholder="密码" v-model="data.password" />
        </form>
        <p v-if="error.show" class="error-message">{{ error.msg }}</p>
        <div class="button-container">
          <button class="transparent-button" @click="handleLogin">登录</button>
          <button class="transparent-button" @click="toggleRegistration">注册</button>
        </div>
      </div>
      <!-- 注册框 -->
      <div v-if="isRegistering">
        <h2>注册</h2>
        <form>
          <input type="text" placeholder="用户名" v-model="data.username" />
          <input type="password" placeholder="密码" v-model="data.password" />
        </form>
        <p v-if="error.show" class="error-message">{{ error.msg }}</p>
        <div class="button-container">
          <button class="transparent-button" @click="returnLogin">返回</button>
          <button class="transparent-button" @click="handleRegister">注册</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {register, login, updateAuth} from '../assets/js/api.js'
import {setLogin} from "@/stores/auth.js";
const data = ref({
  username: '',
  password: ''
})

const error = ref({
  show: false,
  msg: ''
})

// 控制是否处于注册状态
const isRegistering = ref(false)

// 切换注册/登录状态
const toggleRegistration = () => {
  isRegistering.value = true
}

// 返回登录框
const returnLogin = () => {
  isRegistering.value = false
  clearError()
}

const handleLogin = async () => {
  try {
    const res = await login(data.value);
    // 未注册
    if (res.code === 600506) {
      // 跳转注册框
      isRegistering.value = true;
      // 注册框红字显示未注册
      error.value.show = true;
      error.value.msg = '未注册';
    } else if (res.code !== 200) {
      // 登录失败 显示原因...
      error.value.show = true;
      error.value.msg = res.msg || '登录失败，请稍后重试';
    } else {
      // 登录成功
      const token = res.data;
      // 存入本地缓存
      localStorage.setItem('token', token);
      // 状态变量触发各个页面显示
      setLogin()
      // 获取权限信息
      await updateAuth();
      // 清理报错
      clearError()
    }
  } catch (e) {
    console.error('登录请求出错:', e);
    error.value.show = true;
    error.value.msg = '登录请求出错，请稍后重试';
  }
}

const handleRegister = async () => {
  // 数据检查


  try {
    let res = await register(data.value)
    // 用户名重复
    if (res.code === 600506) {
      // 红字显示用户名重复
      setError("用户名重复")
    } else if (res.code === 200) {
      // 成功，清理错误信息
      clearError()
      // 注册成功 跳转登录框
      isRegistering.value = false;
    } else if (res.code !== 200) {
      // 注册失败 弹框显示原因...
      error.value.show = true;
      error.value.msg = res.msg || '注册失败，请稍后重试';
    }
  } catch (e) {
    console.error('注册请求出错:', e);
    error.value.show = true;
    error.value.msg = '注册请求出错，请稍后重试';
  }

}

// 设置错误信息
const setError = (info:string) => {
  error.value.show = true
  error.value.msg = info
}
// 清除错误信息
const clearError = () => {
  error.value = {
    show: false,
    msg: ''
  }
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

// 错误信息样式
.error-message {
  color: red;
  margin-top: 5px;
}
</style>
