<template>
  <div class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h2>确认删除</h2>
      <p>确定要删除 {{ ballTitle }} 吗？</p>
      <p>所有关联的关系链条也会被删除</p>
      <div class="button-group">
        <button @click="confirm">确认</button>
        <button @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

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

const emits = defineEmits(['close', 'confirm'])

// 父组件执行具体函数
const close = () => {
  emits('close')
}

const confirm = () => {
  emits('confirm')
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

  p {
    margin-bottom: 15px;
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
        background-color: #f44336;
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
