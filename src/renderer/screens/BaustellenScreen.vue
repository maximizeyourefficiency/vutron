<template>
  <v-app>
    <v-container fluid>
      <h1 class="mb-4"> Baustellenübersicht </h1>

      <!-- Statistik -->
      <v-row class="mb-4">
        <v-col
          cols="12"
          md="3"
        >
          <v-card>
            <v-card-text>
              <div class="text-caption"> Geladen </div>
              <div class="text-h6">
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
        <!-- Checkbox für Beendet -->
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
              <v-icon start> mdi-download </v-icon>
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
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const search = ref('')
const baustellen = ref([])
const loading = ref(false)
const totalCount = ref(0)
const currentOffset = ref(0)
const pageSize = 2000 // Anzahl pro Ladevorgang
const itemsPerPage = ref(50) // Anzeige pro Seite in der Tabelle
const page = ref(1)

let loadLock = false

const headers = [
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

// Gefilterte Baustellen basierend auf Suche
const filteredBaustellen = computed(() => {
  if (!search.value) return baustellen.value

  const searchLower = search.value.toLowerCase()
  return baustellen.value.filter((item) => {
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchLower)
    )
  })
})

// Seitenanzahl berechnen
const pageCount = computed(() => {
  return Math.ceil(filteredBaustellen.value.length / itemsPerPage.value)
})

// Prüfen ob mehr Daten verfügbar sind
const hasMoreData = computed(() => {
  return currentOffset.value < totalCount.value
})

// Verbleibende Datensätze
const remainingCount = computed(() => {
  return Math.max(0, totalCount.value - currentOffset.value)
})

// Gesamtanzahl der Baustellen ermitteln
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

// Initiales Laden der ersten Baustellen
async function loadBaustellen() {
  if (loadLock) {
    console.debug('[Baustellen] Load bereits aktiv')
    return
  }

  loadLock = true
  loading.value = true
  console.debug('[Baustellen] Initial load start')

  try {
    // Erst Gesamtanzahl ermitteln
    await getTotalCount()

    // Dann erste Daten laden
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

// Weitere Baustellen nachladen
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
</style>
