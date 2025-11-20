import { createVuetify } from 'vuetify'
import {
  ko,
  en,
  zhHans,
  zhHant,
  de,
  es,
  ja,
  fr,
  ru,
  pt,
  nl
} from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
//import { aliases, mdi } from 'vuetify/iconsets/mdi' // nicht mdi-svg
import 'vuetify/styles'
import { VIconBtn } from 'vuetify/labs/VIconBtn'
import colors from 'vuetify/util/colors'

export default createVuetify({
  locale: {
    messages: { ko, en, zhHans, zhHant, de, es, ja, fr, ru, pt, nl },
    locale: 'en',
    fallback: 'en'
  },
  components: {
    VIconBtn
  },
  defaults: {
    VBtn: {
      style: [
        {
          // Do not force capitalization of a button text
          textTransform: 'none'
        }
      ]
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: colors.orange.darken2
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: colors.orange.darken2
        }
      }
    }
  }
})
