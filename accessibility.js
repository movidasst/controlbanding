/* Accesibilidad y navegación del asistente · teclado, lector de pantalla y móvil */
(function(root){
  'use strict';
  let onTab=null;
  function all(selector){return [...document.querySelectorAll(selector)];}
  function syncTabs(active){
    for(const btn of all('#tab-navigation .tab')){
      const selected=btn.dataset.tab===active;
      btn.setAttribute('role','tab');
      btn.setAttribute('aria-controls',btn.dataset.tab);
      btn.setAttribute('aria-selected',String(selected));
      btn.tabIndex=selected?0:-1;
      btn.id='nav-tab-'+btn.dataset.tab;
    }
    for(const panel of all('.tab-content')){
      const selected=panel.id===active;
      panel.setAttribute('role','tabpanel');
      panel.setAttribute('aria-labelledby','nav-tab-'+panel.id);
      panel.setAttribute('aria-hidden',String(!selected));
      panel.inert=!selected;
    }
  }
  function syncWizard(step,focusHeading=false){
    for(let i=1;i<=5;i++){
      const section=document.getElementById('step-'+i);
      if(!section)continue;
      const visible=step===i;
      section.inert=!visible;
      section.setAttribute('aria-hidden',String(!visible));
      const title=section.querySelector('h3,h2');
      if(title){title.tabIndex=-1;title.id='wizard-heading-'+i;section.setAttribute('aria-labelledby',title.id);}
      if(visible&&focusHeading&&title)title.focus({preventScroll:true});
    }
    const bar=document.getElementById('progressBar');
    if(bar)bar.setAttribute('aria-valuenow',String(step));
    const live=document.getElementById('wizard-status');
    if(live)live.textContent='Paso '+step+' de 5';
  }
  function error(message,target){
    const box=document.getElementById('wizard-errors');
    if(box){box.hidden=false;box.textContent=message;box.focus({preventScroll:false});}
    if(target){
      target.setAttribute('aria-invalid','true');
      target.setAttribute('aria-describedby','wizard-errors');
      target.focus({preventScroll:false});
    }
  }
  function clearError(){
    const box=document.getElementById('wizard-errors');
    if(box){box.hidden=true;box.textContent='';}
    for(const e of all('#unifiedBandingForm [aria-invalid="true"]')){
      e.removeAttribute('aria-invalid');
      if(e.getAttribute('aria-describedby')==='wizard-errors')e.removeAttribute('aria-describedby');
    }
  }
  function assignLabels(){
    let id=0;
    for(const input of all('#unifiedBandingForm input,#unifiedBandingForm textarea,#unifiedBandingForm select')){
      if(input.type==='hidden'||input.type==='radio'||input.type==='checkbox')continue;
      if(input.labels?.length||input.hasAttribute('aria-label'))continue;
      const parent=input.parentElement;
      const local=parent?.querySelector('label:not([for])');
      if(local){
        if(!input.id)input.id='evidence-field-'+(++id);
        local.setAttribute('for',input.id);
      }else if(input.name)input.setAttribute('aria-label',input.name.replace(/_/g,' '));
    }
  }
  function init(config={}){
    onTab=config.onTab;
    const nav=document.getElementById('tab-navigation');
    if(nav){
      nav.setAttribute('role','tablist');
      nav.setAttribute('aria-orientation','horizontal');
      nav.addEventListener('keydown',event=>{
        const target=event.target.closest('.tab');
        if(!target)return;
        const buttons=all('#tab-navigation .tab');
        const i=buttons.indexOf(target);
        let next=-1;
        if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(i+1)%buttons.length;
        if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i+buttons.length-1)%buttons.length;
        if(event.key==='Home')next=0;
        if(event.key==='End')next=buttons.length-1;
        if(next<0)return;
        event.preventDefault();
        buttons[next].focus();
        onTab?.(buttons[next].dataset.tab);
      });
    }
    assignLabels();
    syncTabs('evaluacion_unificada');
    syncWizard(1);
  }
  root.ControlBandingA11y=Object.freeze({init,syncTabs,syncWizard,error,clearError,assignLabels});
})(window);
