<script setup lang="tsx"></script>
<template>
  <v-slide-group
    v-model="activeItem"
    class="pa-4"
    center-active
    show-arrows
    @update:model-value="onPersonSelected"
  >
    <v-slide-group-item
      v-for="(person, index) in personalList"
      :key="index"
      v-slot="{ isSelected, toggle }"
    >
      <v-btn
        :color="isSelected ? 'primary' : undefined"
        class="ma-2"
        rounded
        @click="toggle"
      >
        <div class="text-h6">{{ person.Rufname }}</div>
      </v-btn>
    </v-slide-group-item>
  </v-slide-group>
  <v-data-table
    :headers="headers"
    :items="lohnDaten"
    :loading="loading"
    class="elevation-1 mt-4"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const headers = [
  { title: '', key: 'actions', sortable: false, width: '70px' },
  { title: 'Kuerzel', key: 'Kuerzel' },
  { title: 'ID_Sth', key: 'ID_StH' },
  { title: 'ID_Stb', key: 'ID_Stb' },
  { title: 'Rufname', key: 'Rufname' },
  { title: 'Nachname', key: 'Nachname' },
  { title: 'Vorname', key: 'Vorname' },
  { title: 'Geburtstag', key: 'Geburtstag' },
  { title: 'GebOrt', key: 'GebOrt' },
  { title: 'IBAN', key: 'IBAN' },
  { title: 'KundenNrAA', key: 'KundenNrAA' },
  { title: 'SteuerID', key: 'SteuerID' },
  { title: 'AusweisNr', key: 'AusweisNr' },
  { title: 'VersicherungsNr', key: 'VersicherungsNr' },
  { title: 'Straße', key: 'Straße' },
  { title: 'PLZ', key: 'PLZ' },
  { title: 'Ort', key: 'Ort' },
  { title: 'Handy', key: 'Handy' },
  { title: 'Stundenlohn_West', key: 'Stundenlohn_West' },
  { title: 'Stundenlohn_Ost', key: 'Stundenlohn_Ost' },
  { title: 'Aktiv', key: 'Aktiv' },
  { title: 'Faktor', key: 'Faktor' },
  { title: 'Ausloese_psch_setzen', key: 'Ausloese_psch_setzen' },
  { title: 'Lohnrelevant', key: 'Lohnrelevant' },
  { title: 'verheiratet', key: 'verheiratet' },
  { title: 'Kinder', key: 'Kinder' },
  { title: 'Bauleiter', key: 'Name', width: '400px' },
  { title: 'Kommentar', key: 'Kommentar' }
]

const personalList = ref([])
const activeItem = ref(0)
const loading = ref(false)
const lohnDaten = ref([])

const onPersonSelected = (index) => {
  if (index !== null && index !== undefined) {
    const selectedPerson = personalList.value[index]
    loadLohn(selectedPerson)
  }
}

async function loadPersonal() {
  try {
    const result = await window.electron.getAll(
      `SELECT Rufname FROM tblPersonal WHERE Aktiv <> 0`
    )
    if (Array.isArray(result)) {
      personalList.value = await result
      //personalList.value = result
      //currentOffset.value = result.length
      console.debug('[personalList] Initial geladen:', personalList.value)
    } else {
      console.warn('[personalList] Kein Array:', result)
      personalList.value = []
    }
  } catch (err) {
    console.error('[personalList] Fehler beim Laden:', err)
    personalList.value = []
  }
}

const loadLohn = async (person) => {
  loading.value = true
  try {
    // Hier deine eigene Logik zum Laden der Lohndaten
    // Beispiel:
    const response = await fetch(`/api/lohn/${person.id}`)
    lohnDaten.value = await response.json()
    // Demo-Daten:
    lohnDaten.value = [
      { monat: 'Januar', betrag: '3500€', status: 'Bezahlt' },
      { monat: 'Februar', betrag: '3500€', status: 'Bezahlt' },
      { monat: 'März', betrag: '3500€', status: 'Ausstehend' }
    ]
  } catch (error) {
    console.error('Fehler beim Laden der Lohndaten:', error)
  } finally {
    loading.value = false
  }
}

// Initial laden für den ersten Mitarbeiter
onPersonSelected(0)

onMounted(() => {
  console.debug('[personal] Component mounted')
  loadPersonal()
})
</script>
