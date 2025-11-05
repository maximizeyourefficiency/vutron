<script setup lang="tsx">
import { useI18n } from 'vue-i18n'
import { mdiEmoticonCoolOutline } from '@mdi/js'

const { t } = useI18n()

const api = window.api
</script>

<template>
  <v-container>
    <v-row
      no-gutters
      class="text-center"
    >
      <v-col cols="12">
        <v-icon
          :icon="mdiEmoticonCoolOutline"
          size="250"
          color="#009f57"
        />
      </v-col>

      <v-col
        cols="12"
        class="my-4"
      >
        {{ t('desc.second-desc') }}
      </v-col>
    </v-row>

    <!-- Datenbank-Formularbereich -->
    <v-row>
      <v-col cols="12">
        <v-form>
          <v-btn
            color="primary"
            @click="api.path()"
          >
            Enter path of the database
          </v-btn>
          <p id="pout" />

          <v-text-field
            id="singlequery"
            label="Enter the query e.g. INSERT INTO sqlite_master (name, type, sql) VALUES (?, ?, ?)"
            variant="outlined"
          />
          <v-text-field
            id="value"
            label="Enter the value in array e.g. ['name', 'query', 'SQL']"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="api.equery()"
          >
            Execute a Single Query
          </v-btn>
          <p id="pout1" />

          <v-text-field
            id="fetchallquery"
            label="Enter the query e.g. SELECT * FROM sqlite_master"
            variant="outlined"
          />
          <v-text-field
            id="fetchallvalue"
            label="Enter the value in array e.g. ['name', 'query', 'SQL']"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="api.fetchall()"
          >
            Fetch all records
          </v-btn>
          <p id="poutfa" />

          <v-text-field
            id="fetchonequery"
            label="Enter the query e.g. SELECT * FROM sqlite_master"
            variant="outlined"
          />
          <v-text-field
            id="fetchonevalue"
            label="Enter the value in array e.g. ['name', 'query', 'SQL']"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="api.fetchone()"
          >
            Fetch one record
          </v-btn>
          <p id="poutfo" />

          <v-text-field
            id="fetchmanyquery"
            label="Enter the query e.g. SELECT * FROM sqlite_master"
            variant="outlined"
          />
          <v-text-field
            id="fetchmanyvalue"
            label="Enter the value in array e.g. ['name', 'query', 'SQL']"
            variant="outlined"
          />
          <v-text-field
            id="fetchmanysize"
            label="Enter the size e.g. 2"
            type="number"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="window.api.fetchmany()"
          >
            Fetch multiple records
          </v-btn>
          <p id="poutfm" />

          <v-text-field
            id="query"
            label="Enter the query"
            variant="outlined"
          />
          <v-text-field
            id="values"
            label="Enter the values in 2D array e.g. [['n', 2, 2.5], [1, 2, 3]]"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="window.api.mquery()"
          >
            Execute Multiple Query
          </v-btn>
          <p id="pout2" />

          <v-text-field
            id="scriptPath"
            label="Enter the SQL script path"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="window.api.escript()"
          >
            Execute SQL Script
          </v-btn>
          <p id="pout3" />

          <v-text-field
            id="extensionPath"
            label="Enter the extension path"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="window.api.load_extension()"
          >
            Load Extension
          </v-btn>
          <p id="pout4" />

          <v-text-field
            id="backupPath"
            label="Enter the backup path"
            variant="outlined"
          />
          <v-text-field
            id="pages"
            label="Enter the pages"
            type="number"
            variant="outlined"
            value="-1"
          />
          <v-text-field
            id="name"
            label="Enter the name of the backup db"
            variant="outlined"
            value="main"
          />
          <v-text-field
            id="sleep"
            label="Enter the sleep time"
            type="number"
            variant="outlined"
            value="0.250"
          />
          <v-btn
            color="primary"
            @click="window.api.backup()"
          >
            Backup
          </v-btn>
          <p id="pout5" />

          <v-text-field
            id="iterdumpPath"
            label="Enter the path"
            variant="outlined"
          />
          <v-text-field
            id="iterdumpFilter"
            label="Enter the filter"
            variant="outlined"
          />
          <v-btn
            color="primary"
            @click="window.api.iterdump()"
          >
            Iterdump
          </v-btn>
          <p id="pout6" />
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>
