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

// Interface für aggregierte Leistungsdaten (Zusammenfassung)
export interface LeistungSummaryRow {
  Baustellen_ID: number
  Baustellennummer: number
  Ort: string
  Straße: string
  Datum: string
  LeistungsText: string
  Preis: number
  Gesamtmenge: number
  Einheit: string
  Personal_ID_F: number
  Rufname: string
  Kommentar: string
  Monat: number
  Jahr: number
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
 * Aggregiert die Zusammenfassungsdaten nach Leistungstext
 */
export function aggregiereLeistungen(
  rows: LeistungSummaryRow[]
): Map<
  string,
  { menge: number; einheit: string; preis: number; geldwert: number }
> {
  const result = new Map<
    string,
    { menge: number; einheit: string; preis: number; geldwert: number }
  >()

  for (const row of rows) {
    const key = row.LeistungsText
    if (!result.has(key)) {
      result.set(key, {
        menge: 0,
        einheit: row.Einheit,
        preis: row.Preis,
        geldwert: 0
      })
    }
    const entry = result.get(key)!
    entry.menge += row.Gesamtmenge || 0
    entry.geldwert = entry.menge * entry.preis
  }

  return result
}

/**
 * Erstellt ein PDF aus den strukturierten Daten und öffnet es
 */
export async function erstellePdfBericht(
  tageMap: Map<number, Tag>,
  params: BerichtParams,
  summaryRows?: LeistungSummaryRow[]
): Promise<{ success: boolean; path: string }> {
  try {
    const { vorname, nachname, monat, jahr } = params
    log.info('erstellePdfBericht gestartet:', {
      vorname,
      nachname,
      monat,
      jahr
    })

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
    y -= 25

    // Textfeld rechts oben: Zusammenfassung der Leistungen
    if (summaryRows && summaryRows.length > 0) {
      const aggregiert = aggregiereLeistungen(summaryRows)
      const boxX = pageWidth - margin - 200
      const boxWidth = 200
      const boxPadding = 8
      let boxY = y
      const boxLineHeight = 14

      // Berechne Gesamtsumme und Box-Höhe vorab
      let gesamtGeldwert = 0
      for (const [, data] of aggregiert) {
        gesamtGeldwert += data.geldwert
      }
      const boxContentHeight = (aggregiert.size + 2) * boxLineHeight + 8

      // Rahmen um das Textfeld (zuerst zeichnen, damit Text darüber liegt)
      page.drawRectangle({
        x: boxX,
        y: y - boxContentHeight,
        width: boxWidth,
        height: boxContentHeight + boxPadding,
        borderColor: rgb(0.17, 0.24, 0.31),
        borderWidth: 1,
        color: rgb(0.97, 0.97, 0.97)
      })

      boxY -= boxLineHeight + 2

      // Spaltenposition für Beträge (rechtsbündig)
      const colBetrag = boxX + boxWidth - boxPadding

      // Aggregierte Leistungen auflisten (tabellenartig)
      for (const [leistungsText, data] of aggregiert) {
        // Kurztext links
        page.drawText(leistungsText, {
          x: boxX + boxPadding,
          y: boxY,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2)
        })
        // Betrag rechts (rechtsbündig)
        const betragText = `${data.geldwert.toFixed(2)} €`
        const betragWidth = font.widthOfTextAtSize(betragText, 9)
        page.drawText(betragText, {
          x: colBetrag - betragWidth,
          y: boxY,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2)
        })
        boxY -= boxLineHeight
      }

      // Gesamtsumme
      boxY -= 2
      page.drawLine({
        start: { x: boxX + boxPadding, y: boxY + 10 },
        end: { x: boxX + boxWidth - boxPadding, y: boxY + 10 },
        thickness: 0.5,
        color: rgb(0.17, 0.24, 0.31)
      })
      // "Gesamt:" links
      page.drawText('Gesamt:', {
        x: boxX + boxPadding,
        y: boxY,
        size: 10,
        font: fontBold,
        color: rgb(0.17, 0.24, 0.31)
      })
      // Betrag rechts (rechtsbündig)
      const gesamtText = `${gesamtGeldwert.toFixed(2)} €`
      const gesamtWidth = fontBold.widthOfTextAtSize(gesamtText, 10)
      page.drawText(gesamtText, {
        x: colBetrag - gesamtWidth,
        y: boxY,
        size: 10,
        font: fontBold,
        color: rgb(0.17, 0.24, 0.31)
      })

      // Y-Position unter die Box setzen (mit Abstand)
      y = boxY - boxPadding - 20
    } else {
      y -= 15
    }

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
        // Erste Zeile: Baustelleninfos
        drawText(
          `${bs.baustellennummer} - ${bs.ort}, ${bs.strasse} ${bs.arbeitsbeginn} - ${bs.ende} ${bs.pause} h`,
          margin,
          11,
          false,
          baustelleColor
        )
        y -= lineHeight

