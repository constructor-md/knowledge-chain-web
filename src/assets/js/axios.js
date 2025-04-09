import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: '', // 这里可以设置你的 API 基础地址
  timeout: 5000 // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 假设 token 存放在 localStorage 中
    const token = localStorage.getItem('token');
    if (token) {
      // 在请求头中携带 token
      config.headers['Authorization'] = `Bearer ${token}`;
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
    // 这里可以根据后端返回的状态码进行处理
    if (res.code!== 200) {
      console.error('请求失败:', res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    } else {
      return res;
    }
  },
  error => {
    console.error('请求出错:', error.message);
    return Promise.reject(error);
  }
);

export default service;
