<template>
  <v-app>
    <v-container fluid>
      <!-- Datum-Auswahl -->
      <v-row class="mb-4">
        <v-col cols="auto">
          <v-text-field
            v-model="selectedDate"
            label="Datum"
            type="date"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 160px"
          />
        </v-col>
        <v-col
          cols="12"
          sm="auto"
        >
          <v-btn
            color="primary"
            variant="elevated"
            @click="addRow"
          >
            <v-icon
              start
              :icon="mdiPlus"
            />
            Neue Zeile
          </v-btn>
        </v-col>
      </v-row>

      <!-- Erfassungstabelle -->
      <v-data-table
        :headers="headers"
        :items="erfassungszeilen"
        :loading="loading"
        density="comfortable"
        class="elevation-1"
        fixed-header
        height="600px"
        :items-per-page="-1"
        hide-default-footer
      >
        <!-- Baustellennummer Dropdown -->
        <template #[`item.baustellen_id`]="{ item }">
          <v-autocomplete
            v-model="item.baustellen_id"
            :items="baustellenList"
            item-title="Baustellennummer"
            item-value="Baustellen_ID"
            variant="outlined"
            density="compact"
            hide-details
            return-object
            style="min-width: 150px"
            @update:model-value="onBaustelleChange(item)"
          />
        </template>

        <!-- Ort (readonly) -->
        <template #[`item.ort`]="{ item }">
          <span>{{ item.baustellen_id?.Ort || '' }}</span>
        </template>

        <!-- Straße (readonly) -->
        <template #[`item.strasse`]="{ item }">
          <span>{{ item.baustellen_id?.Straße || '' }}</span>
        </template>

        <!-- Personal Kürzel Dropdown -->
        <template #[`item.personal_id`]="{ item }">
          <v-autocomplete
            v-model="item.personal_id"
            :items="personalList"
            item-title="Kuerzel"
            item-value="Person_ID"
            variant="outlined"
            density="compact"
            hide-details
            return-object
            style="min-width: 100px"
            @update:model-value="onPersonalChange(item)"
            @blur="onRowBlur(item)"
          />
        </template>

        <!-- Aktionen -->
        <template #[`item.actions`]="{ item, index }">
          <v-btn
            icon
            size="small"
            color="error"
            variant="text"
            @click="removeRow(index)"
          >
            <v-icon :icon="mdiDelete" />
          </v-btn>
          <v-icon
            v-if="item.saved"
            :icon="mdiCheck"
            color="success"
            size="small"
            class="ml-2"
          />
        </template>

        <template #no-data>
          <v-alert
            border="start"
            prominent
          >
            Keine Erfassungszeilen vorhanden. Klicken Sie auf "Neue Zeile" um zu
            beginnen.
          </v-alert>
        </template>
      </v-data-table>
    </v-container>

    <!-- Snackbar für Benachrichtigungen -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar = false"
        >
          Schließen
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { mdiPlus, mdiDelete, mdiCheck } from '@mdi/js'

// Datum - Standard: heute
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)

// Daten
const erfassungszeilen = ref([])
const baustellenList = ref([])
const personalList = ref([])
const loading = ref(false)

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
  {
    title: 'Baustellennummer',
    key: 'baustellen_id',
    sortable: false,
    width: '180px'
  },
  { title: 'Ort', key: 'ort', sortable: false },
  { title: 'Straße', key: 'strasse', sortable: false },
  { title: 'Kürzel', key: 'personal_id', sortable: false, width: '120px' },
  { title: '', key: 'actions', sortable: false, width: '100px' }
]

function showSnackbar(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

function addRow() {
  erfassungszeilen.value.push({
    baustellen_id: null,
    personal_id: null,
    saved: false
  })
}

function removeRow(index) {
  erfassungszeilen.value.splice(index, 1)
}

function onBaustelleChange(item) {
  // Markiere als nicht gespeichert wenn geändert
  item.saved = false
}

function onPersonalChange(item) {
  // Markiere als nicht gespeichert wenn geändert
  item.saved = false
}

async function onRowBlur(item) {
  // Speichere nur wenn beide Felder ausgefüllt sind und noch nicht gespeichert
  if (item.baustellen_id && item.personal_id && !item.saved) {
    await saveRow(item)
  }
}

async function saveRow(item) {
  try {
    const baustellenId =
      typeof item.baustellen_id === 'object'
        ? item.baustellen_id.Baustellen_ID
        : item.baustellen_id

    const personalId =
      typeof item.personal_id === 'object'
        ? item.personal_id.Person_ID
        : item.personal_id

    // datum_id berechnen: Tag des Jahres + Jahr (z.B. 1. Januar 2026 = 12026)
    const date = new Date(selectedDate.value)
    const year = date.getFullYear()
    const start = new Date(year, 0, 0)
    const diff = date.getTime() - start.getTime()
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    const datumId = dayOfYear * 10000 + year

    console.log('[Erfassung] Speichere:', {
      baustellenId,
      personalId,
      datumId
    })

    const insert = [
      {
        sql: `INSERT INTO tblbaustellendaten (Baustellen_ID_F, Personal_ID_F, datum_id) VALUES (?, ?, ?)`,
        params: [baustellenId, personalId, datumId]
      }
    ]

    await window.electron.transaction(insert)
    item.saved = true
    showSnackbar('Eintrag gespeichert', 'success')
  } catch (err) {
    console.error('[Erfassung] Fehler beim Speichern:', err)
    showSnackbar('Fehler beim Speichern: ' + err.message, 'error')
  }
}

async function loadBaustellen() {
  try {
    const result = await window.electron.getAll(
      `SELECT Baustellen_ID, Baustellennummer, Ort, Straße
       FROM tblbaustellen
       WHERE Beendet = 0
       ORDER BY Baustellennummer DESC`
    )
    if (Array.isArray(result)) {
      baustellenList.value = result
      console.debug('[Erfassung] Baustellen geladen:', result.length)
    }
  } catch (err) {
    console.error('[Erfassung] Fehler beim Laden der Baustellen:', err)
  }
}

async function loadPersonal() {
  try {
    const result = await window.electron.getAll(
      `SELECT Person_ID, Kuerzel
       FROM tblpersonal
       WHERE Aktiv <> 0 AND Lohnrelevant <> 0
       ORDER BY Kuerzel`
    )
    if (Array.isArray(result)) {
      personalList.value = result
      console.debug('[Erfassung] Personal geladen:', result.length)
    }
  } catch (err) {
    console.error('[Erfassung] Fehler beim Laden des Personals:', err)
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadBaustellen(), loadPersonal()])
  loading.value = false
})
</script>

<style>
body {
  overflow-y: hidden !important;
}

html {
  overflow-y: hidden !important;
}
</style>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
