<template>
  <!-- 弹框蒙版 避免操作到下方元素 全局关闭只有X按钮 不用蒙关闭  -->
  <div class="modal-mask">
    <!--  弹框内容容器 控制弹框整体大小 响应式的跟随页面尺寸  -->
    <div class="modal-wrapper" @click.stop :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }">
      <!--  弹框内容容器    -->
      <div class="modal-container">
        <!--    顶部标题    -->
        <div class="modal-header">
          <button v-if="!isEditing && editAuth" @click="startEditing" class="edit-button">编辑</button>
          <button v-if="isEditing && editAuth" @click="saveMarkdown" class="save-button">保存</button>
          <div class="header-title" v-if="!editAuth" > {{title}} </div>
          <div class="header-right">
            <el-button v-if="!isEditing && editAuth" class="relation-button" @click="openRelationManagement" type="primary">关系管理</el-button>
            <button @click="confirmClose" class="close-button">&times;</button>
          </div>
        </div>
        <!--    展示状态内容    -->
        <div v-if="!isEditing" class="modal-body">
          <!--     markdown文本     -->
          <div v-html="markdownContent"></div>
          <!--     问题部分     -->
          <h3 class="section-title">
            <p>问题</p>
            <el-button type="primary" :loading="newQuestionLoading" v-if="editAuth" @click="handleNewQuestion">来个新问题</el-button>
          </h3>
          <div class="question-box">
            {{ generatedQuestion }}
          </div>
          <!--    答案填写部分      -->
          <h3 class="section-title">填写答案</h3> <!-- 添加填写答案标题 -->
          <div class="answer-box">
            <textarea v-model="userAnswer" placeholder="请输入你的答案" ></textarea>
          </div>
          <div class="submit-button-container">
            <button @click="submitAnswer" class="submit-button">提交答案</button>
          </div>
          <!--     答案评价部分     -->
          <div v-if="showEvaluation" class="evaluation-box">
            <h3 class="section-title">评价结果</h3> <!-- 添加评价结果标题 -->
            <div class="evaluation-content" v-html="evaluatedMarkdown"></div>
            <span class="score" :style="{ color:'red', fontSize: '64px', fontFamily: 'cursive' }">{{ evaluationScore }}</span>
          </div>
        </div>
        <!--    编辑状态内容      -->
        <div v-if="isEditing" class="edit-container">
          <!--     编辑框     -->
          <div class="left-editor">
            <textarea v-model="rawMarkdown"></textarea>
          </div>
          <!--     实时渲染框     -->
          <div class="right-preview" v-html="markdownContent"></div>
        </div>
      </div>
    </div>
    <!--  关闭时弹窗 在编辑状态下关闭且编辑了内容则弹出是否确认  -->
    <div v-if="isClosing && isEditing && isMarkdownEdited" class="confirm-modal">
      <div class="confirm-modal-content">
        <p>是否保存更改？</p>
        <div class="confirm-modal-buttons">
          <button @click="saveAndClose">确定</button>
          <button @click="discardAndClose">取消</button>
        </div>
      </div>
    </div>
    <!-- 关系管理弹框 -->
    <RelationManagement
      v-model="showRelationManagementModal"
      :ballId="props.ballId"
      @close="closeRelationManagement"
    />
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  computed,
  ref,
  onMounted,
  onUnmounted,
  watchEffect, nextTick
} from 'vue';
import MarkdownIt from'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import markdownItHighlightjs from'markdown-it-highlightjs';
import {useAuthStore} from "@/stores/auth.js";
import {
  apiGenerateANewQuestion,
  apiGetKnowLedgePageInfo, apiGetScore,
  apiSubmitAnswer,
  apiUpdateMarkdown
} from "@/api/api.js";
import RelationManagement from "@/components/RelationManagement.vue";

const props = defineProps({
  // 这里接收知识点ID，用于查询知识内容
  ballId: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
});

const emits = defineEmits(['close']);
const md = MarkdownIt().use(markdownItHighlightjs, {
  hljs
});
const rawMarkdown = ref("");
// 保存原始的 markdown 内容 用于比较是否已编辑
const originalMarkdown = ref("");
// 计算属性，将原始 Markdown 解析为 HTML
const markdownContent = computed(() => md.render(rawMarkdown.value));

