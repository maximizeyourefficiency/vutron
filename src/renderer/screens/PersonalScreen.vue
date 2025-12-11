<template>
  <v-app>
    <v-container fluid>
      <h1 class="mb-4"> Personalübersicht </h1>

      <!-- Statistik -->
      <v-row class="mb-4">
        <v-col
          cols="12"
          sm="auto"
        >
          <v-card
            class="cursor-pointer"
            hover
            @click="addBaustelle"
          >
            <v-card-text class="py-2 px-4">
              <div class="text-caption"> Hinzufügen </div>
              <div class="text-subtitle-1 font-weight-medium">
                <v-icon :icon="mdiPlus" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Suchfeld -->
      <v-text-field
        v-model="search"
        label="Suche"
        :prepend-inner-icon="mdiMagnify"
        variant="outlined"
        hide-details
        single-line
        class="mb-4"
        clearable
      />

      <!-- Tabelle -->
      <v-data-table
        :headers="headers"
        :items="filteredPersonal"
        :loading="loading"
        :items-per-page="itemsPerPage"
        fixed-header
        height="600px"
        density="comfortable"
        class="elevation-1"
        :page="page"
        @update:page="page = $event"
      >
        <template #[`item.actions`]="{ item }">
          <v-btn
            icon
            @click="openEditDialog(item)"
          >
            <v-icon :icon="mdiPencil" />
          </v-btn>
        </template>

        <!-- Checkbox für OST -->
        <template #[`item.Ost`]="{ item }">
          <v-chip
            v-if="item.Ost == -1"
            color="success"
            size="small"
            variant="flat"
          >
            ✓
          </v-chip>
          <v-chip
            v-else
            color="grey"
            size="small"
            variant="outlined"
          >
            −
          </v-chip>
        </template>

        <!-- Checkbox für Beendet -->
        <template #[`item.Beendet`]="{ item }">
          <v-chip
            v-if="item.Beendet == -1"
            color="success"
            size="small"
            variant="flat"
          >
            ✓
          </v-chip>
          <v-chip
            v-else
            color="grey"
            size="small"
            variant="outlined"
          >
            −
          </v-chip>
        </template>

        <!-- Checkbox für Abgerechnet -->
        <template #[`item.Abgerechnet`]="{ item }">
          <v-chip
            v-if="item.Abgerechnet == -1"
            color="success"
            size="small"
            variant="flat"
          >
            ✓
          </v-chip>
          <v-chip
            v-else
            color="grey"
            size="small"
            variant="outlined"
          >
            −
          </v-chip>
        </template>

        <template #no-data>
          <v-alert
            type="info"
            border="start"
            prominent
          >
            Keine Daten geladen.
          </v-alert>
        </template>

        <!-- Lazy Loading Button am Ende der Tabelle -->
        <template #bottom>
          <div class="d-flex justify-space-between align-center pa-4">
            <div class="text-body-2">
              {{ filteredPersonal.length }} Einträge ({{ personal.length }} von
              {{ totalCount }} geladen)
            </div>
            <v-pagination
              v-model="page"
              :length="pageCount"
              :total-visible="7"
              size="small"
            />

            <v-btn
              v-if="hasMoreData"
              :loading="loading"
              :disabled="loading"
              color="primary"
              variant="outlined"
              size="small"
              @click="loadMorePersonal"
            >
              <v-icon
                start
                :icon="mdiDownload"
              />
              Mehr laden ({{ remainingCount }})
            </v-btn>
            <div
              v-else
              style="width: 150px"
            />
          </div>
        </template>
      </v-data-table>
    </v-container>

    <!-- Add Dialog -->
    <v-dialog
      v-model="addDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5 bg-primary">
          Neues Personal hinzufügen
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="addForm">
            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="newItem.AG_ID_F"
                  :items="bauleiterList"
                  item-title="AG_Name"
                  item-value="AG_ID"
                  label="Auftraggeber"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="3"
              >
                <v-text-field
                  v-model="newItem.PLZ"
                  label="PLZ"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                md="5"
              >
                <v-text-field
                  v-model="newItem.Ort"
                  label="Ort"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="newItem.Straße"
                  label="Straße"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="newItem.Baubeginn"
                  label="Baubeginn"
                  variant="outlined"
                  density="compact"
                  type="date"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <v-checkbox
                  v-model="newItem.Ost"
                  color="orange"
                  label="Ost"
                  :true-value="-1"
                  :false-value="0"
                  hide-details
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="newItem.Stunden"
                  label="Stunden"
                  variant="outlined"
                  density="compact"
                  type="number"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="newItem.Bemerkung"
                  label="Bemerkung"
                  variant="outlined"
                  density="compact"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="closeAddDialog"
          >
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="saveNewItem"
          >
            Hinzufügen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog
      v-model="editDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5 bg-primary">
          Baustelle bearbeiten
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="editForm">
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.Baustellennummer"
                  label="Baustellennummer"
                  variant="outlined"
                  density="compact"
                  readonly
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.Jahr"
                  label="Jahr"
                  variant="outlined"
                  density="compact"
                  type="number"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="editedItem.AG_ID_F"
                  :items="bauleiterList"
                  item-title="AG_Name"
                  item-value="AG_ID"
                  label="Auftraggeber"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="3"
              >
                <v-text-field
                  v-model="editedItem.PLZ"
                  label="PLZ"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                md="5"
              >
                <v-text-field
                  v-model="editedItem.Ort"
                  label="Ort"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-text-field
                  v-model="editedItem.Straße"
                  label="Straße"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.Baubeginn"
                  label="Baubeginn"
                  variant="outlined"
                  density="compact"
                  type="date"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.Bauende"
                  label="Bauende"
                  variant="outlined"
                  density="compact"
                  type="date"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <v-checkbox
                  v-model="editedItem.Ost"
                  color="orange"
                  label="Ost"
                  :true-value="-1"
                  :false-value="0"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-checkbox
                  v-model="editedItem.Beendet"
                  label="Beendet"
                  :true-value="-1"
                  :false-value="0"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
              >
                <v-checkbox
                  v-model="editedItem.Abgerechnet"
                  label="Abgerechnet"
                  :true-value="-1"
                  :false-value="0"
                  hide-details
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.Stunden"
                  label="Stunden"
                  variant="outlined"
                  density="compact"
                  type="number"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="editedItem.letzteRechnung"
                  label="Letzte Rechnung"
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.Bemerkung"
                  label="Bemerkung"
                  variant="outlined"
                  density="compact"
                  rows="3"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="closeEditDialog"
          >
            Abbrechen
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="saving"
            @click="saveItem"
          >
            Speichern
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { mdiPencil, mdiPlus, mdiMagnify, mdiDownload } from '@mdi/js'
import { openFile } from '@/renderer/utils'

