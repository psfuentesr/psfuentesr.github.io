/**
 * PFA Feedback Widget (v2)
 * Clean, self-contained implementation for the 'Report Issue' UX requested.
 */
(function() {
  'use strict';

  const CONFIG = {
    enabled: true,
    email: 'rfiguerc@uc.cl',
    githubRepo: 'frenetico55555/pfa_simulator_web',
    reportEndpoint: '',
    version: '1.1'
  };

  if (!CONFIG.enabled) return;

  let isInitialized = false;

  function captureContext() {
    const urlParams = new URLSearchParams(location.search);
    return {
      timestamp: new Date().toISOString(),
      url: location.href,
      userAgent: navigator.userAgent,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      mode: urlParams.get('mode') || 'none',
      referrer: document.referrer || 'direct',
      bootLog: window.PFA_BOOT_LOG || [],
      errors: window.__PFA_ERRORS || [],
      localStorageSnapshot: (function(){ try { return { pfa_api_key: localStorage.getItem('pfa_api_key'), pfa_demo_mode: localStorage.getItem('pfa_demo_mode') }; } catch(e) { return {}; } })()
    };
  }

  function createWidget() {
    const html = `
      <div id="pfa-feedback-widget" style="position:fixed; right:20px; bottom:20px; z-index:9999; font-family:system-ui;">
        <button id="pfa-feedback-btn" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:#fff; border-radius:50px; padding:10px 18px; border:none; cursor:pointer; display:flex; gap:8px; align-items:center; box-shadow:0 6px 18px rgba(0,0,0,0.12);">🐞 <span id="pfa-feedback-text">Report Issue</span></button>
        <div id="pfa-feedback-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:10000; backdrop-filter:blur(4px);">
          <div style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); background:#fff; border-radius:14px; padding:20px; width:min(720px,94%); max-height:86vh; overflow:auto; box-shadow:0 30px 60px rgba(0,0,0,0.25);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><h3 style="margin:0;">Report Issue</h3><button id="pfa-feedback-close" style="border:none; background:transparent; cursor:pointer; font-size:22px;">×</button></div>
            <div style="margin-bottom:10px;"><label style="font-weight:700; display:block; margin-bottom:6px;">Tipo</label><div style="display:flex; gap:8px; flex-wrap:wrap;"><label onclick="selectFeedbackType(this,'bug')" style="cursor:pointer;padding:8px;border-radius:8px;border:2px solid #e5e7eb;display:flex;gap:6px;align-items:center;"><input type=radio name=feedbackType value=bug style="margin:0">🐛 Bug</label><label onclick="selectFeedbackType(this,'suggestion')" style="cursor:pointer;padding:8px;border-radius:8px;border:2px solid #e5e7eb;display:flex;gap:6px;align-items:center;"><input type=radio name=feedbackType value=suggestion style="margin:0">💡 Sugerencia/Idea</label><label onclick="selectFeedbackType(this,'comment')" style="cursor:pointer;padding:8px;border-radius:8px;border:2px solid #e5e7eb;display:flex;gap:6px;align-items:center;"><input type=radio name=feedbackType value=comment style="margin:0">💬 Comentario</label></div></div>
            <div style="margin-bottom:12px;"><label style="font-weight:700; display:block; margin-bottom:6px;">Descripción</label><textarea id="pfa-feedback-description" style="width:100%;min-height:110px;padding:8px;border-radius:8px;border:2px solid #e5e7eb;resize:vertical;"></textarea></div>
            <div style="margin-bottom:12px;"><label style="display:block;font-weight:700;margin-bottom:6px;">Email (opcional)</label><input id="pfa-feedback-email" type=email style="width:100%;padding:8px;border-radius:8px;border:2px solid #e5e7eb;"></div>
            <details style="margin-bottom:10px;"><summary style="cursor:pointer;font-weight:700;">🔧 Contexto automático</summary><pre id="pfa-context-preview" style="white-space:pre-wrap;padding:8px;border-radius:8px;background:#f8fafc;margin-top:8px;font-size:12px;color:#374151;">Cargando...</pre></details>
            <div style="display:flex;justify-content:flex-end;gap:8px;"><button id="pfa-feedback-copy" style="background:#f3f4f6;border-radius:8px;padding:8px 12px;border:1px solid #d1d5db;">📋 Copiar</button><button id="pfa-feedback-submit" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:8px 14px;border-radius:8px;border:none;">🚀 Enviar</button></div>
            <div id="pfa-feedback-status" style="display:none;margin-top:8px;padding:8px;border-radius:8px;font-size:13px;"></div>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  window.selectFeedbackType = function(el, type) { try { el.parentNode.querySelectorAll('label').forEach(l=>{ l.style.borderColor='#e5e7eb'; l.style.background='white'; }); el.style.borderColor='#3b82f6'; el.style.background='#eff6ff'; el.querySelector('input').checked=true; } catch(e){} };

  function updateContextPreview(){ const ctx = captureContext(); const p = document.getElementById('pfa-context-preview'); if (p) p.textContent = JSON.stringify(ctx, null, 2); }

  function generateGitHubIssueBody(type, description, email, context, internalId){
    var lines = [];
    lines.push('## ' + (type === 'bug' ? '🐛 Bug' : type === 'suggestion' ? '💡 Sugerencia/Idea' : '💬 Comentario'));
    lines.push(''); lines.push('### Descripción'); lines.push(description); lines.push(''); lines.push('### Contacto'); lines.push(email?('Email: '+email):'No proporcionado'); lines.push(''); lines.push('### Registro Interno'); lines.push(internalId?('ID: '+internalId):'No guardado internamente'); lines.push(''); lines.push('### Contexto técnico'); lines.push(JSON.stringify(context,null,2)); lines.push(''); lines.push('---'); lines.push('*Automáticamente generado por PFA Feedback Widget v'+CONFIG.version+'*');
    return lines.join('\n');
  }

  function saveInternalRecord(payload){ try{ var id='r_'+Date.now().toString(36)+Math.random().toString(36).substr(2,6); var entry = Object.assign({id:id,created_at:new Date().toISOString(),version:CONFIG.version}, payload); try{ const key='pfa_feedback_log'; const raw=localStorage.getItem(key); const arr=raw?JSON.parse(raw):[]; arr.push(entry); localStorage.setItem(key, JSON.stringify(arr)); }catch(e){console.warn('no fue posible guardar registro localmente', e);} if(CONFIG.reportEndpoint && CONFIG.reportEndpoint.trim()){ fetch(CONFIG.reportEndpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry)}).catch(e=>console.warn('error enviando registro al endpoint', e)); } return entry; }catch(e){ console.warn('save error',e); return null; } }

  function sendToGitHub(type, description, email, context, internalId){ const title = '['+type.toUpperCase()+'] '+description.substring(0,50)+(description.length>50?'...':''); const body = encodeURIComponent(generateGitHubIssueBody(type,description,email,context,internalId)); const labels = type==='bug'?'bug':type==='suggestion'?'enhancement':'comment'; const url = 'https://github.com/'+CONFIG.githubRepo+'/issues/new?title='+encodeURIComponent(title)+'&body='+body+'&labels='+labels; window.open(url,'_blank'); showStatus('✅ Issue creado (nueva pestaña)', 'success'); }

  function sendToEmail(type, description, email, context){ const subject = '[PFA Feedback] '+type+': '+description.substring(0,30); const body = 'Tipo: '+type+'\nDescripcion: '+description+'\nEmail: '+(email||'No proporcionado')+'\n\nContexto:\n'+JSON.stringify(context,null,2); location.href = 'mailto:'+CONFIG.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body); }

  function copyToClipboard(){ const type = document.querySelector('input[name="feedbackType"]:checked')?.value||'general'; const desc = (document.getElementById('pfa-feedback-description')||{}).value||''; const email=(document.getElementById('pfa-feedback-email')||{}).value||''; const ctx = captureContext(); const txt = 'Type: '+type+'\nDescription: '+desc+'\nEmail: '+email+'\n\nContext:\n'+JSON.stringify(ctx,null,2); navigator.clipboard?.writeText(txt).then(()=>showStatus('📋 Copiado','success')).catch(()=>showStatus('❌ Error copiando','error')) }

  function showStatus(msg, type){ const el = document.getElementById('pfa-feedback-status'); if(!el) return; const map = { success:{bg:'#dcfce7',border:'#16a34a',color:'#166534'}, error:{bg:'#fee2e2',border:'#dc2626',color:'#991b1b'}, loading:{bg:'#eff6ff',border:'#3b82f6',color:'#1e40af'} }; const s=map[type]||map.loading; el.style.display='block'; el.style.background=s.bg; el.style.border='1px solid '+s.border; el.style.color=s.color; el.textContent=msg; if(type!=='loading') setTimeout(()=>el.style.display='none',4000); }

  function submitFeedback(){ const type = document.querySelector('input[name="feedbackType"]:checked')?.value; const desc = (document.getElementById('pfa-feedback-description')||{}).value?.trim?.() || ''; const email=(document.getElementById('pfa-feedback-email')||{}).value?.trim?.() || ''; if(!type||!desc){ showStatus('Por favor completa tipo y descripción','error'); return; } const ctx = captureContext(); showStatus('📤 Enviando...', 'loading'); const rec = saveInternalRecord({ type, description: desc, email, context: ctx }); sendToGitHub(type, desc, email, ctx, rec?.id); if(email) sendToEmail(type,desc,email,ctx); }

  function attach(){ document.getElementById('pfa-feedback-btn')?.addEventListener('click', ()=>{ document.getElementById('pfa-feedback-modal').style.display='block'; updateContextPreview(); }); document.getElementById('pfa-feedback-close')?.addEventListener('click', ()=>document.getElementById('pfa-feedback-modal').style.display='none'); document.getElementById('pfa-feedback-modal')?.addEventListener('click', e=>{ if(e.target && e.target.id==='pfa-feedback-modal') document.getElementById('pfa-feedback-modal').style.display='none'; }); document.getElementById('pfa-feedback-submit')?.addEventListener('click', submitFeedback); document.getElementById('pfa-feedback-copy')?.addEventListener('click', copyToClipboard); document.addEventListener('keydown', e=>{ if(e.key==='Escape') document.getElementById('pfa-feedback-modal').style.display='none'; }); }

  function init(){ if(isInitialized) return; if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); return; } createWidget(); attach(); isInitialized=true; console.log('PFA feedback v2 started'); }

  init();

})();
