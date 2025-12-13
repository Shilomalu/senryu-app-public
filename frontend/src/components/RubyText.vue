<script setup>
defineProps({
  rubyData: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <span class="ruby-text">
    <template v-for="(item, i) in rubyData" :key="i">
      <ruby v-if="item.ruby">
        {{ item.word }}
        <rt>{{ item.ruby }}</rt>
      </ruby>
      <span v-else>{{ item.word }}</span>
    </template>
  </span>
</template>

<style scoped>
ruby { 
  ruby-position: over; 
  flex-direction: column; 
  align-items: center; 
}
rt {
  font-size: 0.5em; 
  color: #555; 
  text-align: center; 
  margin-bottom: -0.4em; 
}
</style>
