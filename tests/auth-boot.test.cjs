'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');

// HTML parsing runs inline classic scripts BEFORE external scripts with defer.
// AuthGate is therefore not yet defined when the inline application script is parsed.
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const inline = scripts.filter(([,attrs,body])=>!attrs.includes('src=') && body.includes('const App ='));
assert.equal(inline.length,1,'Se encontró un solo bootstrap inline de App');
const listeners = {};
const window = {jspdf:{jsPDF:function jsPDF(){}}};
const lucide={createIcons(){}};
const document = {
  addEventListener(name,fn){listeners[name]=fn;},
  getElementById(id){return null;}
};
assert.doesNotThrow(()=>{
  vm.runInNewContext(inline[0][2],{window,document,lucide,console,URL,Intl,Date,setTimeout,clearTimeout},{timeout:2000});
},'El inline no debe requerir AuthGate mientras carga el HTML');
assert.equal(typeof listeners.DOMContentLoaded,'function');
assert.ok(window.App,'App queda disponible para AuthGate');

let count=0;
window.AuthGate={boot(){count++;}};
assert.doesNotThrow(()=>listeners.DOMContentLoaded());
assert.equal(count,1,'AuthGate.boot se inicia tras ejecutarse defer');

// Si falla la descarga del archivo externo, se anuncia el error sin enviar credenciales.
delete window.AuthGate;
let errorEl={hidden:true,textContent:''};
document.getElementById=id=>id==='gate-error'?errorEl:null;
assert.doesNotThrow(()=>listeners.DOMContentLoaded());
assert.equal(errorEl.hidden,false);
assert.ok(errorEl.textContent.includes('módulo de acceso'));

// Fallo cerrado: formulario no envía cédula ni código por GET si el JS falla.
assert.match(html,/<form\b[^>]*id="member-login-form"[^>]*method="post"[^>]*onsubmit="return false"/);
assert.doesNotMatch(html,/DOMContentLoaded', AuthGate\.boot/);
console.log('OK: auth init load-order, deferred boot, secure form fallback');
