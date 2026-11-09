'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
for(const [i,block] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].entries()){
  if(block[1].trim())assert.doesNotThrow(()=>new vm.Script(block[1],{filename:'index.html:inline-'+i+'.js'}));
}
const expected=[
  'id="member-gate"','id="member-login-form"','name="documento"','name="codigo"',
  'id="member-logout"','id="member-name"','class="m-logo"',
  'src="auth-gate.js"','src="methodology.js"','href="theme-2026.css"',
  'src="evaluation-evidence.js"','src="report-pdf.js"','src="accessibility.js"',
  'ControlBandingMethod.mixture(items)','ControlBandingMethod.compatibility(a.codes,b.codes)',
  'AuthGate.ensureSession()','DOMContentLoaded\', AuthGate.boot',
  'id="fdSource"','id="fdRevision"','id="planAction"','id="planEvidence"',
  'id="save-draft-btn"','id="restore-draft-btn"','id="export-history-btn"',
  'id="import-history-btn"','id="wizard-errors"','id="main-content"',
  'ControlBandingEvidence.validate(','ControlBandingReport.render(',
  'HistoryManager.loadToEdit(','ControlBandingA11y.syncWizard(',
  "get key() { return 'sst_evaluations_history_' + AuthGate.userId(); }"
];
for(const fragment of expected)assert.ok(html.includes(fragment),'Falta integración: '+fragment);
assert.equal(html.includes("let status = 'COMPATIBLE'"),false);
assert.equal(html.includes("let bandInh = 'A'"),false);
assert.ok(html.includes('Gas (fuera del alcance COSHH Essentials)'));
assert.ok(html.includes('HSE'));
console.log('Integración HTML y sintaxis de scripts verificada');
