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

  <v-row no-gutters>
    <!-- Linke Tabelle: 70% -->
    <v-col
      cols="12"
      md="9"
      class="pr-2"
    >
      <div class="table-container">
        <v-data-table
          v-model="selectedRows"
          :headers="headers"
          :items="lohnDaten"
          :loading="loading"
          :items-per-page="12"
          :row-props="getRowProps"
          density="compact"
          hover
          item-value="Lohn_ID"
          return-object
          hide-default-footer
          class="responsive-table"
          @click:row="onRowClick"
        >
          <template #[`body.append`]>
            <tr class="summen-zeile">
              <td
                v-for="header in headers"
                :key="header.key"
                :class="[
                  'font-weight-bold',
                  header.key !== 'Monat' && header.key !== 'Jahr'
                    ? 'text-center'
                    : ''
                ]"
              >
                <span v-if="header.key === 'Monat'">Summe:</span>
                <span v-else-if="sumColumns.includes(header.key)">
                  {{ calculateSum(header.key) }}
                </span>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </v-col>

    <!-- Rechte Tabelle: 30% -->
    <v-col
      cols="12"
      md="3"
      class="pl-2"
    >
      <div class="table-container">
        <v-data-table
          :headers="headersMonatsleistung"
          :items="baustellenDaten"
          :loading="loading"
          :items-per-page="12"
          density="compact"
          hover
          hide-default-footer
          class="responsive-table"
        />
      </div>
    </v-col>
  </v-row>

  <v-bottom-sheet v-model="sheet">
    <template #activator="{ props: activatorProps }">
      <div class="text-center pa-8">
        <v-btn
          v-bind="activatorProps"
          color="primary"
          :text="selectedJahr ? `Jahr: ${selectedJahr}` : 'Jahr auswählen'"
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

const sumColumns = [
  'Netto',
  'Brutto',
  'SollNetto',
  'Differenz',
  'Arbeitsstunden',
  'Monatsstunden_Manuell',
  'StundenDiff',
  'Umsatz',
  'Ausloese_psch',
  'Brutto_und_Ausloese'
]

// Header-Definition komplett
const headers = [
  { title: 'Monat', key: 'Monat', sortable: true },
  { title: 'Personal_ID_F', key: 'Personal_ID_F', sortable: true },

  // Automatisch alle gerundeten Spalten hinzufügen
  ...roundedColumns.map((key) => ({
    title: key.replace(/_/g, ' '),
    key,
    align: 'center',
    sortable: true,
    value: (item) => formatNumber2(item[key])
  }))
]
const headersMonatsleistung = [
  { title: 'B-Nr', key: 'Baustellennummer', sortable: true },
  { title: 'Ort', key: 'Ort', sortable: true },
  { title: 'AG_Name', key: 'AG_Name', sortable: true }
]

/* ------------------------------------------
   Reactive Values
------------------------------------------ */
const personalList = ref([])
const jahrList = ref([])
const lohnDaten = ref([])
const selectedRows = ref([])
const baustellenDaten = ref([])
const selectedPerson = ref(null)
const selectedJahr = ref(null)
const selectedRowId = ref(null)

const activeItem = ref(0)
const loading = ref(false)
const sheet = ref(false)

/* ------------------------------------------
   Row Props for Orange Highlighting
------------------------------------------ */
function getRowProps(item) {
  return {
    class: item.item.Lohn_ID === selectedRowId.value ? 'selected-row' : ''
  }
}

/* ------------------------------------------
   Row Selection Handler
------------------------------------------ */
function onRowClick(event, { item }) {
  selectedRowId.value = item.Lohn_ID
  loadBaustellenImMonat(item.Jahr, item.Monat, item.Personal_ID_F)
}

/* ------------------------------------------
   Sum Calculation Functions
------------------------------------------ */
function calculateSum(columnKey) {
  if (!lohnDaten.value || lohnDaten.value.length === 0) return '0.00'

  const sum = lohnDaten.value.reduce((acc, item) => {
    const value = parseFloat(item[columnKey]) || 0
    return acc + value
  }, 0)

  return sum.toFixed(2)
}

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
   Load BaustellenImMonat
------------------------------------------ */
const loadBaustellenImMonat = async (jahr, monat, personId) => {
  //loading.value = true
  try {
    const query = `
    SELECT DISTINCT
    bs.Baustellennummer,
    bs.Ort,
    bs.Straße,
    ag.AG_Name,
    bs.Personal_ID_F,
    bs.Monat,
    bs.Jahr
    FROM
    viewbaustellendaten AS bs
    INNER JOIN tblag AS ag ON ag.AG_ID = bs.AG_ID_F
    WHERE bs.Jahr = ? AND bs.Monat = ? AND bs.Personal_ID_F = ?
    `
    const result = await window.electron.get(query, [jahr, monat, personId])
    baustellenDaten.value = result || []
  } catch (error) {
    console.error('Fehler beim Laden der baustellenDaten:', error)
    baustellenDaten.value = []
  } finally {
    loading.value = false
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
    selectedRowId.value = null // Reset selection when loading new data
    loadLohn(selectedJahr.value, selectedPerson.value)
  }
}

/* ------------------------------------------
   Load Lohn Data
------------------------------------------ */
const loadLohn = async (jahr, personId) => {
  loading.value = true
  selectedRows.value = [] // Reset selection when loading new data
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

<style scoped>
.summen-zeile {
  border-top: 2px solid #e0e0e0;
  background-color: #f5f5f5;
}

.responsive-table :deep(table) {
  width: 100% !important;
  table-layout: fixed;
}

.responsive-table :deep(th),
.responsive-table :deep(td) {
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 8px !important;
  font-size: 0.875rem;
}

.responsive-table :deep(.selected-row) {
  background-color: #ff9800 !important;
}

.responsive-table :deep(.selected-row:hover) {
  background-color: #fb8c00 !important;
}
</style>
