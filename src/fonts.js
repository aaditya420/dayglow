'use strict';
// Registers Manrope (SIL Open Font License) from its npm package once per process.
const fs = require('fs');
const path = require('path');
const { GlobalFonts } = require('@napi-rs/canvas');

const FAMILY = 'Manrope';
let done = false;
function registerFonts(){
  if (done) return FAMILY;
  const dir = path.dirname(require.resolve('@expo-google-fonts/manrope/package.json'));
  for (const w of ['500Medium', '600SemiBold', '700Bold']){
    GlobalFonts.register(fs.readFileSync(path.join(dir, w, `Manrope_${w}.ttf`)), FAMILY);
  }
  done = true;
  return FAMILY;
}
module.exports = { registerFonts, FAMILY };
