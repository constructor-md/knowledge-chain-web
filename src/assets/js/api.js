import service from './axios.js';
import {useAuthStore} from "@/stores/auth.js";

// 注册
export const register = (data) => {
  return service.post('/user/register', data)
    .then((res) => {
      return res;
    })
    .catch((error) => {
      console.error('登录请求失败:', error);
      throw error;
    });
};

// 登录
export const login = (data) => {
  return service.post('/user/login', data)
    .then((res) => {
      return res;
    })
    .catch((error) => {
      console.error('登录请求失败:', error);
      throw error;
    });
};

// 获取编辑权限
export const updateAuth = () => {
  return service.get('/user/auth')
    .then((res) => {
      if (res.code === 200) {
        // 更新权限状态 触发各页面监控
        const authStore = useAuthStore();
        authStore.setAuthStatus(res.data)
        console.log("authStore.authStatus", authStore.authStatus)
      }
    })
    .catch((error) => {
      console.error('登录请求失败:', error);
      throw error;
    });
};
