export const GCODE_REFERENCE = [
  { code: "G0", label: "G0 Schnellfahrt", description: "Schnelle Verfahrbewegung ohne Schnitt." },
  { code: "G1", label: "G1 Lineare Schnittbewegung", description: "Lineare Vorschubbewegung für den eigentlichen Schnitt." },
  { code: "G2", label: "G2 Kreisbogen im Uhrzeigersinn", description: "Kreisbogen im Uhrzeigersinn. In diesem MVP nur in G17 auf der XY-Ebene mit I/J-Mittelpunktoffsets." },
  { code: "G3", label: "G3 Kreisbogen gegen den Uhrzeigersinn", description: "Kreisbogen gegen den Uhrzeigersinn. In diesem MVP nur in G17 auf der XY-Ebene mit I/J-Mittelpunktoffsets." },
  { code: "F", label: "Vorschub", description: "Vorschubgeschwindigkeit des Werkzeugs." },
  { code: "S", label: "Spindeldrehzahl", description: "Drehzahl der Spindel." },
  { code: "T", label: "Werkzeugauswahl", description: "Aktive Werkzeugnummer." },
  { code: "M3", label: "Spindel ein", description: "Spindel startet im Uhrzeigersinn." },
  { code: "M5", label: "Spindel aus", description: "Spindel stoppt." },
  { code: "G90", label: "Absolutmaß", description: "Koordinaten beziehen sich auf den Nullpunkt." },
  { code: "G91", label: "Inkrementalmaß", description: "Koordinaten sind relativ zur aktuellen Position." },
  { code: "G21", label: "Millimeter", description: "Einheiten in Millimetern." },
  { code: "I/J", label: "Mittelpunktversatz", description: "I und J verschieben den Mittelpunkt eines G2/G3-Bogens relativ zur aktuellen Startposition: I in X-Richtung, J in Y-Richtung." },
];

export const explainLineInGerman = (line: string) => {
  const trimmed = line.trim().toUpperCase();
  if (!trimmed) {
    return "Leere Zeile, hier passiert noch keine Maschinenbewegung.";
  }
  if (trimmed.includes("G0")) {
    return "Diese Zeile führt eine schnelle Positionierbewegung aus. Das Werkzeug soll hier normalerweise nicht schneiden.";
  }
  if (trimmed.includes("G1")) {
    return "Diese Zeile beschreibt einen linearen Schnitt mit aktivem Vorschub. Das Werkzeug bewegt sich kontrolliert durch das Material.";
  }
  if (trimmed.includes("G2") || trimmed.includes("G3")) {
    const direction = trimmed.includes("G2")
      ? "im Uhrzeigersinn"
      : "gegen den Uhrzeigersinn";
    const hasI = /\bI[-+]?\d*\.?\d+\b/.test(trimmed);
    const hasJ = /\bJ[-+]?\d*\.?\d+\b/.test(trimmed);
    const offsetHint =
      hasI || hasJ
        ? "I und J geben den Mittelpunkt des Bogens relativ zur aktuellen Startposition an: I in X-Richtung, J in Y-Richtung."
        : "Für diesen Bogentyp braucht die Steuerung normalerweise I und J, damit der Mittelpunkt des Kreises bekannt ist.";

    return `Diese Zeile fährt einen Bogen ${direction}. ${offsetHint} In CNC Master unterstützen wir Bögen im MVP nur in der G17-XY-Ebene. R-Bögen sowie G18- und G19-Ebenen sind noch nicht unterstützt.`;
  }
  if (trimmed.includes("M3")) {
    return "Hier wird die Spindel eingeschaltet. Ohne laufende Spindel sollte kein echter Schnitt erfolgen.";
  }
  if (trimmed.includes("M5")) {
    return "Hier wird die Spindel gestoppt. Danach sind nur noch sichere Verfahrbewegungen sinnvoll.";
  }
  if (trimmed.includes("G90")) {
    return "Diese Zeile schaltet auf absolute Koordinaten um. X, Y und Z beziehen sich damit direkt auf den Werkstücknullpunkt.";
  }
  if (trimmed.includes("G91")) {
    return "Diese Zeile schaltet auf inkrementelle Koordinaten um. Jeder neue Wert ist dann relativ zur aktuellen Position.";
  }
  if (trimmed.includes("F")) {
    return "Hier wird ein Vorschubwert gesetzt oder angepasst. Das beeinflusst, wie schnell der Schnitt gefahren wird.";
  }
  if (trimmed.includes("S")) {
    return "Hier wird eine Spindeldrehzahl definiert. Das ist wichtig für Material und Werkzeug.";
  }

  return "Diese Zeile setzt Maschinenzustand oder Parameter. Sie beeinflusst, wie die folgenden Bewegungen interpretiert werden.";
};
