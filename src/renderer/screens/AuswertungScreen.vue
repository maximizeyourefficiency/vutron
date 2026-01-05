<template>
  <v-slide-group
    v-model="activeItem"
    class="pa-4"
    center-active
    mandatory
    show-arrows
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
        @click="
          () => {
            toggle()
            onPersonSelected(person.Person_ID)
          }
        "
      >
        <div class="text-h6">{{ person.Rufname }}</div>
      </v-btn>
    </v-slide-group-item>
  </v-slide-group>

  <v-data-table
    :headers="headers"
    :items="lohnDaten"
    :loading="loading"
    :items-per-page="12"
    hide-default-footer
  />

  <v-bottom-sheet v-model="sheet">
    <template #activator="{ props: activatorProps }">
      <div class="text-center pa-8">
        <v-btn
          v-bind="activatorProps"
          color="primary"
          text="Jahr auswählen"
        />
      </div>
    </template>

    <v-list>
      <v-list-subheader title="Jahre" />

      <v-list-item
        v-for="item in jahrList"
        :key="item.Jahr"
        :title="item.Jahr"
        @click="selectYear(item.Jahr)"
      />
    </v-list>
  </v-bottom-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue'

/* ------------------------------------------
   Table Header Definition
------------------------------------------ */
// Hilfsfunktion zum Runden
function formatNumber2(value) {
  if (value === null || value === undefined || value === '') return ''
  return Number(value).toFixed(2)
}

// Diese Spalten sollen gerundet werden
const roundedColumns = [
  'Netto',
  'Brutto',
  'SollNetto',
  'Differenz',
  'Arbeitsstunden',
  'Monatsstunden_Manuell',
  'StundenDiff',
  'Umsatz',
  'Ausloese_psch',
  'Brutto_und_Ausloese',
  'FaktorBNIst',
  'Faktor'
]

// Header-Definition komplett
const headers = [
  { title: 'Monat', key: 'Monat', sortable: true },
  { title: 'Jahr', key: 'Jahr', sortable: true },

  // Automatisch alle gerundeten Spalten hinzufügen
  ...roundedColumns.map((key) => ({
    title: key.replace(/_/g, ' '),
    key,
    align: 'center',
    sortable: true,
    value: (item) => formatNumber2(item[key])
  }))
]

/* ------------------------------------------
   Reactive Values
------------------------------------------ */
const personalList = ref([])
const jahrList = ref([])
const lohnDaten = ref([])

const selectedPerson = ref(null)
const selectedJahr = ref(null)

const activeItem = ref(0)
const loading = ref(false)
const sheet = ref(false)

/* ------------------------------------------
   Load Personal
------------------------------------------ */
async function loadPersonal() {
  try {
    const result = await window.electron.getAll(
      `SELECT Person_ID, Rufname FROM tblPersonal WHERE Aktiv <> 0 AND Lohnrelevant <> 0`
    )

    if (Array.isArray(result)) {
      personalList.value = result

      // Erstes Personal automatisch auswählen
      if (personalList.value.length > 0) {
        selectedPerson.value = personalList.value[0].Person_ID
        tryLoadLohn()
      }
    }
  } catch (err) {
    console.error('[personalList] Fehler:', err)
  }
}

/* ------------------------------------------
   Load Years + Auto-select current year
------------------------------------------ */
async function loadJahre() {
  try {
    const result = await window.electron.getAll(
      `SELECT DISTINCT Jahr FROM tblLohn ORDER BY Jahr DESC`
    )
    jahrList.value = Array.isArray(result) ? result : []

    const currentYear = new Date().getFullYear()

    // Falls aktuelles Jahr existiert → auswählen
    if (jahrList.value.some((j) => j.Jahr === currentYear)) {
      selectedJahr.value = currentYear
    } else if (jahrList.value.length > 0) {
      // Falls nicht → das neueste Jahr auswählen
      selectedJahr.value = jahrList.value[0].Jahr
    }

    tryLoadLohn()
  } catch (e) {
    console.error('[jahrList] Fehler:', e)
  }
}

/* ------------------------------------------
   Year Selection
------------------------------------------ */
function selectYear(jahr) {
  selectedJahr.value = jahr
  sheet.value = false
  tryLoadLohn()
}

/* ------------------------------------------
   Person Selection
------------------------------------------ */
function onPersonSelected(personId) {
  selectedPerson.value = personId
  tryLoadLohn()
}

/* ------------------------------------------
   Load Data (Only when both are set)
------------------------------------------ */
function tryLoadLohn() {
  if (selectedJahr.value && selectedPerson.value) {
    loadLohn(selectedJahr.value, selectedPerson.value)
  }
}

/* ------------------------------------------
   Load Lohn Data
------------------------------------------ */
const loadLohn = async (jahr, personId) => {
  loading.value = true
  try {
    const query = `
      SELECT
        Lohn_ID, Personal_ID_F, Monat, Jahr, Netto, Brutto, Kommentar,
        Monatsstunden_Manuell, Ausloese_psch, Reparatur, Umsatz, SollNetto,
        FaktorBNIst, Differenz, Arbeitsstunden, StundenDiff, Krank, Urlaub,
        AT, SW, Faktor, Brutto_und_Ausloese
      FROM tbllohn
      WHERE Jahr = ? AND Personal_ID_F = ?
      ORDER BY Monat DESC
    `

    const result = await window.electron.get(query, [jahr, personId])
    lohnDaten.value = result || []
  } catch (error) {
    console.error('Fehler beim Laden der Lohndaten:', error)
    lohnDaten.value = []
  } finally {
    loading.value = false
  }
}

/* ------------------------------------------
   Initial Load
------------------------------------------ */
onMounted(() => {
  loadPersonal()
  loadJahre()
})
</script>
