<template>
  <!-- 弹框蒙版 避免操作到下方元素 全局关闭只有X按钮 不用蒙关闭  -->
  <div class="modal-mask">
    <!--  弹框内容容器 控制弹框整体大小 响应式的跟随页面尺寸  -->
    <div class="modal-wrapper" @click.stop :style="{ width: modalWidth + 'px', height: modalHeight + 'px' }">
      <!--  弹框内容容器    -->
      <div class="modal-container">
        <!--    顶部标题    -->
        <div class="modal-header">
          <button v-if="!isEditing" @click="startEditing" class="edit-button">编辑</button>
          <button v-if="isEditing" @click="saveMarkdown" class="save-button">保存</button>
          <button @click="confirmClose" class="close-button">&times;</button>
        </div>
        <!--    展示状态内容    -->
        <div v-if="!isEditing" class="modal-body">
          <!--     markdown文本     -->
          <div v-html="markdownContent"></div>
          <!--     问题部分     -->
          <h3 class="section-title">提问</h3> <!-- 添加提问标题 -->
          <div class="question-box">
            <p>{{ generatedQuestion }}</p>
          </div>
          <!--    答案填写部分      -->
          <h3 class="section-title">填写答案</h3> <!-- 添加填写答案标题 -->
          <div class="answer-box">
            <textarea v-model="userAnswer" placeholder="请输入你的答案" :readonly="isSubmitted"></textarea>
          </div>
          <div v-if="!isSubmitted" class="submit-button-container">
            <button @click="submitAnswer" class="submit-button">提交答案</button>
          </div>
          <!--     答案评价部分     -->
          <div v-if="showEvaluation" class="evaluation-box">
            <h3 class="section-title">评价结果</h3> <!-- 添加评价结果标题 -->
            <textarea v-model="evaluationReason" placeholder="请输入评价理由" readonly></textarea>
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
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, onMounted, onUnmounted } from 'vue';
import MarkdownIt from'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';
import markdownItHighlightjs from'markdown-it-highlightjs';

const props = defineProps({
  // 这里接收知识点ID，用于查询知识内容
  ballId: {
    type: String,
    default: ''
  }
});

const emits = defineEmits(['close']);
const md = MarkdownIt().use(markdownItHighlightjs, {
  hljs
});
const rawMarkdown = ref("# 测试 Markdown 文本\n" +
  "\n" +
  "## 一、标题测试\n" +
  "这是一个二级标题，用于测试标题的渲染效果。\n" +
  "\n" +
  "### 1.1 三级标题\n" +
  "这是一个三级标题，进一步展示标题的层次结构。\n" +
  "\n" +
  "## 二、段落文本\n" +
  "在 Markdown 中，段落是通过空行来分隔的。这里是一个段落文本，主要用于测试普通文本的显示效果。可以包含一些文字内容，比如介绍某个概念、描述一个过程等等。\n" +
  "\n" +
  "## 三、列表测试\n" +
  "### 3.1 无序列表\n" +
  "- 列表项 1：无序列表通常使用 `-` 符号来表示。\n" +
  "- 列表项 2：每个列表项都独占一行。\n" +
  "- 列表项 3：可以有多个列表项，用于列举相关的内容。\n" +
  "\n" +
  "### 3.2 有序列表\n" +
  "1. 列表项 1：有序列表使用数字加 `.` 来表示。\n" +
  "2. 列表项 2：数字会按照顺序自动排列。\n" +
  "3. 列表项 3：常用于表示有顺序的步骤或项目。\n" +
  "\n" +
  "## 四、链接和图片\n" +
  "### 4.1 链接\n" +
  "[这是一个链接](https://www.example.com)，点击后应该能够跳转到指定的网页地址。在 Markdown 中，链接的格式是 `[链接文本](链接地址)`。\n" +
  "\n" +
  "### 4.2 图片\n" +
  "![图片描述](https://www.example.com/image.jpg)：这是一个插入图片的示例，在 Markdown 中，图片的格式是 `![图片描述](图片地址)`。如果图片地址有效，应该能够正确显示图片。\n" +
  "\n" +
  "## 五、代码块测试\n" +
  "### 5.1 行内代码\n" +
  "在 Markdown 中，行内代码使用反引号（`）来表示，例如 `print(\"Hello, World!\")`，这样可以突出显示代码文本。\n" +
  "\n" +
  "### 5.2 代码块\n" +
  "```python\n" +
  "def add(a, b):\n" +
  "    return a + b\n" +
  "\n" +
  "result = add(3, 5)\n" +
  "print(result)\n" +
  "```");
// 保存原始的 markdown 内容 用于比较是否已编辑
const originalMarkdown = ref(rawMarkdown.value);
// 计算属性，将原始 Markdown 解析为 HTML
const markdownContent = computed(() => md.render(rawMarkdown.value));

// 问题内容
const generatedQuestion = ref('根据上述 Markdown 内容，请回答相关问题：代码块中函数 add 的作用是什么？'); // 模拟后台生成的问题
// 用户编辑答案
const userAnswer = ref('函数 add 的作用是将输入的两个参数 a 和 b 相加，并返回相加的结果。'); // 模拟用户输入的答案
// 答案评价展示控制
const showEvaluation = ref(false);
// 答案评价内容
const evaluationReason = ref('回答内容准确，逻辑清晰，很好地解释了函数的作用。'); // 模拟评价理由
// 答案评价分数
const evaluationScore = ref('85');
// 答案提交按钮显示控制
const isSubmitted = ref(false);
// 弹框是否处于编辑状态
const isEditing = ref(false);
// 关闭确认弹窗弹出
const isClosing = ref(false);
// markdown内容是否被编辑
const isMarkdownEdited = ref(false);

// 控制弹框大小随着页面大小变化
const modalWidth = ref(0);
const modalHeight = ref(0);
const updateModalSize = () => {
  const width = window.innerWidth * 0.8;
  const height = window.innerHeight * 0.9;
  modalWidth.value = width;
  modalHeight.value = height;
};

onMounted(() => {
  // todo 根据知识点id查询展示内容



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
const saveMarkdown = () => {
  // todo 保存编辑内容到后台

  isEditing.value = false;
  originalMarkdown.value = rawMarkdown.value; // 保存当前内容作为原始内容
  isMarkdownEdited.value = false;
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

// 提交答案按钮
const submitAnswer = () => {
  // todo 查询答案评价 AI流式输出




  showEvaluation.value = true;
  evaluationScore.value = '85';
  isSubmitted.value = true; // 提交后设置为已提交状态
};
</script>

<style lang="scss" scoped>
// 弹框蒙版
.modal-mask {
  position: fixed;
  z-index: 9998;
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
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 4px;
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
  border-radius: 4px;
  position: relative;
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
  margin: 20px 0 10px;
  font-size: 18px;
  font-weight: bold;
}
</style>
