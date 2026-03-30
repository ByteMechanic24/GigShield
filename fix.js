const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/"Zomato"/g, '"zomato"');
  c = c.replace(/"flood"/g, '"flooding"');
  c = c.replace(/"protest"/g, '"strike"');
  c = c.replace(/"road"/g, '"road_closure"');
  fs.writeFileSync(file, c);
}

fix('c:/Guidewire_Hackathon/gigshield/backend/seedData.js');
fix('c:/Guidewire_Hackathon/gigshield/backend/demoScenarios.js');
