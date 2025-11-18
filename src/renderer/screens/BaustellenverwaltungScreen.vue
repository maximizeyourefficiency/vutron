<template>
  <v-app>
    <v-container fluid>
      <h1 class="mb-4"> Baustellenübersicht </h1>

      <!-- Suchfeld -->
      <v-text-field
        v-model="search"
        label="Suche"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
        class="mb-4"
      />

      <!-- Tabelle -->
      <v-data-table
        :headers="headers"
        :items="baustellen"
        :search="search"
        :items-per-page="100"
        class="elevation-1"
      >
        <!-- Checkbox für OST -->
        <template #[`item.Ost`]="{ item }">
          <v-checkbox
            v-model="item.Ost"
            :true-value="1"
            :false-value="0"
            density="compact"
            hide-details
            disabled
          />
        </template>
        <template #[`item.Beendet`]="{ item }">
          <v-checkbox
            v-model="item.Beendet"
            :true-value="1"
            :false-value="0"
            density="compact"
            hide-details
            disabled
          />
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
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const search = ref('') // <-- neu
const baustellen = ref([])

const headers = [
  //{ title: 'ID', key: 'Baustellen_ID' },
  { title: 'Nummer', key: 'Baustellennummer' },
  { title: 'Jahr', key: 'Jahr' },
  { title: 'AG kurz', key: 'AG_Name' },
  { title: 'PLZ', key: 'PLZ' },
  { title: 'Ort', key: 'Ort' },
  { title: 'Straße', key: 'Straße' },
  { title: 'Ost', key: 'Ost', sortable: false },
  { title: 'Baubeginn', key: 'Baubeginn' },
  { title: 'Bauende', key: 'Bauende' },
  { title: 'Beendet', key: 'Beendet' },
  { title: 'Stunden', key: 'Stunden' },
  { title: 'Abgerechnet', key: 'Abgerechnet' },
  { title: 'Bemerkung', key: 'Bemerkung' },
  { title: 'Letzte Rechnung', key: 'letzteRechnung' }
]

async function loadBaustellen() {
  try {
    const result = await window.api.fetchall(
      'SELECT * FROM (tblbaustellen LEFT JOIN tblbauleiter ON tblbaustellen.Bauleiter_ID_F = tblbauleiter.Bauleiter_ID) INNER JOIN tblAG ON tblbaustellen.AG_ID_F = tblAG.AG_ID WHERE (((tblbaustellen.Baustellen_ID) NOT BETWEEN 3734 AND 3738 AND tblbaustellen.Baustellen_ID <> 4361)) ORDER BY tblbaustellen.Baustellennummer DESC'
    )
    if (Array.isArray(result)) {
      baustellen.value = result
    }
  } catch (err) {
    console.error('Fehler beim Laden:', err)
  }
}

onMounted(() => {
  loadBaustellen()
})
</script>

<style scoped>
h1 {
  font-weight: 500;
}
</style>
