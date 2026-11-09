/* Informe técnico Control Banding: páginas automáticas, contenido reproducible.
 * No es un certificado de seguridad, autenticidad, conformidad ni exposición.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ControlBandingReport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const HSE='https://www.hse.gov.uk/pubns/guidance/coshh-technical-basis.pdf';
  const INH=Object.freeze({
    1:'Ventilación general, orden y limpieza; verificar si el control de emisiones es suficiente.',
    2:'Captación del contaminante en origen mediante extracción localizada y mantenimiento comprobado.',
    3:'Confinamiento de la operación y sistemas de control de ingeniería; comprobar desempeño.',
    4:'Evaluación especializada y rediseño de controles antes de continuar con la tarea.'
  });
  const DER=Object.freeze({
    1:'Higiene básica y prevención del contacto.',
    2:'Reducir contacto y verificar protección cutánea apropiada.',
    3:'Aplicar medidas para reducir la exposición dérmica.',
    4:'Aislar el contacto y evaluar guantes resistentes al producto.',
    5:'Priorizar sustitución y reducción del contacto.',
    6:'Aplicar controles técnicos y organizativos reforzados.',
    7:'Reducir la exposición cutánea con prioridad.',
    8:'Estudiar sustitución y revisar medidas de contención.',
    9:'Replantear la tarea y reducir la exposición.',
    10:'Revisar de inmediato el diseño del proceso y la sustitución.'
  });
  const LABELS=Object.freeze({
    companyName:'Empresa',evaluatorName:'Evaluador',location:'Ubicación / área',
    process:'Proceso de trabajo',evalDate:'Fecha de evaluación',country:'País',
    product_type:'Tipo de producto',cas_number:'Número CAS',chemical_name_pura:'Sustancia',
    h_phrases:'Frases H según FDS',chemical_name_mezcla:'Mezcla comercial',is_cmr:'CMR / nanomateriales (marcado por evaluador)',
    estado_fisico:'Estado físico',pulverulencia:'Pulverulencia',volatilidad:'Volatilidad',
    emision_gas:'Emisión gas',cantidad_utilizada:'Cantidad por tarea',
    tipo_proceso:'Dinámica de proceso (índice registrado)',duracion:'Duración diaria (índice registrado)',
    workplace_volume:'Volumen del recinto (modificador registrado)',ventilation_type:'Ventilación (modificador registrado)',
    process_energy:'Energía (modificador registrado)',dermal_task:'Tipo de tarea dérmica',
    controles_existentes:'Nivel de control existente',
    fdSource:'Proveedor / identificación de FDS',fdRevision:'Versión / revisión de FDS',
    fdDate:'Fecha de revisión de FDS',fdUrl:'Referencia digital de FDS',
    planAction:'Acciones de control propuestas',planOwner:'Responsable',
    planDue:'Fecha objetivo',planEvidence:'Evidencia / verificación del control',
    planNotes:'Observaciones profesionales'
  });
  function safe(v,max=4000){return String(v==null?'Sin dato':v).slice(0,max);}
  function recommendations(inh,der){
    return {inhalatoria:INH[inh]||'Revisar con especialista.',
      dermica:DER[der]||'Revisar con especialista.'};
  }
  function cleanRows(input,keys){
    return keys.map(k=>[LABELS[k]||k,typeof input[k]==='boolean'?(input[k]?'Sí':'No'):(safe(input[k]||'No informado'))]);
  }
  function buildSections(record){
    if(!record?.inhalatorio||!record?.dermico)throw new Error('No existe una evaluación válida para generar el PDF.');
    const data=record.input?.fields||{},ctx=record.context||{},inh=record.inhalatorio,der=record.dermico;
    const rec=recommendations(inh.controlReq,der.riskScore);
    const current=record.legacy_methodology||!record.input
      ?'Registro histórico. Parámetros no completamente recuperables; debe reevaluarse.'
      :'Evaluación con ficha de entradas versionada y reproducible.';
    const sections=[];
    sections.push({title:'01 · Identificación del estudio',rows:[
      ['ID de evaluación',safe(record.id||'No asignado')],
      ['Fecha de creación',safe(record.timestamp||'No informada')],
      ['Última edición',safe(record.updatedAt||record.timestamp||'No informada')],
      ['Tipo de registro',current],
      ...cleanRows(data,['companyName','evaluatorName','location','process','evalDate','country'])
    ]});
    sections.push({title:'02 · Fuentes y trazabilidad',rows:[
      ...cleanRows(data,['fdSource','fdRevision','fdDate','fdUrl']),
      ['Fundamento COSHH Essentials HSE',HSE],
      ['Versión motor de cálculo',safe(record.methodVersion||'No informada')],
      ['Modelo dérmico','Estimación propia orientativa; no implementación validada de RISKOFDERM']
    ]});
    const productKeys=data.product_type==='mezcla'
      ? ['product_type','chemical_name_mezcla','is_cmr']
      : ['product_type','chemical_name_pura','cas_number','h_phrases','is_cmr'];
    sections.push({title:'03 · Identificación de peligros',rows:cleanRows(data,productKeys)});
    if(data.product_type==='mezcla'){
      const rows=(record.input?.components||[]).map((item,i)=>[
        'Componente '+(i+1),
        'CAS: '+safe(item.cas||'No informado')+
        ' | Concentración: '+safe(item.concentration||'No informada')+' %'+
        ' | Frases H: '+safe(item.phrases||'No informadas')
      ]);
      sections.push({title:'04 · Composición de la mezcla',rows:rows.length?rows:[['Sin componentes','No hubo datos guardados']]});
    }
    sections.push({title:'05 · Parámetros de exposición y control',rows:cleanRows(data,[
      'estado_fisico','cantidad_utilizada','pulverulencia','volatilidad',
      'tipo_proceso','duracion','workplace_volume','ventilation_type','process_energy',
      'dermal_task','controles_existentes'
    ])});
    sections.push({title:'06 · Resultados obtenidos',rows:[
      ['Producto evaluado',safe(inh.name)],
      ['Banda inhalatoria COSHH',safe(inh.band)],
      ['Potencial de exposición',safe('EP'+inh.exp)],
      ['Nivel de control COSHH requerido',safe(inh.controlReq)],
      ['Nivel de control declarado',safe(ctx.existControl)],
      ['Peligrosidad dérmica orientativa',safe(der.hazardLvl)],
      ['Exposición dérmica orientativa',safe(der.expLvl)],
      ['Prioridad dérmica orientativa',safe(der.riskScore+'/10')],
      ['Observación', 'El nivel de control declarado no verifica el desempeño real ni demuestra exposición segura.']
    ]});
    sections.push({title:'07 · Orientaciones de control y plan de trabajo',rows:[
      ['Guía inhalatoria (nivel '+safe(inh.controlReq)+')',rec.inhalatoria],
      ['Guía dérmica (puntaje '+safe(der.riskScore)+')',rec.dermica],
      ...cleanRows(data,['planAction','planOwner','planDue','planEvidence','planNotes'])
    ]});
    sections.push({title:'08 · Alcance y advertencias',rows:[
      ['Alcance','Cribado cualitativo para priorizar controles; requiere FDS vigente y revisión profesional.'],
      ['Limitación','No sustituye mediciones ambientales, evaluación higiénica, clasificación legal SGA de mezclas ni verificación de controles.'],
      ['Integridad','Identificador local y PDF descargable. No se ha implantado una validación digital independiente de integridad o autenticidad.'],
      ['Almacenamiento','Los registros del usuario permanecen en el navegador, no se sincronizan con la nube.']
    ]});
    return sections;
  }
  function render(doc,record,options={}){
    if(!doc||typeof doc.autoTable!=='function')throw new Error('La librería de informes PDF no está disponible.');
    const sections=buildSections(record);
    const left=15,right=15;
    const accent=[0,123,133],navy=[0,32,91];
    for(const section of sections){
      doc.autoTable({
        startY:(doc.lastAutoTable?.finalY ?? 32)+9,
        head:[[section.title,'Detalle y evidencia registrada']],
        body:section.rows.map(([a,b])=>[safe(a,160),safe(b)]),
        theme:'grid',
        margin:{top:35,bottom:23,left,right},
        styles:{font:'helvetica',fontSize:9,cellPadding:3.2,overflow:'linebreak',valign:'top',textColor:navy,lineColor:[220,234,235],lineWidth:.17},
        headStyles:{fillColor:accent,textColor:[255,255,255],fontSize:10,fontStyle:'bold'},
        columnStyles:{0:{cellWidth:65,fontStyle:'bold'},1:{cellWidth:115}},
        showHead:'everyPage',rowPageBreak:'auto',pageBreak:'auto'
      });
    }
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){
      doc.setPage(i);
      doc.setFillColor(250,253,253);doc.rect(0,0,210,31,'F');
      if(options.logoData){
        try{doc.addImage(options.logoData,'WEBP',14,5,70,19,undefined,'FAST');}
        catch {doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...accent);doc.text('LA MOVIDA DE SST+',15,13);}
      }else{
        doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(...accent);
        doc.text('LA MOVIDA DE SST+',15,13);
      }
      doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...navy);
      doc.text('CONTROL BANDING',195,11,{align:'right'});
      doc.setFont('helvetica','normal');doc.setFontSize(8);
      doc.text('Informe técnico orientativo · Evidencia de cálculo',195,18,{align:'right'});
      doc.setDrawColor(...accent);doc.line(15,29,195,29);
      doc.setDrawColor(210,226,228);doc.line(15,277,195,277);
      doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(60,83,88);
      doc.text('No certifica exposición segura, cumplimiento normativo ni autenticidad documental.',15,282);
      doc.text('Página '+i+' de '+pages,195,288,{align:'right'});
    }
    return {pages,sections,version:'3.0'};
  }
  return Object.freeze({render,buildSections,recommendations,LABELS,HSE});
});