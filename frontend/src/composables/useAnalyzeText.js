import axios from 'axios'

export const analyzeText = async (index, phrases) => {
  const text = phrases[index].text
  if (!text) {
    phrases[index].ruby_data = []
    return
  }

  try {
    const res = await axios.post('/api/ruby', { text })
    phrases[index].ruby_data = res.data.ruby_data
  } catch (err) {
    console.error('解析失敗', err)
    phrases[index].ruby_data = [{ word: text, ruby: null }]
  }
}