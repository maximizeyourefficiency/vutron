<template>
  <v-app>
    <v-container fluid>
      <h1 class="mb-4">Baustellenübersicht</h1>

      <!-- Statistik -->
      <v-row class="mb-4">
        <v-col
          cols="12"
          sm="auto"
        >
          <v-card
            class="cursor-pointer"
            hover
            @click="loadMoreBaustellen"
          >
            <v-card-text class="py-2 px-4">
              <div class="text-caption">Geladen</div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ baustellen.length }} / {{ totalCount }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
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
              <div class="text-caption">Geladen</div>
              <div class="text-subtitle-1 font-weight-medium">
                {{ baustellen.length }} / {{ totalCount }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Suchfeld -->
      <v-text-field
        v-model="search"
        label="Suche"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
        class="mb-4"
        clearable
      />

      <!-- Tabelle -->
      <v-data-table
        :headers="headers"
        :items="filteredBaustellen"
        :loading="loading"
        :items-per-page="itemsPerPage"
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
            <v-icon>mdi-pencil</v-icon>
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
              {{ filteredBaustellen.length }} Einträge ({{
                baustellen.length
              }}
              von {{ totalCount }} geladen)
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
              @click="loadMoreBaustellen"
            >
              <v-icon start>mdi-download</v-icon>
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
                <v-text-field
                  v-model="editedItem.AG_Name"
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

const search = ref('')
const baustellen = ref([])
const loading = ref(false)
const totalCount = ref(0)
const currentOffset = ref(0)
const pageSize = 2000
const itemsPerPage = ref(50)
const page = ref(1)

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
  { title: 'Nummer', key: 'Baustellennummer' },
  { title: 'Jahr', key: 'Jahr' },
  { title: 'AG kurz', key: 'AG_Name' },
  { title: 'PLZ', key: 'PLZ' },
  { title: 'Ort', key: 'Ort' },
  { title: 'Straße', key: 'Straße' },
  { title: 'Ost', key: 'Ost' },
  { title: 'Baubeginn', key: 'Baubeginn' },
  { title: 'Bauende', key: 'Bauende' },
  { title: 'Beendet', key: 'Beendet' },
  { title: 'Stunden', key: 'Stunden' },
  { title: 'Abgerechnet', key: 'Abgerechnet' },
  { title: 'Bemerkung', key: 'Bemerkung' },
  { title: 'Letzte Rechnung', key: 'letzteRechnung' }
]

const filteredBaustellen = computed(() => {
  if (!search.value) return baustellen.value

  const searchLower = search.value.toLowerCase()
  return baustellen.value.filter((item) => {
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchLower)
    )
  })
})

const pageCount = computed(() => {
  return Math.ceil(filteredBaustellen.value.length / itemsPerPage.value)
})

const hasMoreData = computed(() => {
  return currentOffset.value < totalCount.value
})

const remainingCount = computed(() => {
  return Math.max(0, totalCount.value - currentOffset.value)
})

// Edit Dialog Funktionen
function openEditDialog(item) {
  editedIndex.value = baustellen.value.indexOf(item)
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

  try {
    // Hier würde normalerweise ein API-Aufruf zum Speichern erfolgen
    // Beispiel:
    await window.api.equery(
      `UPDATE tblbaustellen SET
         Jahr = ?, PLZ = ?, Ort = ?, Straße = ?,
         Ost = ?, Baubeginn = ?, Bauende = ?, Beendet = ?,
         Stunden = ?, Abgerechnet = ?, Bemerkung = ?, letzteRechnung = ?
       WHERE Baustellen_ID = ${editedItem.value.Baustellen_ID}`,
      [
        editedItem.value.Jahr,
        editedItem.value.PLZ,
        editedItem.value.Jahr,
        editedItem.value.Straße,
        editedItem.value.Ost,
        editedItem.value.Baubeginn,
        editedItem.value.Bauende,
        editedItem.value.Beendet,
        editedItem.value.Stunden,
        editedItem.value.Abgerechnet,
        editedItem.value.Bemerkung,
        editedItem.value.letzteRechnung
      ]
    )

    // Aktualisiere das Item in der lokalen Liste
    if (editedIndex.value > -1) {
      Object.assign(baustellen.value[editedIndex.value], editedItem.value)
    }

    showSnackbar('Baustelle erfolgreich gespeichert', 'success')
    closeEditDialog()
  } catch (err) {
    console.error('[Baustellen] Fehler beim Speichern:', err)
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
    const result = await window.api.fetchall(
      `SELECT COUNT(*) as total 
       FROM tblbaustellen
       WHERE Baustellen_ID NOT BETWEEN 3734 AND 3738 
         AND Baustellen_ID <> 4361`
    )

    if (result && result[0]) {
      totalCount.value = result[0].total
      console.debug('[Baustellen] Total count:', totalCount.value)
    }
  } catch (err) {
    console.error('[Baustellen] Fehler beim Zählen:', err)
  }
}

