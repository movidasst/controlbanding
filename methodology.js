/* Control Banding La Movida SST+ — metodología y validación.
 * Referencia: HSE, COSHH essentials technical basis, Tablas 1, 2 y 6 (2019).
 * Esta biblioteca no clasifica legalmente mezclas ni determina conformidad de exposición.
 */
(function (root, factory) {
  const method = factory();
  if (typeof module === 'object' && module.exports) module.exports = method;
  else root.ControlBandingMethod = method;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BAND = Object.freeze({
    H303:'A',H304:'A',H305:'A',H313:'A',H315:'A',H316:'A',H319:'A',H320:'A',H333:'A',H336:'A',
    H302:'B',H312:'B',H332:'B',H371:'B',
    H301:'C',H311:'C',H314:'C',H317:'C',H318:'C',H331:'C',H335:'C',H370:'C',H373:'C',
    H300:'D',H310:'D',H330:'D',H351:'D',H360:'D',H361:'D',H362:'D',H372:'D',
    H334:'E',H340:'E',H341:'E',H350:'E'
  });
  const PHYSICAL = new Set(['H220','H224','H225','H226','H270','H271','H272','H290']);
  const DERMAL = Object.freeze({H350:5,H340:5,H341:5,H360:5,H361:4,H362:4,H314:4,H317:4,H310:4,H334:4,H351:3,H318:3,H311:3,H315:2,H312:2});
  const ORDER = ['A','B','C','D','E'];
  const EP = Object.freeze({
    solido: {pequena:{baja:1,media:1,alta:2},mediana:{baja:2,media:3,alta:3},grande:{baja:2,media:4,alta:4}},
    liquido: {pequena:{baja:1,media:2,alta:2},mediana:{baja:2,media:3,alta:3},grande:{baja:2,media:3,alta:4}}
  });
  const CONTROL = Object.freeze({
    solido: {A:[1,1,1,2],B:[1,1,2,3],C:[1,2,3,4],D:[2,3,4,4],E:[4,4,4,4]},
    liquido: {A:[1,1,1,2],B:[1,1,2,2],C:[1,2,3,3],D:[2,3,4,4],E:[4,4,4,4]}
  });
  const CLASS = Object.freeze({
    FLAMMABLE: ['H220','H224','H225','H226'],
    OXIDIZER: ['H270','H271','H272'],
    CORROSIVE: ['H290','H314'],
    ACUTE_TOXIC_HIGH: ['H300','H310','H330']
  });
  function codes(input, requireHealth = true) {
    const tokens = Array.isArray(input) ? input : String(input == null ? '' : input).split(/[,;]+/);
    const out = [];
    for (const item of tokens) {
      const raw = String(item || '').trim().toUpperCase();
      if (!raw) continue;
      const m = raw.match(/^(H[23][0-9]{2})(?:[A-Z]{1,3})?(?=$|[\s:;,.()–—-])/);
      if (!m) throw new Error('Frase H no reconocible: ' + raw.slice(0,25) + '. Consulte la sección 2 de la FDS.');
      const code=m[1];
      if (!(code in BAND) && !PHYSICAL.has(code)) throw new Error('Frase H no mapeada ('+code+'). No se emitirá una banda por defecto.');
      if (!out.includes(code)) out.push(code);
    }
    if (out.length===0) throw new Error('Faltan frases H verificadas en la FDS. No se puede inferir peligro bajo.');
    if (requireHealth && !out.some(c=>c in BAND))
      throw new Error('Solo hay peligros físicos o datos incompletos: falta la clasificación de peligros para la salud de la FDS.');
    return out;
  }
  function band(input) {
    const list=codes(input,true);
    return list.filter(c=>BAND[c]).reduce((x,c)=>ORDER.indexOf(BAND[c])>ORDER.indexOf(x)?BAND[c]:x,'A');
  }
  function dermal(input) {
    return codes(input,true).reduce((x,c)=>Math.max(x,DERMAL[c]||1),1);
  }
  function exposure(estado,propiedad,cantidad) {
    const result=EP[estado]?.[cantidad]?.[propiedad];
    if (!result) throw new Error(estado==='gas'
      ? 'COSHH Essentials no es aplicable a gases: solicite una evaluación especializada.'
      : 'Cantidad, propiedad o estado físico no válidos para COSHH.');
    return result;
  }
  function control(peligro,ep,estado,cantidad,propiedad,cmr=false) {
    if (cmr || peligro==='E') return 4;
    let value=CONTROL[estado]?.[peligro]?.[ep-1];
    if (!Number.isInteger(value)) throw new Error('No existe tabla HSE para esta combinación.');
    // Excepciones precautorias publicadas después de la Tabla 6 (HSE párrafo 32).
    if (estado==='liquido' && cantidad==='mediana' && propiedad==='alta' && peligro==='A') value=Math.max(value,2);
    if (estado==='liquido' && cantidad==='grande' && propiedad==='alta' && peligro==='B') value=Math.max(value,3);
    if (estado==='liquido' && cantidad==='grande' && propiedad==='media' && peligro==='C') value=Math.max(value,4);
    return value;
  }
  function mixture(items) {
    if (!Array.isArray(items)||items.length===0) throw new Error('Añada al menos un componente de la FDS.');
    let sum=0,high='A',skin=1,expert=false;
    const components=items.map((item,i)=>{
      const concentration=Number(item.concentration);
      if (item.concentration===''||item.concentration==null||!Number.isFinite(concentration)||concentration<=0||concentration>100)
        throw new Error('Concentración inválida en componente '+(i+1)+': use un porcentaje mayor que 0 y hasta 100.');
      sum+=concentration;
      const h=codes(item.phrases,true);
      const b=band(h);
      skin=Math.max(skin,dermal(h));
      // Reglas de mezclas preparadas por el usuario del HSE, párrafos 55–57.
      if (b==='E') high='E';
      else if (high!=='E' && ['D','C'].includes(b) && concentration>=0.05 && ORDER.indexOf(b)>ORDER.indexOf(high)) high=b;
      else if (high==='A' && b==='B' && concentration>=10) high='B';
      if (h.includes('H334') && concentration>=0.1 && concentration<0.5) expert=true;
      return {concentration,phrases:h,band:b};
    });
    if (sum>100.000001) throw new Error('La suma de concentraciones supera el 100 %. Revise la composición.');
    return {band:high,dermal:skin,components,requiresExpert:expert,percentTotal:sum,
      notice:'Cribado conservador de componentes, no clasificación SGA oficial de la mezcla. Verifique la FDS del producto final.'};
  }
  function compatibility(a,b) {
    const ca=codes(a,false),cb=codes(b,false);
    const classes=(list)=>Object.keys(CLASS).filter(type=>list.some(c=>CLASS[type].includes(c)));
    const x=classes(ca),y=classes(cb);
    const fire=(x.includes('FLAMMABLE')&&y.includes('OXIDIZER'))||(x.includes('OXIDIZER')&&y.includes('FLAMMABLE'));
    const acute=x.includes('ACUTE_TOXIC_HIGH')||y.includes('ACUTE_TOXIC_HIGH');
    const caution=(x.includes('CORROSIVE')&&y.includes('FLAMMABLE'))||(y.includes('CORROSIVE')&&x.includes('FLAMMABLE'));
    if (fire) return {status:'ALERTA DE INCOMPATIBILIDAD',message:'Inflamables y oxidantes: separar y validar condiciones de almacenamiento en las FDS.',classes:[x,y]};
    if (acute||caution) return {status:'REVISIÓN OBLIGATORIA',message:'Se detectaron peligros que requieren revisión específica de compatibilidad, segregación y FDS.',classes:[x,y]};
    return {status:'NO CONCLUYENTE',message:'Las reglas simplificadas no encontraron una alerta; esto NO demuestra compatibilidad. Consulte las secciones 7 y 10 de ambas FDS.',classes:[x,y]};
  }
  return Object.freeze({version:'2.0.0-hse-2019',codes,band,dermal,exposure,control,mixture,compatibility,BAND,EP,CONTROL});
});
