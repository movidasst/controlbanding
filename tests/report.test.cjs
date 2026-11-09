'use strict';
const assert=require('node:assert/strict');
const r=require('../report-pdf.js');
const input={fields:{
 companyName:'Una organización con nombre extenso repetido '.repeat(15),
 evaluatorName:'Profesional de SST',location:'Almacén industrial',
 process:'Proceso de mantenimiento prolongado '.repeat(40),evalDate:'2026-11-09',
 country:'Venezuela',product_type:'mezcla',chemical_name_mezcla:'Diluyente industrial',
 is_cmr:false,fdSource:'Fabricante',fdRevision:'Rev. 02',fdDate:'2026-09-01',
 fdUrl:'https://example.org/fds',
 estado_fisico:'liquido',cantidad_utilizada:'mediana',volatilidad:'alta',
 tipo_proceso:'5',duracion:'2',workplace_volume:'1',ventilation_type:'2',
 process_energy:'1',dermal_task:'spray_liquids',controles_existentes:'1',
 planAction:'Instalar extracción localizada y verificar resultados. '.repeat(60),
 planOwner:'Responsable de Mantenimiento',planDue:'2027-01-30',
 planEvidence:'Mediciones y pruebas de desempeño',planNotes:'Consultar con Higiene Ocupacional'
 },components:[
  {cas:'108-88-3',phrases:'H315,H335',concentration:'60'},
  {cas:'',phrases:'H314',concentration:'5'}
 ]};
const evalData={id:'EV-2026_TEST',timestamp:'2026-11-09T21:00:00Z',updatedAt:'2026-11-09T21:30:00Z',
 methodVersion:'2.0.0-hse-2019',input,context:{existControl:1},
 inhalatorio:{name:'Diluyente industrial',band:'C',exp:3,controlReq:3},
 dermico:{hazardLvl:4,expLvl:3,riskScore:9}};
const sections=r.buildSections(evalData);
assert.equal(sections.length,8);
assert.equal(sections[3].rows.length,2);
const joined=JSON.stringify(sections);
for(const phrase of ['Fabricante','Rev. 02','H314','2027-01-30','Mediciones','2.0.0-hse-2019','COSHH']){
 assert.ok(joined.includes(phrase),'Falta sección relevante: '+phrase);
}
assert.equal(r.recommendations(3,9).inhalatoria.includes('Confinamiento'),true);
class PDFStub{
 constructor(){this.pages=1;this.lastAutoTable={finalY:23};this.heads=[];this.savedPage=1;this.internal={getNumberOfPages:()=>this.pages};}
 autoTable(params){
  this.heads.push(params.head);
  let y=params.startY;
  for(const line of params.body){
   const amount=JSON.stringify(line).length;
   const rows=Math.max(1,Math.ceil(amount/120));
   if(y+rows*8>265){this.pages++;y=35;}
   y+=rows*8;
  }
  this.lastAutoTable={finalY:y};
 }
 setPage(p){this.savedPage=p;}
 setFillColor(){}rect(){}setFont(){}setFontSize(){}setTextColor(){}text(){}setDrawColor(){}line(){}
}
const doc=new PDFStub();
const result=r.render(doc,evalData);
assert.equal(result.sections.length,8);
assert.equal(doc.heads.length,8);
assert.ok(result.pages>=2,'Una evaluación larga debe extenderse a más de una página');
assert.equal(doc.savedPage,result.pages);
assert.throws(()=>r.render({},evalData));
assert.throws(()=>r.buildSections({}));
console.log('PDF: contenido reproducible, tablas extensas y paginación simulada OK');