// 问题内容
const generatedQuestion = ref('');
// 用户编辑答案
const userAnswer = ref('');
// 答案评价展示控制
const showEvaluation = computed(() => {
  return evaluationReason.value !== null && evaluationReason.value.length > 0
});
// 答案评价内容
const evaluationReason = ref('');
// 答案评价 markdown
const evaluatedMarkdown = computed(() => md.render(evaluationReason.value));
// 答案评价分数
const evaluationScore = ref('');
// 弹框是否处于编辑状态
const isEditing = ref(false);
// 关闭确认弹窗弹出
const isClosing = ref(false);
// markdown内容是否被编辑
const isMarkdownEdited = ref(false);
const authStore = useAuthStore();
// 编辑权限
const editAuth = ref(false)
// 开启监听 通过对状态变量的监听实现响应式同步页面效果
watchEffect(() => {
  editAuth.value = authStore.authStatus;
});

// 控制弹框大小随着页面大小变化
const modalWidth = ref(0);
const modalHeight = ref(0);
const updateModalSize = () => {
  const width = window.innerWidth * 0.8;
  const height = window.innerHeight * 0.9;
  modalWidth.value = width;
  modalHeight.value = height;
};

const getKnowLedgePageInfo = async () => {
  let res = await apiGetKnowLedgePageInfo(props.ballId)
  if (res.code === 200) {
    rawMarkdown.value = res.data.markdown
    originalMarkdown.value = res.data.markdown
    generatedQuestion.value = res.data.question === null ? '' : res.data.question
    userAnswer.value = res.data.answer
    evaluationReason.value = res.data.evaluation
    evaluationScore.value = res.data.score
  }
}

onMounted(async () => {
  await getKnowLedgePageInfo()
  updateModalSize();
  window.addEventListener('resize', updateModalSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateModalSize);
});

// 点击编辑按钮 变成编辑状态
const startEditing = () => {
  isEditing.value = true;
};

// 点击保存按钮 保存内容并将编辑状态修正
const saveMarkdown = async () => {
  let data = {
    id: props.ballId,
    markdown: rawMarkdown.value
  }
  let res = await apiUpdateMarkdown(data)
  if (res.code === 200) {
    isEditing.value = false;
    originalMarkdown.value = rawMarkdown.value; // 保存当前内容作为原始内容
    isMarkdownEdited.value = false;
  }
};

// 点击关闭按钮
const confirmClose = () => {
  // 如果没有处于编辑状态，直接关闭即可
  if (!isEditing) {
    close();
  } else {
    // 如果处于编辑状态，判断内容是否被编辑
    isMarkdownEdited.value = rawMarkdown.value!== originalMarkdown.value;
    // 被编辑则弹窗询问确认
    if (isMarkdownEdited.value) {
      isClosing.value = true;
    } else {
      // 内容没变化直接关闭
      close();
    }
  }
};

// 关闭确认弹框的确认按钮
// 保存markdown内容并关闭
const saveAndClose = () => {
  saveMarkdown();
  close();
};

// 关闭确认弹框的取消按钮
// 恢复弹框状态并关闭
const discardAndClose = () => {
  isEditing.value = false;
  isMarkdownEdited.value = false;
  close();
};

// 右上角关闭按钮
const close = () => {
  isClosing.value = false;
  isEditing.value = false;

  // 如果有编辑关系，可能通过这里触发父组件重新画图
  emits('close');
};

// 新问题按钮
const newQuestionLoading = ref(false);
const handleNewQuestion = async () => {
  newQuestionLoading.value = true
  let res = await apiGenerateANewQuestion(props.ballId)
  if (res.code === 200) {
    generatedQuestion.value = res.data
  }
  newQuestionLoading.value = false
}

// 提交答案按钮
const submitAnswer = async () => {
  // 提交回答
  let data = {
    id: props.ballId,
    answer: userAnswer.value
  }
  let res = await apiSubmitAnswer(data);
  if (res.code === 200) {
    // 重置结果区域
    evaluationReason.value = '';
    evaluationScore.value = null;
    // 调用流式请求
    await fetchEvaluationStream(props.ballId);
    await getScore(props.ballId)
  }
};

const getScore = async (id) => {
  let res = await apiGetScore(id)
  if (res.code === 200) {
    evaluationScore.value = res.data
  }
}

