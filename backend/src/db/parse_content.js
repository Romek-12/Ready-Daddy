const fs = require('fs');
const path = require('path');

const mdPath = path.resolve(__dirname, '../../../hej_papa_v4_FINAL.md');
const content = fs.readFileSync(mdPath, 'utf8');

// Parse Weeks
const weeksData = [];
const weekSectionsPattern = /### Tydzień (\d+)([\s\S]*?)(?=### Tydzień \d+|---)/g;

let match;
while ((match = weekSectionsPattern.exec(content)) !== null) {
  const weekNumber = parseInt(match[1], 10);
  const text = match[2];

  // If week > 42, break
  if (weekNumber > 42) continue;

  const extractSection = (header) => {
    const regex = new RegExp(`\\*\\*${header}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-ZZŻŹĆÓŁĘĄŚ ,.]+\\*\\*|\\*Źródło|---)`, 'i');
    const m = text.match(regex);
    return m ? m[1].replace(/\n/g, ' ').trim() : '';
  };

  const kimJestem = extractSection('KIM JESTEM');
  const mamaCzuje = extractSection('MAMA CZUJE');
  
  // Tato dzialaj is a list, so we might want to keep newlines or just space them
  let tatoDzialaj = '';
  const tatoMatch = text.match(/\*\*TATO, DZIAŁAJ\*\*\s*([\s\S]*?)(?=\*\*WIEDZIAŁEŚ|\*Źródło|---)/);
  if (tatoMatch) {
    tatoDzialaj = tatoMatch[1].trim().replace(/\n/g, ' ');
  }

  const wiedziales = extractSection('WIEDZIAŁEŚ, ŻE\\.\\.\\.');

  // Extract size (e.g. rozmiar maliny (ok. 1,6 cm) -> 16 mm)
  let sizeMm = 0;
  const sizeMatchCm = kimJestem.match(/ok\.?\s*(\d+(?:,\d+)?)\s*cm/);
  if (sizeMatchCm) {
    sizeMm = parseFloat(sizeMatchCm[1].replace(',', '.')) * 10;
  } else {
    const sizeMatchMm = kimJestem.match(/ok\.?\s*(\d+(?:,\d+)?)\s*mm/);
    if (sizeMatchMm) sizeMm = parseFloat(sizeMatchMm[1].replace(',', '.'));
  }

  // Extract weight
  let weightG = 0;
  const weightMatchG = kimJestem.match(/ważę\s*ok\.?\s*(\d+)\s*gramów/);
  if (weightMatchG) {
    weightG = parseInt(weightMatchG[1], 10);
  } else {
    const weightMatchKg = kimJestem.match(/ważę\s*ok\.?\s*(\d+(?:,\d+)?)\s*kg/);
    if (weightMatchKg) weightG = parseFloat(weightMatchKg[1].replace(',', '.')) * 1000;
  }

  // Extract comparison fruit (e.g. rozmiar ziarna maku)
  let comparison = '';
  const compMatch = kimJestem.match(/rozmiar ([A-Za-zżźćńółęąśŻŹĆĄŚĘŁÓŃ ]+) \(ok/i);
  if (compMatch) comparison = compMatch[1].trim();

  const trimester = weekNumber <= 13 ? 1 : weekNumber <= 27 ? 2 : 3;

  weeksData.push({
    week_number: weekNumber,
    trimester,
    fetus_size_mm: sizeMm,
    fetus_weight_g: weightG,
    fetus_size_comparison: comparison.charAt(0).toUpperCase() + comparison.slice(1),
    fetus_description: kimJestem,
    partner_physical: mamaCzuje,
    partner_emotional: '',
    partner_hormonal: '',
    partner_tips: '',
    dad_symptoms: wiedziales,
    dad_tips: tatoDzialaj,
    weekly_notification: `Tydzień ${weekNumber}. Zobacz co się u nas dzieje!`
  });
}

// Generate the new seed-weeks.js
const seedWeeksPath = path.resolve(__dirname, 'seed-weeks.js');
let seedContent = fs.readFileSync(seedWeeksPath, 'utf8');

// replace the weeks array inside seedWeeksPath
const startMarker = 'const weeks = [';
const endMarker = '];\n\nconst insertWeeks';

const startIndex = seedContent.indexOf(startMarker);
const endIndex = seedContent.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const stringifiedWeeks = weeksData.map(w => JSON.stringify([
      w.week_number,
      w.trimester,
      w.fetus_size_mm,
      w.fetus_weight_g,
      w.fetus_size_comparison,
      w.fetus_description,
      w.partner_physical,
      w.partner_emotional,
      w.partner_hormonal,
      w.partner_tips,
      w.dad_symptoms,
      w.dad_tips,
      w.weekly_notification
    ])).join(',\n  ');

    const newArray = `const weeks = [\n  ${stringifiedWeeks}\n`;
    
    seedContent = seedContent.slice(0, startIndex) + newArray + seedContent.slice(endIndex);
    fs.writeFileSync(seedWeeksPath, seedContent, 'utf8');
    console.log('Successfully updated seed-weeks.js');
} else {
    console.log('Could not find weeks array in seed-weeks.js');
}
