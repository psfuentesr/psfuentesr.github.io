# 🐛 Sistema de Feedback Universal - PFA Simulator

## 📋 Visión General

El **Sistema de Feedback Universal** permite a los testers y usuarios enviar reportes de errores y sugerencias **con mínimo esfuerzo** durante la fase de desarrollo. Está integrado en todas las páginas principales del ecosistema.

## 🎯 Características Principales

### ✨ **Botón Flotante Inteligente**
- Visible en todas las páginas durante desarrollo
- No intrusivo, posicionado en esquina inferior derecha
- Captura automática de contexto técnico

### 🔄 **Canales y comportamiento**
- **🐛 Bugs/Errores** → GitHub Issues (se abre un issue pre-llenado y se sugiere enviar)
- **💡 Sugerencias/Ideas** → GitHub Issues (ahora también generan issues para un seguimiento centralizado)
- **💬 Comentarios** → GitHub Issues (registrados y revisables)

### 🤖 **Captura Automática de Contexto**
- URL actual y modo de usuario
- Información del navegador y viewport
- Logs de inicialización (PFA_BOOT_LOG)
- Errores de consola JavaScript
- ID de sesión único
- Timestamp preciso

## 🚀 Cómo Usar

### **Para Testers/Usuarios:**

1. **Acceder al sistema**: Cualquier página con el widget activado
2. **Reportar issue**: Clic en botón flotante "🐛 Reportar Issue"
3. **Seleccionar tipo**: Bug, Sugerencia, o Urgente
4. **Describir problema**: Llenar descripción clara
5. **Enviar**: El sistema redirige automáticamente según el tipo

### **Para Desarrolladores:**

El widget está habilitado por defecto y visible en toda la aplicación. Puedes desactivarlo editando la variable CONFIG.enabled en `feedback-widget-v2.js`.

## 📁 Archivos del Sistema

```
codigo-interno/
├── feedback-widget.js          # Widget universal de feedback (cliente)
└── server_feedback.py          # Servidor opcional para guardar reportes y crear issues automáticamente

.github/ISSUE_TEMPLATE/
├── config.yml                  # Configuración de templates
├── bug_report.yml              # Template para bugs
├── feature_request.yml         # Template para sugerencias
└── urgent_issue.yml            # Template para issues urgentes
```

## 🔧 Integración en Páginas

El widget se integra añadiendo una línea antes del cierre de `</body>`:

```html
<!-- Sistema de Feedback Universal -->
<script src="codigo-interno/feedback-widget-v2.js"></script>
```

### **Páginas Integradas:**
 - ✅ `app.html` (Hub de desarrollo)
 - ✅ `2. PFA - página Web.html` (Simulador principal)
 - ✅ `1. Editor de Prompts.html` (Editor de prompts)
 - ✅ `test_web.html`, `404.html` (y otras páginas donde se incluya la línea script)

## 📊 Flujo de Trabajo

### **Tipo: Bug/Error 🐛**
```
Usuario reporta → GitHub Issue → Desarrollador asigna → Fix → Close issue
```

### **Tipo: Sugerencia 💡**
```
Usuario sugiere → Email directo → Evaluación → Implementación opcional
```

### **Tipo: Urgente ⚡**
```
Usuario reporta → GitHub Issue + Email → Atención inmediata → Resolución rápida
```

## 🛠️ Configuración Técnica

### **Variables de Configuración** (`feedback-widget-v2.js`):
```javascript
const CONFIG = {
    enabled: true,                              // Activar/desactivar widget
    email: 'rfiguerc@uc.cl',                   // Email para notificaciones/opcional
    githubRepo: 'frenetico55555/pfa_simulator_web', // Repo para issues
    reportEndpoint: '',                         // Opcional: 'http://localhost:8001/report' para persistir internamente
    version: '1.1'                              // Versión del widget
};
```

### **Detección de Entorno**:
```javascript
const isDev = location.hostname === 'localhost' || 
              location.hostname === '127.0.0.1' || 
              location.search.includes('feedback=true') ||
              location.hostname.includes('github.io');
```

