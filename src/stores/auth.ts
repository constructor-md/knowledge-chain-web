import { ref } from 'vue'
import { defineStore } from 'pinia'

export const setLogin = () => {
  // 已登录 触发各个页面显示
  const authStore = useAuthStore();
  authStore.setLoginStatus(true)
}

export const setNotLogin = () => {
  // 未登录 触发登录显示
  const authStore = useAuthStore();
  authStore.setLoginStatus(false)
}

export const useAuthStore = defineStore('auth', () => {
  // 是否已经登录
  const loginStatus = ref(false)
  function setLoginStatus(status: boolean) {
    loginStatus.value = status
  }
  // 是否允许页面上的修改
  const authStatus = ref(false)
  function setAuthStatus(status: boolean) {
    authStatus.value = status
  }
  return { loginStatus, authStatus, setLoginStatus, setAuthStatus }
})