const search = ref('')
const personal = ref([])
const loading = ref(false)
const totalCount = ref(0)
const currentOffset = ref(0)
const pageSize = 2000
const itemsPerPage = ref(2000)
const page = ref(1)
const bauleiterList = ref([])

const selectedFile = ref('')

const handleOpenFile = async () => {
  const dialogResult = await openFile('.db')
  if (!dialogResult.canceled) {
    selectedFile.value = dialogResult.filePaths[0]
    console.log(selectedFile.value)
    window.electron.connect(selectedFile.value)
  }
}

// Add Dialog
const addDialog = ref(false)
const newItem = ref({
  AG_ID_F: '',
  PLZ: '',
  Ort: '',
  Straße: '',
  Ost: 0,
  Baubeginn: '',
  Bauende: '',
  Beendet: 0,
  Stunden: 0,
  Abgerechnet: 0,
  Bemerkung: ''
})

// Edit Dialog
const editDialog = ref(false)
const editedItem = ref({})
const editedIndex = ref(-1)
const saving = ref(false)

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

let loadLock = false

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
  { title: 'Bild', key: 'Bild' },
  { title: 'Kommentar', key: 'Kommentar' },
  { title: 'Ausloese_psch_setzen', key: 'Ausloese_psch_setzen' },
  { title: 'Lohnrelevant', key: 'Lohnrelevant' },
  { title: 'Ausloese_psch_setzen', key: 'Ausloese_psch_setzen' },
  { title: 'verheiratet', key: 'verheiratet' },
  { title: 'Kinder', key: 'Kinder' },
  { title: 'Bauleiter_ID_F', key: 'Bauleiter_ID_F' }
]