## 📋 Templates de GitHub Issues

### **🐛 Bug Report** (`bug_report.yml`)
- Severidad (Crítico, Alto, Medio, Bajo)
- Componente afectado
- Pasos para reproducir
- Comportamiento esperado vs actual
- Contexto técnico automático

### **💡 Feature Request** (`feature_request.yml`)
- Prioridad (Alta, Media, Baja)
- Categoría de mejora
- Problema que resuelve
- Solución propuesta
- Impacto esperado

### **⚡ Urgent Issue** (`urgent_issue.yml`)
- Razón de urgencia
- Impacto inmediato
- Soluciones intentadas
- Contacto directo para seguimiento

## 🔍 Contexto Técnico Capturado

Cada reporte incluye automáticamente:

```json
{
    "timestamp": "2025-10-01T19:30:00.000Z",
    "sessionId": "pfa_abc123def456",
    "url": "https://frenetico55555.github.io/pfa_simulator_web/app.html",
    "userAgent": "Mozilla/5.0...",
    "viewport": "1920x1080",
    "mode": "instructor",
    "referrer": "direct",
    "bootLog": ["[loader_v2] Cargando primario...", "..."],
    "errors": [{"time": "...", "message": "..."}]
}
```

## 🎛️ Opciones de Envío

### **GitHub Issues**
- Pre-llena title, body, labels
- Abre en nueva ventana
- Requiere GitHub account

### **Email Directo**
- Abre cliente de email local
- Subject y body pre-llenados
- No requiere autenticación

### **Copiar al Portapapeles**
- Copia toda la información
- Para pegar en otros canales
- Fallback si otros métodos fallan

## 🚦 Estados y Notificaciones

El widget muestra estados visuales:
- **📤 Enviando...** (azul)
- **✅ Enviado correctamente** (verde)
- **❌ Error en envío** (rojo)

## 🔒 Consideraciones de Privacidad

- **No se almacenan datos** en servidores propios
- **Contexto técnico** incluye solo información de debugging
- **Email opcional** en reportes
- **Funciona offline** para copiar información

## 🧪 Testing del Sistema

### **Probar localmente:**
```bash
cd /path/to/pfa_simulator_web
python3 -m http.server 8000
# Visitar: http://localhost:8000/app.html
```

### **Servidor opcional para almacenamiento y creación automática de issues**

1. Ejecuta el servidor (usa puerto 8001 por defecto):

```bash
python codigo-interno/server_feedback.py
```

2. Para que el servidor cree issues automáticamente también, exporta las siguientes variables de entorno:

```bash
export GITHUB_TOKEN="ghp_xxx..."   # token con permisos de issues
export GITHUB_REPO="owner/repo"    # p.ej. frenetico55555/pfa_simulator_web
```

3. Configura el widget en `feedback-widget-v2.js` para apuntar al endpoint, p.e.:

```javascript
CONFIG.reportEndpoint = 'http://localhost:8001/report';
```

El servidor guardará reportes en `feedback_reports.json` y, si está configurado, creará el issue en GitHub automáticamente.

### **Verificar integración:**
1. Buscar botón flotante "🐛 Reportar Issue"
2. Clic para abrir modal
3. Seleccionar tipo de feedback
4. Verificar contexto técnico en preview
5. Probar envío (crea issue/email real)

## 📈 Métricas y Seguimiento

Los reportes se pueden trackear en:
- **GitHub Issues**: https://github.com/frenetico55555/pfa_simulator_web/issues
- **Email inbox**: rfiguerc@uc.cl
- **Logs de consola**: Iniciación del widget y errores

## 🔮 Roadmap Futuro

### **Versión 1.1**
- [ ] Captura automática de screenshots
- [ ] Integración con Slack/Discord
- [ ] Analytics de feedback

### **Versión 1.2**
- [ ] Feedback por voz
- [ ] Modo offline completo
- [ ] Dashboard de métricas

---

**📝 Documentación generada**: Octubre 2025  
**🚀 Sistema activo en**: Rama `feature/feedback-system`  
**👨‍💻 Mantenedor**: @frenetico55555