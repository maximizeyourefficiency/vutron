import { shell } from 'electron'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import log from 'electron-log/main'

// Interface für Berichtsdaten (Datenbankzeile aus viewberichterwin)
export interface BerichtRow {
  Baustellen_ID_F: number
  BaustellenDaten_ID: number
  datum_id: number
  Personal_ID_F: number
  Datum: string
  DatumAnzeige: string
  Wochentagsname: string
  Monat: number
  Jahr: number
  Arbeitsbeginn: string
  Ende: string
  Pause: number
  Kommentar: string
  Leistungskatalog_ID_F: number
  Menge: number
  Vorname: string
  Nachname: string
  Ort: string
  Baustellennummer: number
  AG_ID_F: number
  Straße: string
  Preis: number
  Einheit: string
  Kurztext: string
  Geldwert: number
}

// Interface für Berichts-Parameter
export interface BerichtParams {
  vorname: string
  nachname: string
  monat: number
  jahr: number
}

// Interface für eine Leistungsposition
interface Leistung {
  kurztext: string
  menge: number
  einheit: string
  preis: number
  geldwert: number
}

// Interface für eine Baustelle
interface Baustelle {
  baustellenDatenId: number
  baustellennummer: number
  ort: string
  strasse: string
  arbeitsbeginn: string
  ende: string
  pause: number
  kommentar: string
  agIdF: number
  leistungen: Leistung[]
}

// Interface für einen Tag
interface Tag {
  datumId: number
  datumAnzeige: string
  wochentag: string
  summe: number
  baustellen: Map<number, Baustelle>
}

/**
 * Strukturiert die Datenbankzeilen hierarchisch nach Tagen und Baustellen
 */
export function strukturiereDaten(rows: BerichtRow[]): Map<number, Tag> {
  const tageMap = new Map<number, Tag>()

  for (const row of rows) {
    if (!tageMap.has(row.datum_id)) {
      tageMap.set(row.datum_id, {
        datumId: row.datum_id,
        datumAnzeige: row.DatumAnzeige,
        wochentag: row.Wochentagsname,
        summe: 0,
        baustellen: new Map()
      })
    }

    const tag = tageMap.get(row.datum_id)!
    tag.summe += row.Geldwert || 0

    if (!tag.baustellen.has(row.BaustellenDaten_ID)) {
      tag.baustellen.set(row.BaustellenDaten_ID, {
        baustellenDatenId: row.BaustellenDaten_ID,
        baustellennummer: row.Baustellennummer,
        ort: row.Ort,
        strasse: row.Straße,
        arbeitsbeginn: row.Arbeitsbeginn,
        ende: row.Ende,
        pause: row.Pause,
        kommentar: row.Kommentar,
        agIdF: row.AG_ID_F,
        leistungen: []
      })
    }

    const baustelle = tag.baustellen.get(row.BaustellenDaten_ID)!
    if (row.Kurztext) {
      baustelle.leistungen.push({
        kurztext: row.Kurztext,
        menge: row.Menge,
        einheit: row.Einheit,
        preis: row.Preis,
        geldwert: row.Geldwert
      })
    }
  }

  return tageMap
}

/**
 * Erstellt ein PDF aus den strukturierten Daten und öffnet es
 */