const filteredPersonal = computed(() => {
  if (!search.value) return personal.value

  const searchLower = search.value.toLowerCase()
  return personal.value.filter((item) => {
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchLower)
    )
  })
})

const pageCount = computed(() => {
  return Math.ceil(filteredPersonal.value.length / itemsPerPage.value)
})

const hasMoreData = computed(() => {
  return currentOffset.value < totalCount.value
})

const remainingCount = computed(() => {
  return Math.max(0, totalCount.value - currentOffset.value)
})

// Add Dialog Funktionen
function addBaustelle() {
  newItem.value = {
    AG_ID_F: '',
    PLZ: '',
    Ort: '',
    Straße: '',
    Ost: 0,
    Baubeginn: '',
    Bauende: '',
    Beendet: 0,
    Stunden: 0,
    Abgerechnet: 0,
    Bemerkung: ''
  }
  addDialog.value = true
}

function closeAddDialog() {
  addDialog.value = false
  setTimeout(() => {
    newItem.value = {
      AG_ID_F: '',
      PLZ: '',
      Ort: '',
      Straße: '',
      Ost: 0,
      Baubeginn: '',
      Bauende: '',
      Beendet: 0,
      Stunden: 0,
      Abgerechnet: 0,
      Bemerkung: ''
    }
  }, 300)
}

async function loadBauleiterData() {
  try {
    const result = await window.electron.getAll(
      `SELECT Bauleiter_ID, NAme FROM tblbauleiter`
    )
    if (Array.isArray(result)) {
      bauleiterList.value = await result
      //bauleiterList.value = result
      //currentOffset.value = result.length
      console.debug('[Bauleiterlist] Initial geladen:', bauleiterList.value)
    } else {
      console.warn('[Bauleiterlist] Kein Array:', result)
      bauleiterList.value = []
    }
  } catch (err) {
    console.error('[Bauleiterlist] Fehler beim Laden:', err)
    bauleiterList.value = []
  }
}

