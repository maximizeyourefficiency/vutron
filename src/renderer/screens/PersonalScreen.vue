<template>
  <v-container>
    <v-sheet border>
      <v-data-table
        :headers="headers"
        :items="plants"
        hide-default-footer
      >
        <template #[`item.color`]="{ item }">
          <v-chip
            :text="item.color"
            color="medium-emphasis"
            size="small"
            border
          >
            <template #prepend>
              <v-avatar
                :color="item.color.toLowerCase()"
                border="thin opacity-25"
                size="16"
                start
              />
            </template>
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item, index }">
          <div class="d-flex ga-2 justify-end">
            <v-icon-btn
              icon="mdi-pencil"
              size="24"
              variant="plain"
              @click="onClickEdit(item)"
            >
              <v-icon size="16" />
            </v-icon-btn>

            <v-icon-btn
              icon="mdi-delete-outline"
              size="24"
              variant="plain"
              @click="onClickDelete(index)"
            >
              <v-icon size="16" />
            </v-icon-btn>
          </div>
        </template>

        <template #no-data>
          <v-btn
            prepend-icon="mdi-backup-restore"
            rounded="lg"
            text="Reset data"
            variant="text"
            border
            @click="onClickReset"
          />
        </template>
      </v-data-table>
    </v-sheet>

    <v-dialog
      v-model="dialog"
      max-width="450"
      @after-leave="onAfterLeave"
    >
      <v-card
        density="compact"
        title="Edit"
      >
        <v-divider />

        <v-card-text>
          <v-text-field
            v-model="record.title"
            density="compact"
            label="Title"
            variant="outlined"
            rounded
          />

          <v-text-field
            v-model="record.color"
            density="compact"
            label="Color"
            variant="outlined"
            rounded
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="bg-surface-light">
          <v-spacer />

          <v-icon-btn
            :loading="isSaving"
            color="primary"
            icon="mdi-content-save"
            variant="flat"
            @click="onClickSave"
          />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup>
import { ref, shallowRef } from 'vue'

const DEFAULT_RECORD = () => ({ title: '', color: '' })
const DEFAULT_RECORDS = () => [
  { id: 1, title: '🌹 Rose', color: 'Red' },
  { id: 2, title: '🌷 Tulip', color: 'Yellow' },
  { id: 3, title: '🌻 Sunflower', color: 'Yellow' },
  { id: 4, title: '🌼 Daisy', color: 'White' },
  { id: 5, title: '🥀 Orchid', color: 'Purple' }
]

const isSaving = shallowRef(false)
const dialog = shallowRef(false)
const record = shallowRef(DEFAULT_RECORD())

const headers = [
  { title: 'Title', align: 'start', key: 'title' },
  { title: 'Color', align: 'end', key: 'color' },
  { title: 'Actions', align: 'end', key: 'actions' }
]

const plants = ref(DEFAULT_RECORDS())

function onAfterLeave() {
  record.value = DEFAULT_RECORD()
}

function onClickDelete(index) {
  plants.value.splice(index, 1)
}

function onClickEdit(item) {
  dialog.value = true
  record.value = { ...item }
}

function onClickReset() {
  plants.value = DEFAULT_RECORDS()
}

async function onClickSave() {
  isSaving.value = true

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const index = plants.value.findIndex((plant) => plant.id === record.value.id)

  plants.value[index] = { ...record.value }

  dialog.value = false
  isSaving.value = false
}
</script>
