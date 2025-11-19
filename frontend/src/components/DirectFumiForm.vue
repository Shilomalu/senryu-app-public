<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  partnerId: {
    type: Number,
    required: true
  },
  latestMessage: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['message-sent'])
const content1 = ref('')
const content2 = ref('')
const content3 = ref('')
const isSubmitting = ref(false)
const isReply77 = ref(false); // 次に送信するふみが七七であるかどうか（つまり，最新のふみが五七五であるかどうか）
onMounted(() => {
  () => props.latestMessage,
    console.log("late4st:",props.latestMessage);
    isReply77.value = props.latestMessage.reply_77
})

watch(
  () => props.latestMessage,
  () => {
    isReply77.value = props.latestMessage.reply_77
    console.log(isReply77.value)
  }
);

async function handleSubmitMessage(e) {
  e.preventDefault()
  // require at least one non-empty part
  if ((!content1.value.trim() && !content2.value.trim() && !content3.value.trim() && !isReply77.value) || (!content1.value.trim() && !content2.value.trim() && isReply77.value)) return
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token')
    const replydata = {
      content1: content1.value.trim(),
      content2: content2.value.trim(),
      content3: content3.value.trim(),
      reply77Flag: !isReply77.value, //この返信が77ならtrueだから次は575でfalse
    };

    const response = await fetch(`/api/users/${props.partnerId}/dfumi/sending`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(replydata)
    })
    console.log(response);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const msg = data.error || 'ふみの送信に失敗しました'
      throw new Error(msg)
    }

    // clear inputs
    content1.value = ''
    content2.value = ''
    content3.value = ''
    emit('message-sent');
  } catch (error) {
    console.error('ふみ送信エラー:', error)
    alert(error.message || 'ふみの送信に失敗しました')
  } finally {
    isSubmitting.value = false
  }
}

const fetchFlag = async () => {
  try {
    let endpoint = `/api/users/${props.partnerId}/dfumi/isreply77`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ふみフラグの読み込みに失敗しました。');
    isReply77.value = data;

  } catch (err) {
    console.error(err);
    partners.value = err.message || 'データの取得中にエラーが発生しました。';
    partners.value = [];
  }
};
</script>

<template>
  <form @submit="handleSubmitMessage" class="message-form">
  <div class="message-inputs" v-if="!isReply77">
      <input v-model="content1" type="text" placeholder="初句（五）" maxlength="10">
      <input v-model="content2" type="text" placeholder="二句（七）" maxlength="15">
      <input v-model="content3" type="text" placeholder="三句（五）" maxlength="10">
    </div>
    <div class="message-inputs" v-else>
      <input v-model="content1" type="text" placeholder="四句（七）" maxlength="15">
      <input v-model="content2" type="text" placeholder="五句（七）" maxlength="15">
    </div>
    <div class="button-container">
      <button 
        type="submit" 
        class="submit-button" 
        :disabled="isSubmitting || (!content1.trim() && !content2.trim() && !content3.trim() && isReply77) || (!content1.trim() && !content2.trim() && !isReply77)"
      >
        {{ isSubmitting ? '送信中...' : '送信' }}
      </button>
    </div>
  </form>
</template>


<style scoped>
.message-form {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  max-width: 60%;
  margin-left: auto;
}

.message-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.message-inputs input {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  text-align: center;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.button-container {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  padding: 0.375rem 1rem;
  font-size: 1rem;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.submit-button:not(:disabled):hover {
  background-color: #0056b3;
}
</style>