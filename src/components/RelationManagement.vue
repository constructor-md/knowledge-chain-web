<template>
  <el-dialog
    v-model="visible"
    title="关系管理"
    :close-on-click-modal="true"
    :style="{ width: dialogWidth + 'px' }"
    @close="closeDialog"
  >
    <div class="search-container">
      <el-input v-model="searchQuery" placeholder="请输入搜索关键词" clearable @clear="handleClear" />
      <el-button @click="searchRelations">搜索</el-button>
    </div>
    <div class="table-container">
      <el-table :data="relationList" style="width: 100%;">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="briefContent" label="内容缩略" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button
              v-if="!scope.row.relate"
              type="primary"
              @click="createRelation(scope.row.id)"
            >
              新建链接
            </el-button>
            <el-button
              v-if="scope.row.relate"
              type="danger"
              @click="deleteRelation(scope.row.id)"
            >
              删除链接
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  apiAddKnowledgePointRelation,
  apiDeleteKnowledgePointRelation,
  apiSearchRelationKnowledgePoint
} from "@/api/api.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  ballId: {
    type: String,
    default: ''
  }
});

const emits = defineEmits(['update:modelValue', 'close']);

const visible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
    if (!value) {
      emits('close');
    }
  }
});

const searchQuery = ref('');
const relationList = ref([]);
const dialogWidth = ref(500);

const handleResize = () => {
  dialogWidth.value = Math.min(800, window.innerWidth * 0.8); // 最大宽度800px
};

const searchRelations = async () => {
  // 模拟搜索结果
  let res = await apiSearchRelationKnowledgePoint(props.ballId, searchQuery.value)
  if (res.code === 200) {
    relationList.value = res.data
  }
};

const handleClear = async () => {
  await searchRelations()
}

const createRelation = async (id) => {
  let res = await apiAddKnowledgePointRelation(props.ballId, id)
  if (res.code === 200) {
    // 找到对应项并更新状态
    const item = relationList.value.find(item => item.id === id);
    if (item) {
      item.relate = true;
    }
  }

};

const deleteRelation = async (id) => {
  let res = await apiDeleteKnowledgePointRelation(props.ballId, id)
  if (res.code === 200) {
    // 找到对应项并更新状态
    const item = relationList.value.find(item => item.id === id);
    if (item) {
      item.relate = false;
    }
  }
};

const closeDialog = () => {
  emits('update:modelValue', false);
};

onMounted(() => {
  searchRelations();
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* 搜索区域样式 */
.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

/* 表格容器样式 - 设置固定高度并启用滚动 */
.table-container {
  max-height: 400px; /* 设置最大高度 */
  overflow-y: auto;  /* 内容超出时显示垂直滚动条 */
}

.el-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  width: 600px !important; /* 设置固定宽度 */
  max-width: 90%;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
}

/* 确保对话框内容区域不限制高度 */
.el-dialog__body {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
}

/* 优化表格样式 */
.el-table {
  margin-top: 0;
}

/* 按钮间距 */
.el-button + .el-button {
  margin-left: 10px;
}
</style>