// 缓存结构数据
const buffer = ref('')
// 流式请求方法
const fetchEvaluationStream = async (id) => {
  const response = await fetch(import.meta.env.VITE_API_BASE_URL + "/qa/evaluation?id=" + id, {
    headers: {
      'token':  localStorage.getItem('token'),
      'Accept': 'text/event-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const container = document.getElementById('evaluation-container');
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log('Stream completed');
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    console.log('Stream value', chunk);
    // 无条件将文本拼接到buffer
    buffer.value += chunk;

    // 尝试通过正则找到所有 data:JSON(单层括号) 格式的数据
    // 找到就解析否则就跳过
    const regex = /data:(\{.*?\})/g;
    let match;
    while ((match = regex.exec(buffer.value)) !== null) {
      const jsonText = match[1];
      try {
        const jsonObject = JSON.parse(jsonText);
        evaluationReason.value += jsonObject.data;
        if (container) {
          // 平滑滚动到容器底部
          container.scrollTop = container.scrollHeight;
        }
      } catch (error) {
        console.error('JSON解析错误:', error);
      }
    }

    // 移除解析过的数据
    let lastMatchEnd = 0;
    regex.lastIndex = 0;
    while ((match = regex.exec(buffer.value)) !== null) {
      lastMatchEnd = regex.lastIndex;
    }
    buffer.value = buffer.value.slice(lastMatchEnd);
  }

};

const showRelationManagementModal = ref(false);

const openRelationManagement = () => {
  showRelationManagementModal.value = true;
};

const closeRelationManagement = () => {
  showRelationManagementModal.value = false;
};

</script>

<style lang="scss" scoped>
// 弹框蒙版
.modal-mask {
  position: fixed;
  z-index: 6666;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

// 弹框大小控制
.modal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 弹框内容容器
.modal-container {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  padding: 0 10px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

// 弹框头部
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
  padding: 8px 10px;
  margin: -10px -10px 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-right {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: auto;
}

.header-title {
  font-size: 24px;
  padding: 5px 10px;
}

.edit-button,
.save-button,
.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.edit-button:hover,
.save-button:hover,
.close-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.close-button {
  // 编辑和保存不存在时，关闭按钮还在右边
  margin-left: auto;
}

.el-button {
  margin-left: auto;
  margin-right: 20px;
}

.modal-body {
  margin: 0 10px;
  height: calc(100% - 50px);
  overflow-y: auto;
}

.edit-container {
  display: flex;
  height: calc(100% - 40px);
}

.left-editor {
  flex: 1;
  padding-right: 10px;
}

.left-editor textarea {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  font-size: 14px;
}

.right-preview {
  flex: 1;
  padding-left: 10px;
  overflow-y: auto;
}

.confirm-modal {
  position: fixed;
  z-index: 9999;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
}

.confirm-modal-content {
  margin-bottom: 20px;
}

.confirm-modal-buttons button {
  margin: 0 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #333;
  color: #fff;
  transition: background-color 0.3s ease;
}

.confirm-modal-buttons button:hover {
  background-color: #555;
}

.question-box {
  margin-top: 10px;
  white-space: pre-wrap;
  width: 100%;
  padding: 10px;
  font-size: 18px;
}

.answer-box {
  margin-top: 10px;
}

.answer-box textarea {
  width: 100%;
  height: 200px;
  box-sizing: border-box;
  padding: 10px;
  resize: vertical;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 18px;
}

.submit-button-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.submit-button {
  background-color: #333;
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-button:hover {
  background-color: #555;
}

.evaluation-box {
  margin-top: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  position: relative;

  .evaluation-content {
    font-family: inherit;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
    // 保持markdown样式
    h1, h2, h3, h4 { margin: 10px 0; }
    p { margin: 5px 0; }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }
  }
}

.evaluation-box textarea {
  width: 100%;
  height: 200px;
  box-sizing: border-box;
  padding: 10px;
  margin-bottom: 20px;
  cursor: not-allowed;
  resize: vertical;
  overflow-y: auto;
  white-space: pre-wrap;
}

.score {
  position: absolute;
  top: 40px;
  right: 20px;
  color: red;
  font-size: 64px;
  font-family: cursive;
}

.section-title {
  width: 100%;
  height: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}
</style>
