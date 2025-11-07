<template>
  <v-app>
    <v-container>
      <h1 class="mb-4"> Baustellenübersicht </h1>

      <!-- Button zum Laden der Daten -->
      <v-btn
        color="primary"
        class="mb-4"
        @click="loaddb"
      >
        Datenbank laden
      </v-btn>
      <!-- Button zum Laden der Daten -->
      <v-btn
        color="primary"
        class="mb-4"
        @click="loadBauleiter"
      >
        fetchonetest
      </v-btn>
      <!-- Tabelle mit den Baustellen -->
      <v-data-table
        :headers="headers"
        :items="baustellen"
        :items-per-page="10"
        class="elevation-1"
      >
        <template #no-data>
          <v-alert
            type="info"
            border="start"
            prominent
          >
            Keine Daten geladen. Bitte oben auf
            <strong>"Daten laden"</strong> klicken.
          </v-alert>
        </template>
      </v-data-table>
    </v-container>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

// Reaktive Variable für Daten
const baustellen = ref([])
// Tabellenkopfdefinition
const headers = [
  { title: 'ID', key: 'Baustellen_ID' },
  { title: 'Nummer', key: 'Baustellennummer' },
  { title: 'PLZ', key: 'PLZ' },
  { title: 'Ort', key: 'Ort' },
  { title: 'Straße', key: 'Straße' },
  { title: 'Baubeginn', key: 'Baubeginn' },
  { title: 'Bauende', key: 'Bauende' },
  { title: 'Beendet', key: 'Beendet' },
  { title: 'Stunden', key: 'Stunden' },
  { title: 'Abgerechnet', key: 'Abgerechnet' },
  { title: 'Bemerkung', key: 'Bemerkung' },
  { title: 'Letzte Rechnung', key: 'letzteRechnung' }
]

async function loaddb() {
  window.api.path()
}

async function loadBauleiter() {
  const data = await window.api.fetchalltest(
    '"SELECT * FROM tblbauleiter WHERE Bauleiter_ID = ?", "2"'
  )
  console.log(data)
}
/* Funktion zum Laden der Daten aus SQLite
async function path() {
  try {
    baustellen.value = await window.api.connect()
  } catch (err) {
    console.error('Fehler beim Laden der Daten:', err)
  }
}
async function loadData() {
  try {
    baustellen.value = await window.api.equery()
    console.log(baustellen.value)
  } catch (err) {
    console.error('Fehler beim Laden der Daten:', err)
  }
}
*/
</script>

<style scoped>
h1 {
  font-weight: 500;
}
</style>