async function saveNewItem() {
  saving.value = true
  console.log('Available methods:', Object.keys(window.electron || {}))
  try {
    // Extrahiere AG_ID aus dem Objekt falls es ein Objekt ist
    const agId =
      typeof newItem.value.AG_ID_F === 'object'
        ? newItem.value.AG_ID_F.AG_ID
        : newItem.value.AG_ID_F
    const insert = [
      {
        sql: `INSERT INTO tblbaustellen (PLZ, Ort, Straße, Ost, Baubeginn, Bauende, Beendet, Stunden, Abgerechnet, Bemerkung, AG_ID_F) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          newItem.value.PLZ,
          newItem.value.Ort,
          newItem.value.Straße,
          newItem.value.Ost,
          newItem.value.Baubeginn,
          newItem.value.Bauende,
          newItem.value.Beendet,
          newItem.value.Stunden,
          newItem.value.Abgerechnet,
          newItem.value.Bemerkung,
          agId
        ]
      }
    ]
    console.log('insert:', insert)
    const txResult = await window.electron.transaction(insert)
    console.log('inserted:', txResult.count)
    // Liste neu laden, um die neue Baustelle anzuzeigen
    currentOffset.value = 0
    await loadPersonal()

    showSnackbar('Baustelle erfolgreich hinzugefügt', 'success')
    closeAddDialog()
  } catch (err) {
    console.error('[Baustellen] Fehler beim Hinzufügen:', err)
    showSnackbar('Fehler beim Hinzufügen der Baustelle', 'error')
  } finally {
    saving.value = false
  }
}

// Edit Dialog Funktionen
function openEditDialog(item) {
  editedIndex.value = personal.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

function closeEditDialog() {
  editDialog.value = false
  setTimeout(() => {
    editedItem.value = {}
    editedIndex.value = -1
  }, 300)
}

async function saveItem() {
  saving.value = true
  console.log('Available methods:', Object.keys(window.electron || {}))
  try {
    // Extrahiere AG_ID aus dem Objekt falls es ein Objekt ist
    const agId =
      typeof editedItem.value.AG_ID_F === 'object'
        ? editedItem.value.AG_ID_F.AG_ID
        : editedItem.value.AG_ID_F

    const updates = [
      {
        sql: `UPDATE tblbaustellen SET Jahr = ?, PLZ = ?, Ort = ?, Straße = ?, Ost = ?, Baubeginn = ?, Bauende = ?, Beendet = ?, Stunden = ?, Abgerechnet = ?, Bemerkung = ?, letzteRechnung = ?, AG_ID_F = ? WHERE Baustellen_ID = ?`,
        params: [
          editedItem.value.Jahr,
          editedItem.value.PLZ,
          editedItem.value.Ort,
          editedItem.value.Straße,
          editedItem.value.Ost,
          editedItem.value.Baubeginn,
          editedItem.value.Bauende,
          editedItem.value.Beendet,
          editedItem.value.Stunden,
          editedItem.value.Abgerechnet,
          editedItem.value.Bemerkung,
          editedItem.value.letzteRechnung,
          agId, // Verwende die extrahierte AG_ID
          editedItem.value.Baustellen_ID
        ]
      }
    ]
    console.log('updates:', updates)
    const txResult = await window.electron.transaction(updates)
    console.log('Updated:', txResult.count)

    // Aktualisiere das Item in der lokalen Liste
    if (editedIndex.value > -1) {
      Object.assign(personal.value[editedIndex.value], editedItem.value)
    }

    showSnackbar('Person erfolgreich gespeichert', 'success')
    closeEditDialog()
  } catch (err) {
    console.error('[Personal] Fehler beim Speichern:', err)
    showSnackbar('Fehler beim Speichern der Baustelle', 'error')
  } finally {
    saving.value = false
  }
}

function showSnackbar(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

async function getTotalCount() {
  try {
    const result = await window.electron.getAll(
      `SELECT COUNT(*) as total 
       FROM tblpersonal`
    )
    if (result && result[0]) {
      totalCount.value = result[0].total
      console.debug('[Personal] Total count:', totalCount.value)
    }
    // Prüfe ob totalCount.value undefined ist (egal wo im Code)
    if (totalCount.value === undefined) {
      console.warn(
        '[Personal] Total count ist undefined, führe handleOpenFile() aus'
      )
      await handleOpenFile()
      window.location.reload()
    }
  } catch (err) {
    console.error('[Personal] Fehler beim Zählen:', err)
    await handleOpenFile()
    window.location.reload()
  }
}

async function loadPersonal() {
  if (loadLock) {
    console.debug('[Personal] Load bereits aktiv')
    return
  }

  loadLock = true
  loading.value = true
  console.debug('[Personal] Initial load start')

  try {
    await getTotalCount()

    const result = await window.electron.getAll(
      `SELECT *
      FROM tblPersonal
      LEFT JOIN tblbauleiter ON tblPersonal.Bauleiter_ID_F = tblbauleiter.Bauleiter_ID
      ORDER BY tblPersonal.Person_ID DESC 
      LIMIT ${pageSize} OFFSET 0`
    )

    if (Array.isArray(result)) {
      personal.value = result
      currentOffset.value = result.length
      console.debug('[Personal] Initial geladen:', result.length)
    } else {
      console.warn('[Personal] Kein Array:', result)
      personal.value = []
    }
  } catch (err) {
    console.error('[Personal] Fehler beim Laden:', err)
    personal.value = []
  } finally {
    loadLock = false
    loading.value = false
  }
}

async function loadMorePersonal() {
  if (loadLock || !hasMoreData.value) {
    return
  }

  loadLock = true
  loading.value = true
  console.debug('[personal] Loading more, offset:', currentOffset.value)

  try {
    const result = await window.electron.getAll(
      `SELECT *
      FROM tblPersonal
      INNER JOIN tblbauleiter ON tblPersonal.Bauleiter_ID_F = tblbauleiter.Bauleiter_ID
      LIMIT ${pageSize} OFFSET ${currentOffset.value}`
    )

    if (Array.isArray(result) && result.length > 0) {
      personal.value = [...personal.value, ...result]
      currentOffset.value += result.length
      console.debug(
        '[personal] Weitere geladen:',
        result.length,
        'Total:',
        personal.value.length
      )
    }
  } catch (err) {
    console.error('[personal] Fehler beim Nachladen:', err)
  } finally {
    loadLock = false
    loading.value = false
  }
}

onMounted(() => {
  console.debug('[personal] Component mounted')
  loadPersonal()
  loadBauleiterData()
})

onBeforeUnmount(() => {
  console.debug('[personal] Component unmounted')
  loadLock = false
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
h1 {
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
