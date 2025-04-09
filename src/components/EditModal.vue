<template>
  <div class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h2>{{ ballId? `编辑` : '新增' }}</h2>
      <label for="title">知识点名称:</label>
      <input
        type="text"
        id="title"
        v-model="title"
      />
      <div class="button-group">
        <button @click="save">保存</button>
        <button @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, defineProps, defineEmits, onMounted} from 'vue'

const props = defineProps({
  ballId: {
    type: [String, null],
    default: null
  },
  ballTitle: {
    type: String,
    default: ''
  }
})

onMounted(() => {
  console.log("props.ballId", props.ballId)
  console.log("props.ballTitle", props.ballTitle)
  console.log("title", title)
})

const emits = defineEmits(['close', 'save'])
const title = ref(props.ballTitle)

// 父组件执行具体函数
const close = () => {
  emits('close')
}

const save = () => {
  emits('save', title.value)
}

</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  width: 300px;

  h2 {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 8px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .button-group {
    display: flex;
    justify-content: space-between;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:nth-child(1) {
        background-color: #2196f3;
        color: white;
      }

      &:nth-child(2) {
        background-color: #9e9e9e;
        color: white;
      }
    }
  }
}
</style>
