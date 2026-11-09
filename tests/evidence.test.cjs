'use strict';
const assert=require('node:assert/strict');
const e=require('../evaluation-evidence.js');
const m=require('../methodology.js');
function base(overrides={}){
 return {fields:{
  companyName:'Empresa',evaluatorName:'Profesional',location:'Taller',process:'Lavado',
  evalDate:'2026-11-09',country:'Venezuela',product_type:'pura',
  chemical_name_pura:'Tolueno',h_phrases:'H315,H335',fdSource:'Fabricante X',
  fdRevision:'Rev 4',estado_fisico:'liquido',fdUrl:'https://example.org/fds',
  ...overrides
 },components:[]};
}
assert.equal(e.SCHEMA_VERSION,3);
const pure=e.validate(base(),m);
assert.equal(pure.fields.fdRevision,'Rev 4');
assert.equal(pure.fields.is_cmr,false);
for(const field of ['companyName','evaluatorName','process','location','evalDate','country','fdSource','fdRevision']){
 assert.throws(()=>e.validate(base({[field]:''}),m),'Campo obligatorio: '+field);
}
assert.throws(()=>e.validate(base({h_phrases:''}),m));
assert.throws(()=>e.validate(base({h_phrases:'H999'}),m));
assert.throws(()=>e.validate(base({estado_fisico:'gas'}),m));
assert.throws(()=>e.validate(base({fdUrl:'http://inseguro.example'}),m));
let mixture=base({product_type:'mezcla',chemical_name_mezcla:'Diluyente industrial'});
mixture.components=[{cas:'108-88-3',phrases:'H335',concentration:'35'},{cas:'',phrases:'H314',concentration:'10'}];
const mixed=e.validate(mixture,m);
assert.equal(mixed.components.length,2);
assert.equal(mixed.fields.product_type,'mezcla');
assert.throws(()=>e.validate({...mixture,components:[]},m));
assert.throws(()=>e.validate({...mixture,components:[{phrases:'',concentration:'10'}]},m));
const entry={id:'EV-2026_001',timestamp:'2026-11-09T21:00:00Z',
 context:{process:'Lavado'},inhalatorio:{name:'Tolueno',band:'C',exp:2,controlReq:2},
 dermico:{riskScore:5},input:pure};
const owner='uuid-owner-correcto';
const raw=JSON.stringify(e.envelope(owner,[entry]));
const parsed=e.parseEnvelope(raw,owner);
assert.equal(parsed.length,1);
assert.equal(parsed[0].input.fields.fdSource,'Fabricante X');
assert.throws(()=>e.parseEnvelope(raw,'otro-usuario'));
assert.throws(()=>e.parseEnvelope('{bad',owner));
assert.throws(()=>e.parseEnvelope('{"schema":3}',owner));
assert.throws(()=>e.parseEnvelope(JSON.stringify(e.envelope(owner,[entry,entry])),owner));
assert.throws(()=>e.parseEnvelope('x'.repeat(2_000_001),owner));
assert.equal(e.normalize({fields:{product_type:'mezcla'},components:[{cas:'',phrases:'H315',concentration:'25'}]}).components[0].concentration,'25');
console.log('Evidencia: validación de datos, mezcla, fuentes, identidad e importación OK');