async function loadBaustellen() {
  if (loadLock) {
    console.debug('[Baustellen] Load bereits aktiv')
    return
  }

  loadLock = true
  loading.value = true
  console.debug('[Baustellen] Initial load start')

  try {
    await getTotalCount()

    const result = await window.api.fetchall(
      `SELECT
        tblbaustellen.Baustellen_ID,
        tblbaustellen.Baustellennummer,
        tblbaustellen.Jahr,
        tblAG.AG_Name,
        tblbaustellen.PLZ,
        tblbaustellen.Ort,
        tblbaustellen.Straße,
        tblbaustellen.Ost,
        tblbaustellen.Baubeginn,
        tblbaustellen.Bauende,
        tblbaustellen.Beendet,
        tblbaustellen.Stunden,
        tblbaustellen.Abgerechnet,
        tblbaustellen.Bemerkung,
        tblbaustellen.letzteRechnung
      FROM tblbaustellen
      INNER JOIN tblAG ON tblbaustellen.AG_ID_F = tblAG.AG_ID
      WHERE tblbaustellen.Baustellen_ID NOT BETWEEN 3734 AND 3738 
        AND tblbaustellen.Baustellen_ID <> 4361
      ORDER BY tblbaustellen.Baustellennummer DESC 
      LIMIT ${pageSize} OFFSET 0`
    )

    if (Array.isArray(result)) {
      baustellen.value = result
      currentOffset.value = result.length
      console.debug('[Baustellen] Initial geladen:', result.length)
    } else {
      console.warn('[Baustellen] Kein Array:', result)
      baustellen.value = []
    }
  } catch (err) {
    console.error('[Baustellen] Fehler beim Laden:', err)
    baustellen.value = []
  } finally {
    loadLock = false
    loading.value = false
  }
}

async function loadMoreBaustellen() {
  if (loadLock || !hasMoreData.value) {
    return
  }

  loadLock = true
  loading.value = true
  console.debug('[Baustellen] Loading more, offset:', currentOffset.value)

  try {
    const result = await window.api.fetchall(
      `SELECT 
        tblbaustellen.Baustellennummer,
        tblbaustellen.Jahr,
        tblAG.AG_Name,
        tblbaustellen.PLZ,
        tblbaustellen.Ort,
        tblbaustellen.Straße,
        tblbaustellen.Ost,
        tblbaustellen.Baubeginn,
        tblbaustellen.Bauende,
        tblbaustellen.Beendet,
        tblbaustellen.Stunden,
        tblbaustellen.Abgerechnet,
        tblbaustellen.Bemerkung,
        tblbaustellen.letzteRechnung
      FROM tblbaustellen
      INNER JOIN tblAG ON tblbaustellen.AG_ID_F = tblAG.AG_ID
      WHERE tblbaustellen.Baustellen_ID NOT BETWEEN 3734 AND 3738 
        AND tblbaustellen.Baustellen_ID <> 4361
      ORDER BY tblbaustellen.Baustellennummer DESC 
      LIMIT ${pageSize} OFFSET ${currentOffset.value}`
    )

    if (Array.isArray(result) && result.length > 0) {
      baustellen.value = [...baustellen.value, ...result]
      currentOffset.value += result.length
      console.debug(
        '[Baustellen] Weitere geladen:',
        result.length,
        'Total:',
        baustellen.value.length
      )
    }
  } catch (err) {
    console.error('[Baustellen] Fehler beim Nachladen:', err)
  } finally {
    loadLock = false
    loading.value = false
  }
}

onMounted(() => {
  console.debug('[Baustellen] Component mounted')
  loadBaustellen()
})

onBeforeUnmount(() => {
  console.debug('[Baustellen] Component unmounted')
  loadLock = false
})
</script>

<style scoped>
h1 {
  font-weight: 500;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
