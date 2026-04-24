export const GCODE_REFERENCE = [
  { code: "G0", label: "Rapid positioning", description: "Schnelle Verfahrbewegung ohne Schnitt." },
  { code: "G1", label: "Linear cutting", description: "Lineare Vorschubbewegung fuer den eigentlichen Schnitt." },
  { code: "G2", label: "Clockwise arc", description: "Kreisbahn im Uhrzeigersinn. In diesem MVP nur in G17 auf der XY-Ebene mit I/J-Mittelpunktoffsets." },
  { code: "G3", label: "Counterclockwise arc", description: "Kreisbahn gegen den Uhrzeigersinn. In diesem MVP nur in G17 auf der XY-Ebene mit I/J-Mittelpunktoffsets." },
  { code: "F", label: "Feed rate", description: "Vorschubgeschwindigkeit des Werkzeugs." },
  { code: "S", label: "Spindle speed", description: "Drehzahl der Spindel." },
  { code: "T", label: "Tool selection", description: "Aktive Werkzeugnummer." },
  { code: "M3", label: "Spindle on", description: "Spindel startet im Uhrzeigersinn." },
  { code: "M5", label: "Spindle off", description: "Spindel stoppt." },
  { code: "G90", label: "Absolute mode", description: "Koordinaten beziehen sich auf den Nullpunkt." },
  { code: "G91", label: "Incremental mode", description: "Koordinaten sind relativ zur aktuellen Position." },
  { code: "G21", label: "Millimeters", description: "Einheiten in Millimetern." },
  { code: "I/J", label: "Arc center offset", description: "I und J verschieben den Mittelpunkt eines G2/G3-Bogens relativ zur aktuellen Startposition: I in X-Richtung, J in Y-Richtung." },
];

export const explainLineInGerman = (line: string) => {
  const trimmed = line.trim().toUpperCase();
  if (!trimmed) {
    return "Leere Zeile, hier passiert noch keine Maschinenbewegung.";
  }
  if (trimmed.includes("G0")) {
    return "Diese Zeile fuehrt eine schnelle Positionierbewegung aus. Das Werkzeug soll hier normalerweise nicht schneiden.";
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
        : "Fuer diesen Bogentyp braucht die Steuerung normalerweise I und J, damit der Mittelpunkt des Kreises bekannt ist.";

    return `Diese Zeile faehrt einen Bogen ${direction}. ${offsetHint} In CNC Master unterstuetzen wir Boegen im MVP nur in der G17-XY-Ebene. R-Boegen sowie G18- und G19-Ebenen sind noch nicht unterstuetzt.`;
  }
  if (trimmed.includes("M3")) {
    return "Hier wird die Spindel eingeschaltet. Ohne laufende Spindel sollte kein echter Schnitt erfolgen.";
  }
  if (trimmed.includes("M5")) {
    return "Hier wird die Spindel gestoppt. Danach sind nur noch sichere Verfahrbewegungen sinnvoll.";
  }
  if (trimmed.includes("G90")) {
    return "Diese Zeile schaltet auf absolute Koordinaten um. X, Y und Z beziehen sich damit direkt auf den Werkstuecknullpunkt.";
  }
  if (trimmed.includes("G91")) {
    return "Diese Zeile schaltet auf inkrementelle Koordinaten um. Jeder neue Wert ist dann relativ zur aktuellen Position.";
  }
  if (trimmed.includes("F")) {
    return "Hier wird ein Vorschubwert gesetzt oder angepasst. Das beeinflusst, wie schnell der Schnitt gefahren wird.";
  }
  if (trimmed.includes("S")) {
    return "Hier wird eine Spindeldrehzahl definiert. Das ist wichtig fuer Material und Werkzeug.";
  }

  return "Diese Zeile setzt Maschinenzustand oder Parameter. Sie beeinflusst, wie die folgenden Bewegungen interpretiert werden.";
};
