import axios from 'axios';
import {setNotLogin} from "@/stores/auth.js";

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000 // 请求超时时间
});

const skipUrls = [
  '/user/register',
  '/user/login'
];

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 跳过不需要token的请求
    const shouldSkip = skipUrls.some(url => config.url.includes(url));
    if (shouldSkip) {
      return config; // 如果是要跳过的 URL，直接返回配置，不进行后续处理
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['token'] = token;
    } else {
      setNotLogin()
    }
    return config;
  },
  error => {
    console.log(error); // 打印错误信息
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code === 600502) {
      console.log("拦截到未登录")
      // 未登录 跳转登录
      setNotLogin()
    }
    return res;
  },
  error => {
    console.error('请求出错:', error.message);
    return Promise.reject(error);
  }
);

export default service;
