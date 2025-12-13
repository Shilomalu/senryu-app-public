import axios from 'axios'
import { useRouter } from 'vue-router'
import { analyzeText } from './useAnalyzeText'

export const useHandlePost = (selectedGenre, currentTheme, isJoinTheme, message) => {
  const router = useRouter()

  const handlePost = async (phrases) => {
    const token = localStorage.getItem('token')
    if (!token) {
      message.value = '席入り（ログイン）が必要です。'
      return
    }

    for (let index = 0; index < 3; ++index) {
      if (!phrases.ruby_data) {
        analyzeText(index, phrases);
      }
    }

    const senryudata = {
      content1: phrases[0].text,
      content2: phrases[1].text,
      content3: phrases[2].text,
      ruby_dataset: phrases.map((p) => p.ruby_data),
      genre_id: selectedGenre.value,
      weekly_theme_id:
        currentTheme.value && isJoinTheme.value ? currentTheme.value.weekly_theme_id : null,
    }

    try {
      await axios.post('/api/posts', senryudata, {
        headers: { Authorization: `Bearer ${token}` },
      })

      message.value = '投稿しました！'
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      const errorRes = err.response?.data

      if (errorRes?.errorCode) {
        let errorMessages = []
        if (errorRes.errorCode & 1) errorMessages.push('上の句が5音ではありません。')
        if (errorRes.errorCode & 2) errorMessages.push('中の句が7音ではありません。')
        if (errorRes.errorCode & 4) errorMessages.push('下の句が5音ではありません。')
        message.value = errorMessages.join('\n')
      } else if (errorRes?.errorCode === -1) {
        message.value = '記号などが多すぎます。'
      } else {
        message.value = errorRes?.error || errorRes?.message || '投稿に失敗しました。'
      }
    }
  }

  return { handlePost }
}