export async function erstellePdfBericht(
  tageMap: Map<number, Tag>,
  params: BerichtParams
): Promise<{ success: boolean; path: string }> {
  try {
    const { vorname, nachname, monat, jahr } = params
    log.info('erstellePdfBericht gestartet:', { vorname, nachname, monat, jahr })

    // PDF-Pfad im Temp-Ordner (mit Zeitstempel für eindeutige Dateinamen)
    const timestamp = Date.now()
    const pdfPath = path.join(
      os.tmpdir(),
      `Bericht_${vorname}_${nachname}_${monat}_${jahr}_${timestamp}.pdf`
    )
    log.info('PDF-Pfad:', pdfPath)

    // PDF erstellen
    const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // A4-Maße
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 50
  const lineHeight = 14

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  // Hilfsfunktion: Text zeichnen
  const drawText = (
    text: string,
    x: number,
    size: number,
    bold = false,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color
    })
  }

  // Hilfsfunktion: Neue Seite falls nötig
  const checkNewPage = () => {
    if (y < margin + 50) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  // Titel
  const titleText = `Leistungsauswertung: ${vorname} ${nachname} - ${monat}/${jahr}`
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 12)
  drawText(titleText, (pageWidth - titleWidth) / 2, 12, true)
  y -= 40

  // Durch die Tage iterieren
  for (const [, tag] of tageMap) {
    checkNewPage()

    // Ebene 1: Datum (blau, fett)
    drawText(
      `${tag.datumAnzeige} ${tag.wochentag}`,
      margin,
      12,
      true,
      rgb(0.17, 0.24, 0.31)
    )
    drawText(
      `${tag.summe.toFixed(2)} EUR`,
      450,
      12,
      true,
      rgb(0.17, 0.24, 0.31)
    )
    y -= 8

    // Unterstrich
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.17, 0.24, 0.31)
    })
    y -= lineHeight + 5

    // Durch Baustellen iterieren
    for (const [, bs] of tag.baustellen) {
      checkNewPage()

      // Ebene 2: Baustelle (grau)
      const baustelleColor = rgb(0.2, 0.29, 0.37)
      drawText(
        `${bs.baustellennummer} - ${bs.ort}, ${bs.strasse} ${bs.arbeitsbeginn} - ${bs.ende} ${bs.pause} h ${bs.kommentar}`,
        margin,
        11,
        false,
        baustelleColor
      )
      y -= lineHeight

      // Ebene 3: Leistungen (mit festen Spalten-Positionen)
      const colKurztext = margin + 20
      const colMenge = 250
      const colEinheit = 280
      const colPreis = 370
      const colGeldwert = 450

      for (const l of bs.leistungen) {
        checkNewPage()
        page.drawText(l.kurztext || '-', { x: colKurztext, y, size: 10, font })
        page.drawText(l.menge?.toFixed(2) || '-', { x: colMenge, y, size: 10, font })
        page.drawText(l.einheit || '-', { x: colEinheit, y, size: 10, font })
        page.drawText(`${l.preis?.toFixed(2) || '-'} €`, { x: colPreis, y, size: 10, font })
        page.drawText(`${l.geldwert?.toFixed(2) || '-'} €`, { x: colGeldwert, y, size: 10, font })
        y -= lineHeight
      }
      y -= 10
    }
    y -= 15
  }

    // PDF speichern
    log.info('Speichere PDF...')
    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync(pdfPath, pdfBytes)
    log.info('PDF gespeichert')

    // PDF öffnen (nicht blockierend)
    log.info('Öffne PDF...')
    shell.openPath(pdfPath).then((error) => {
      if (error) {
        log.error('Fehler beim Öffnen der PDF:', error)
      }
    })

    log.info(`PDF erstellt: ${pdfPath}`)
    return { success: true, path: pdfPath }
  } catch (error) {
    log.error('Fehler in erstellePdfBericht:', error)
    throw error
  }
}

/**
 * SQL-Query für Berichtsdaten
 */
export const BERICHT_SQL = `
  SELECT
    vb.Baustellen_ID_F,
    vb.BaustellenDaten_ID,
    vb.datum_id,
    vb.Personal_ID_F,
    vb.Datum,
    vb.DatumAnzeige,
    vb.Wochentagsname,
    vb.Monat,
    vb.Jahr,
    vb.Arbeitsbeginn,
    vb.Ende,
    vb.Pause,
    vb.Kommentar,
    vb.Leistungskatalog_ID_F,
    vb.Menge,
    vb.Vorname,
    vb.Nachname,
    vb.Ort,
    vb.Baustellennummer,
    vb.AG_ID_F,
    vb.Straße,
    vb.Preis,
    vb.Einheit,
    vb.Kurztext,
    vb.Geldwert
  FROM viewberichterwin vb
  WHERE vb.Personal_ID_F = ?
  ORDER BY
    vb.datum_id
`
