SELECT
      CAST(strftime('%Y', bd.Datum) AS INTEGER) AS Jahr,
      CAST(strftime('%m', bd.Datum) AS INTEGER) AS Monat,
      bd.Personal_ID_F,
      p.Rufname,
      SUM(CASE WHEN bd.Baustellen_ID_F = 3734 THEN 1 ELSE 0 END) AS Tage_Krankheit,
      SUM(CASE WHEN bd.Baustellen_ID_F = 3735 THEN 1 ELSE 0 END) AS Tage_Urlaub,
      SUM(CASE WHEN bd.Baustellen_ID_F = 3736 THEN 1 ELSE 0 END) AS Tage_Schlechtwetter,
      SUM(CASE WHEN bd.Baustellen_ID_F = 3737 THEN 1 ELSE 0 END) AS Tage_Auftragsmangel,
      SUM(
          CASE
              WHEN bd.Baustellen_ID_F NOT IN (3734, 3735, 3736, 3737)
              THEN (julianday(bd.Ende) - julianday(bd.Arbeitsbeginn)) * 24 - COALESCE(bd.Pause, 0) / 60.0
              ELSE 0
          END
      ) AS Arbeitsstunden
  FROM tblbaustellendaten bd
  INNER JOIN tblpersonal p ON p.Person_ID = bd.Personal_ID_F
  GROUP BY
      CAST(strftime('%Y', bd.Datum) AS INTEGER),
      CAST(strftime('%m', bd.Datum) AS INTEGER),
      bd.Personal_ID_F,
      p.Rufname
  ORDER BY Jahr, Monat, Personal_ID_F
