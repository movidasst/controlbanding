/* Modelo de evidencias Control Banding · La Movida de SST+.
 * Todo el almacenamiento continúa local y separado por usuario autenticado.
 * Exportar/importar no crea un respaldo remoto ni cifra los datos.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.ControlBandingEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SCHEMA_VERSION=3;
  const MAX_ITEMS=300;
  const MAX_TEXT=6000;
  const DEFAULTS={product_type:'pura'};
  const FIELD_NAMES=new Set([
    'companyName','evaluatorName','location','process','evalDate','country',
    'product_type','cas_number','chemical_name_pura','h_phrases','chemical_name_mezcla',
    'is_cmr','estado_fisico','pulverulencia','volatilidad','emision_gas',
    'cantidad_utilizada','tipo_proceso','duracion','workplace_volume','ventilation_type',
    'process_energy','dermal_task','controles_existentes','fdSource','fdRevision',
    'fdDate','fdUrl','planAction','planOwner','planDue','planEvidence','planNotes'
  ]);
  function plainObject(v){return v && typeof v==='object' && !Array.isArray(v);}
  function safeString(v,max=MAX_TEXT){return String(v==null?'':v).slice(0,max);}
  function normalize(input){
    if(!plainObject(input))throw new Error('Los datos de evaluación no son válidos.');
    const fields=Object.create(null);
    const raw=plainObject(input.fields)?input.fields:input;
    for(const name of FIELD_NAMES){
      if(name==='is_cmr') fields[name]=raw[name]===true||raw[name]==='true'||raw[name]==='on';
      else fields[name]=safeString(raw[name]??DEFAULTS[name]??'');
    }
    fields.product_type=fields.product_type==='mezcla'?'mezcla':'pura';
    const components=Array.isArray(input.components)?input.components:[];
    if(components.length>100)throw new Error('Demasiados componentes en una mezcla.');
    return {schema:SCHEMA_VERSION,fields,components:components.map(c=>({
      cas:safeString(c?.cas,120),
      phrases:safeString(c?.phrases,1400),
      concentration:safeString(c?.concentration,30)
    }))};
  }
  function capture(form){
    if(!form||typeof FormData!=='function')throw new Error('El formulario no está disponible.');
    const raw=Object.fromEntries(new FormData(form).entries());
    const cmr=form.querySelector('[name="is_cmr"]');
    raw.is_cmr=!!cmr?.checked;
    const components=[...form.querySelectorAll('#mixture-components > div')].map(row=>({
      cas:row.querySelector('.mix-cas')?.value||'',
      phrases:row.querySelector('.mix-h')?.value||'',
      concentration:row.querySelector('.mix-conc')?.value||''
    }));
    return normalize({fields:raw,components});
  }
  function restore(form,payload,addComponent){
    const snapshot=normalize(payload);
    const fields=snapshot.fields;
    const radio=[...form.querySelectorAll('input[name="product_type"]')]
      .find(el=>el.value===fields.product_type);
    if(radio)radio.checked=true;
    radio?.dispatchEvent(new Event('change',{bubbles:true}));
    for(const [name,val] of Object.entries(fields)){
      if(name==='product_type')continue;
      const input=form.querySelector('[name="'+name+'"]');
      if(!input)continue;
      if(input.type==='checkbox')input.checked=!!val;
      else input.value=val;
    }
    form.querySelector('[name="estado_fisico"]')?.dispatchEvent(new Event('change',{bubbles:true}));
    const container=form.querySelector('#mixture-components');
    if(container)container.replaceChildren();
    if(fields.product_type==='mezcla'){
      for(const component of snapshot.components){
        addComponent();
        const row=container?.lastElementChild;
        if(!row)throw new Error('No se pudo restaurar un componente.');
        row.querySelector('.mix-cas').value=component.cas;
        row.querySelector('.mix-h').value=component.phrases;
        row.querySelector('.mix-conc').value=component.concentration;
      }
    }
    return snapshot;
  }
  function validate(snapshot, method){
    const s=normalize(snapshot),f=s.fields;
    for(const [key,label] of [
      ['companyName','empresa'],['evaluatorName','evaluador'],['process','proceso de trabajo'],
      ['location','ubicación/área'],['evalDate','fecha de evaluación'],['country','país'],
      ['fdSource','origen de la FDS'],['fdRevision','identificación/versión de la FDS']
    ]) if(!f[key].trim())throw new Error('Falta el dato obligatorio: '+label+'.');
    if(f.product_type==='mezcla'){
      if(!f.chemical_name_mezcla.trim())throw new Error('Falta el nombre comercial de la mezcla.');
      if(!s.components.length)throw new Error('La mezcla requiere componentes.');
      if(method) method.mixture(s.components);
    }else{
      if(!f.chemical_name_pura.trim())throw new Error('Falta el nombre de la sustancia.');
      if(method)method.codes(f.h_phrases,true);
    }
    if(f.estado_fisico==='gas')throw new Error('Los gases quedan fuera del alcance de COSHH Essentials.');
    if(f.fdUrl && !/^https:\/\//i.test(f.fdUrl))throw new Error('La referencia web de la FDS debe usar HTTPS.');
    return s;
  }
  function envelope(ownerId,records){
    if(!ownerId||typeof ownerId!=='string')throw new Error('No existe integrante autenticado.');
    if(!Array.isArray(records)||records.length>MAX_ITEMS)throw new Error('El historial supera el máximo de exportación.');
    return {application:'la-movida-controlbanding',schema:SCHEMA_VERSION,
      owner_id:ownerId,exported_at:new Date().toISOString(),records};
  }
  function parseEnvelope(raw,ownerId){
    if(typeof raw!=='string'||raw.length>2_000_000)throw new Error('Archivo demasiado grande o no válido.');
    let data;try{data=JSON.parse(raw);}catch{throw new Error('El archivo no contiene JSON válido.');}
    if(!plainObject(data)||data.application!=='la-movida-controlbanding'||data.schema!==SCHEMA_VERSION)
      throw new Error('Archivo incompatible con Control Banding.');
    if(!ownerId||data.owner_id!==ownerId)
      throw new Error('El archivo pertenece a otra identidad. No se importaron registros.');
    if(!Array.isArray(data.records)||data.records.length>MAX_ITEMS)throw new Error('Cantidad de registros no admitida.');
    const ids=new Set();
    const records=data.records.map((r,i)=>{
      if(!plainObject(r)||typeof r.id!=='string'||!/^[A-Za-z0-9_-]{5,90}$/.test(r.id)||ids.has(r.id))
        throw new Error('Identificador de evaluación inválido o duplicado ('+(i+1)+').');
      ids.add(r.id);
      if(!plainObject(r.inhalatorio)||!plainObject(r.dermico)||!plainObject(r.context))
        throw new Error('Registro incompleto ('+(i+1)+').');
      if(r.input)normalize(r.input);
      return r;
    });
    return records;
  }
  function filenameBase(date=new Date()){
    return 'control-banding-'+date.toISOString().slice(0,10);
  }
  function downloadText(text,filename,contentType='application/json'){
    const blob=new Blob([text],{type:contentType+';charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  return Object.freeze({SCHEMA_VERSION,FIELD_NAMES,normalize,capture,restore,validate,envelope,parseEnvelope,filenameBase,downloadText});
});