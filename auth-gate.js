/* Acceso para integrantes de La Movida. Las credenciales se validan en Supabase,
 * no se guardan en localStorage, y cada sesión se contrasta con Auth.getUser().
 * El HTML en GitHub Pages es público; la puerta protege la experiencia, no el código fuente.
 */
(function(root){
  'use strict';
  const URL='https://lfdmbkzghnwvsapxypvt.supabase.co';
  const PUBLISHABLE='sb_publishable_bRnkA6PA8-v073nrw9zxiQ_8rVGiOn1'; // clave pública (NO service_role)
  const ENDPOINT=URL+'/functions/v1/crear-sesion-integrante';
  let client=null, member=null, booted=false, initialized=false;
  function text(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
  function error(message){const el=document.getElementById('gate-error');if(el){el.textContent=message;el.hidden=false;}}
  function clearError(){const el=document.getElementById('gate-error');if(el){el.hidden=true;el.textContent='';}}
  function lock(message){
    member=null;
    document.body.classList.add('auth-pending');document.body.classList.remove('auth-ready');
    text('member-name','');
    if(message)error(message);
  }
  function unlock(user,info){
    if(!user?.id)throw new Error('No se pudo verificar la identidad.');
    member=user;
    text('member-name', [info?.nombres,info?.apellidos].filter(Boolean).join(' ') || 'Integrante');
    clearError();
    document.body.classList.remove('auth-pending');document.body.classList.add('auth-ready');
    if(!initialized){initialized=true;root.App.init();}
  }
  async function ensureSession(){
    if(!client||!member)return false;
    try{
      const {data, error:failure}=await client.auth.getUser();
      if(failure||!data?.user?.id||data.user.id!==member.id)throw new Error('sesión no validada');
      return true;
    }catch{
      lock('La sesión venció o no pudo verificarse. Ingresa nuevamente.');
      return false;
    }
  }
  async function login(event){
    event.preventDefault();clearError();
    const form=event.currentTarget, button=form.querySelector('button[type=submit]');
    const documentId=String(form.elements.documento.value||'').replace(/\D/g,'');
    const code=String(form.elements.codigo.value||'').trim().toUpperCase();
    if(documentId.length<3||code.length<4||code.length>24){error('Introduce tu cédula y el código de integrante vigente.');return;}
    button.disabled=true;text('gate-submit-label','Validando credenciales…');
    try{
      if(!client)throw new Error('No está disponible el servicio de autenticación.');
      const response=await fetch(ENDPOINT,{
        method:'POST',mode:'cors',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',
        headers:{'Content-Type':'application/json','apikey':PUBLISHABLE},
        body:JSON.stringify({documento:documentId,codigo:code})
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok||!payload?.ok||!payload?.token_hash)throw new Error(response.status===401?'Cédula o código no válidos.': 'No fue posible validar las credenciales. Vuelve a intentarlo.');
      // La Edge Function revalida identidad y entrega un token de un solo uso.
      const {error:verifyFailure}=await client.auth.verifyOtp({token_hash:payload.token_hash,type:'magiclink'});
      if(verifyFailure)throw new Error('No fue posible crear la sesión. Vuelve a ingresar.');
      const {data, error:userFailure}=await client.auth.getUser(); // validación real con servidor
      if(userFailure||!data?.user)throw new Error('La sesión no pudo validarse con el servidor.');
      form.reset();
      unlock(data.user,payload.integrante);
    }catch(e){
      form.elements.codigo.value='';
      error(e?.message||'Error de conexión. Comprueba tu acceso a internet.');
    }finally{button.disabled=false;text('gate-submit-label','Ingresar a Control Banding');}
  }
  async function boot(){
    if(booted)return;booted=true;
    document.getElementById('member-login-form')?.addEventListener('submit',login);
    document.getElementById('member-logout')?.addEventListener('click',async()=>{
      if(client)await client.auth.signOut().catch(()=>{});
      location.reload();
    });
    if(!root.supabase?.createClient){error('No se cargó el servicio de autenticación. Comprueba tu conexión.');return;}
    try{
      client=root.supabase.createClient(URL,PUBLISHABLE,{auth:{
        persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storage:root.sessionStorage,
        storageKey:'controlbanding-auth-v1'
      }});
      const {data:{session}={}}=await client.auth.getSession();
      if(session){
        const {data,error:userError}=await client.auth.getUser();
        if(!userError&&data?.user?.id){
          unlock(data.user,data.user.user_metadata||{});return;
        }
        await client.auth.signOut();
      }
      lock();
    }catch{lock('No se pudo recuperar la sesión. Ingresa con tus credenciales.');}
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&member)ensureSession();});
  root.AuthGate={boot,ensureSession,isReady:()=>!!member,userId:()=>member?.id||'sin-sesion'};
})(window);
