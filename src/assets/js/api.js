import service from './axios.js';

// 示例 API 函数，获取数据
export const getData = () => {
  return service.get('/api/data');
};

// 示例 API 函数，提交数据
export const submitData = (data) => {
  return service.post('/api/submit', data);
};
