<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const username = ref('');
const email = ref('');
const profile_text = ref('');

const token = localStorage.getItem('token');

// 初期値を API から取得
const loadProfile = async () => {
  try {
    const res = await axios.get('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    username.value = res.data.username;
    email.value = res.data.email; 
    profile_text.value = res.data.profile_text;
  } catch (err) {
    console.error(err);
    alert('プロフィール取得に失敗しました');
  }
};

loadProfile();

// 保存ボタン
const saveProfile = async () => {
  try {
    await axios.put('/api/users/me', {
      username: username.value,
      profile_text: profile_text.value,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('プロフィールを更新しました');
    router.push('/profile');
  } catch (err) {
    console.error(err);
    alert('更新に失敗しました');
  }
};

// キャンセルボタン
const cancel = () => {
  router.push('/profile');
};
</script>

<template>
  <div class="profile-edit-container">
    <h2>プロフィール編集</h2>
    <div class="form-group">
      <label>ユーザー名</label>
      <input v-model="username" type="text" />
    </div>
    <div class="form-group">
      <label>自己紹介</label>
      <textarea v-model="profile_text" rows="4" class="profile-textarea"></textarea>
    </div>
    <div class="button-group">
      <button @click="saveProfile" class="save-btn">保存</button>
      <button @click="cancel" class="cancel-btn">キャンセル</button>
    </div>
  </div>
</template>

<style scoped>
.profile-edit-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
<<<<<<< HEAD
=======
  color: #000;
>>>>>>> 3e6d52df1d87e991443f7ced5db83ade6a260525
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.profile-textarea {
  resize: vertical;   /* 縦方向のみリサイズ可能 */
  width: 100%;        /* 横幅は親要素に合わせる */
  min-height: 4em;    /* 4行分の高さを初期値に */
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

.save-btn {
  background-color: #007bff;
  color: #fff;
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #ccc;
  color: #333;
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
