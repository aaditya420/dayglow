'use strict';
// Style registry. To add a style: create src/styles/<id>.js exporting { id, name, render } and list it here.
const list = [
  require('./shapes'), require('./orbits'), require('./flow'), require('./topo'), require('./aurora'),
  require('./stars'), require('./truchet'), require('./glass'), require('./sky'), require('./garden'),
  require('./tide'), require('./kolam'), require('./assemble'), require('./weather'), require('./city'),
  require('./marble'), require('./arcade'),
];
const STYLES = Object.freeze(Object.fromEntries(list.map(s => [s.id, s])));
const STYLE_IDS = Object.freeze(list.map(s => s.id));
module.exports = { STYLES, STYLE_IDS };