        // Zweite Zeile: Kommentar (falls vorhanden)
        if (bs.kommentar && bs.kommentar.trim() !== '') {
          drawText(bs.kommentar, margin + 20, 10, false, baustelleColor)
          y -= lineHeight
        }

        // Ebene 3: Leistungen (mit festen Spalten-Positionen)
        const colKurztext = margin + 20
        const colMenge = 250
        const colEinheit = 280
        const colPreis = 370
        const colGeldwert = 450

        for (const l of bs.leistungen) {
          checkNewPage()
          page.drawText(l.kurztext || '-', {
            x: colKurztext,
            y,
            size: 10,
            font
          })
          page.drawText(l.menge?.toFixed(2) || '-', {
            x: colMenge,
            y,
            size: 10,
            font
          })
          page.drawText(l.einheit || '-', { x: colEinheit, y, size: 10, font })
          page.drawText(`${l.preis?.toFixed(2) || '-'} €`, {
            x: colPreis,
            y,
            size: 10,
            font
          })
          page.drawText(`${l.geldwert?.toFixed(2) || '-'} €`, {
            x: colGeldwert,
            y,
            size: 10,
            font
          })
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

/**
 * SQL-Query für Leistungs-Zusammenfassung (aggregiert nach LeistungsText)
 * Parameter: Personal_ID_F, Monat, Jahr
 */
export const LEISTUNG_SUMMARY_SQL = `
  SELECT
    b.Baustellen_ID,
    b.Baustellennummer,
    b.Ort,
    b.Straße,
    bd.Datum,
    lk.LeistungsText,
    bp.Preis,
    SUM(bl.Menge) AS Gesamtmenge,
    lk.Einheit,
    bd.Personal_ID_F,
    p.Rufname,
    bd.Kommentar,
    CAST(strftime('%m', bd.Datum) AS INTEGER) AS Monat,
    CAST(strftime('%Y', bd.Datum) AS INTEGER) AS Jahr
  FROM
    tblbaustellen b
    INNER JOIN tblbaustellenpreise bp ON b.Baustellen_ID = bp.Baustellen_ID_F
    INNER JOIN tblbaustellendaten bd ON b.Baustellen_ID = bd.Baustellen_ID_F
    INNER JOIN tblbaustellenleistung bl ON bd.BaustellenDaten_ID = bl.BaustellenDaten_ID_F
    INNER JOIN tblleistungskatalog lk ON lk.LeistungsKatalog_ID = bp.LeistungsKatalog_ID_F
      AND lk.LeistungsKatalog_ID = bl.LeistungsKatalog_ID_F
    INNER JOIN tblpersonal p ON p.Person_ID = bd.Personal_ID_F
  WHERE
    b.Baustellen_ID <> 3736
    AND bd.Personal_ID_F = ?
    AND CAST(strftime('%m', bd.Datum) AS INTEGER) = ?
    AND CAST(strftime('%Y', bd.Datum) AS INTEGER) = ?
  GROUP BY
    b.Baustellen_ID,
    b.Baustellennummer,
    b.Ort,
    b.Straße,
    bd.Datum,
    lk.LeistungsText,
    bp.Preis,
    lk.Einheit,
    bd.Personal_ID_F,
    p.Rufname,
    bd.Kommentar,
    CAST(strftime('%m', bd.Datum) AS INTEGER),
    CAST(strftime('%Y', bd.Datum) AS INTEGER)
`
