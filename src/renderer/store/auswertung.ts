import { defineStore } from 'pinia'
import { ref } from 'vue'

const CORRECT_PIN = '7854'

export const useAuswertungStore = defineStore('auswertung', () => {
  const isUnlocked = ref(false)

  function checkPin(pin: string): boolean {
    if (pin === CORRECT_PIN) {
      isUnlocked.value = true
      return true
    }
    return false
  }

  function lock() {
    isUnlocked.value = false
  }

  return {
    isUnlocked,
    checkPin,
    lock
  }
})
