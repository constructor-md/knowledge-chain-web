import service from './axios.js';
import {useAuthStore} from "@/stores/auth.ts";

// 注册
export const apiRegister = (data) => {
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
export const apiLogin = (data) => {
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
export const apiUpdateAuth = () => {
  return service.get('/user/auth')
    .then((res) => {
      if (res.code === 200) {
        // 更新权限状态 触发各页面监控
        const authStore = useAuthStore();
        authStore.setAuthStatus(res.data)
      }
    })
    .catch((error) => {
      console.error('登录请求失败:', error);
      throw error;
    });
};

// 查询知识库列表
export const apiGetKnowLedgeBaseList = () => {
  return service.get('/base/list')
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 新建知识库
export const apiAddKnowLedgeBase = (name) => {
  return service.post('/base/info?name=' + name)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 查询知识点列表
export const apiGetKnowLedgePointList = (id) => {
  return service.get('/point/list?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 新增知识点
export const apiAddKnowLedgePoint = (data) => {
  return service.post('/point/info', data)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 编辑知识点 title
export const apiUpdateKnowLedgePointTitle = (data) => {
  return service.put('/point/title', data)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 删除知识点
export const apiDeleteKnowLedgePoint = (id) => {
  return service.delete('/point/info?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 批量更新知识点坐标
export const apiUpdateLocation = (data) => {
  return service.put('/point/location', data)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 查询知识页数据
export const apiGetKnowLedgePageInfo = (id) => {
  return service.get('/page/info?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 编辑 markdown
export const apiUpdateMarkdown = (data) => {
  return service.put('/page/markdown', data)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 查询关联知识点列表
export const apiSearchRelationKnowledgePoint = (id, keywords) => {
  return service.get('/point/relation/list?id=' + id + '&keywords=' + keywords)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 建立连接
export const apiAddKnowledgePointRelation = (sourceId, targetId) => {
  return service.post('/relation/info?sourceId=' + sourceId + '&targetId=' + targetId)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 删除链接
export const apiDeleteKnowledgePointRelation = (sourceId, targetId) => {
  return service.delete('/relation/info?sourceId=' + sourceId + '&targetId=' + targetId)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 查询指定知识库下的所有连接
export const apiGetKnowledgeBaseAllRelation = (id) => {
  return service.get('/relation/all?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 生成新问题
export const apiGenerateANewQuestion = (id) => {
  return service.put('/page/question?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
}

// 提交答案
export const apiSubmitAnswer = (data) => {
  return service.post('/qa/answer', data)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
};

// 获取评价分数
export const apiGetScore = (id) => {
  return service.get('/qa/score?id=' + id)
    .then((res) => {
      return res
    })
    .catch((error) => {
      throw error;
    })
};







