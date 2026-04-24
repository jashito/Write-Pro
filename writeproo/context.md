# CONTEXT DEL PROYECTO

Instrucción para la IA: Lee este archivo completo antes de responder cualquier cosa. Este documento es la fuente de verdad del proyecto. Continúa desde el estado descrito aquí.

## Resumen del Proyecto

- Nombre: WritePro
- Qué hace: Corrector de escritura web (similar a Grammarly) que detecta errores de ortografía, gramática, puntuación y estilo en español e inglés, con indicador de tono y reescritura de frases con estilos. 100% open source, sin APIs de pago ni modelos propietarios.
- Estado actual: **Activo** — v2 con UI mejorada y prompts anti-hallucinación

## Stack Tecnológico

- Runtime: Node.js (solo para dev server y build)
- Build: Vite (vanilla, sin framework)
- Frontend: Vanilla JS + HTML + CSS (sin React, sin frameworks)
- Estilo visual: Inspirado en shadcn/ui — tokens CSS oklch, componentes reutilizables
- Editor de texto: CodeMirror 6 (subrayado inline de errores)
- Motor gramática: LanguageTool
  - Dev: API pública https://api.languagetool.org/v2/check
  - Prod: self-hosted docker run -p 8010:8010 silviof/docker-languagetool
- Detección idioma: franc-min (detecta ES/EN automáticamente)
- Tono básico: wink-sentiment (instantáneo, sin red)
- Reescritura avanzada: Ollama con qwen2.5:7b (controlado por prompts anti-hallucinación)
- Aplicar cambios: diff-match-patch

## Estructura del Proyecto

writeproo/
├── index.html
├── vite.config.js
├── package.json
├── .env
├── .env.example
├── .gitignore
├── context.md
├── sessions-cursor/
├── LICENSE
└── src/
    ├── main.js
    ├── editor/
    │   ├── index.js
    │   └── markers.js
    ├── services/
    │   ├── capabilities.js
    │   ├── languagetool.js
    │   ├── sentiment.js
    │   ├── rewrite.js
    │   ├── langdetect.js
    │   └── ltIgnoredRules.js
    ├── ui/
    │   ├── tooltip.js
    │   ├── sidepanel.js
    │   ├── statusbar.js
    │   └── toast.js
    ├── core/
    │   ├── orchestrator.js
    │   ├── diff.js
    │   └── languageToolBridge.js
    └── styles/
        ├── main.css
        ├── editor.css
        ├── tooltip.css
        ├── sidepanel.css
        ├── statusbar.css
        ├── toast.css
        └── components.css

## Lo que está implementado

| Componente | Descripción | Estado |
|------------|-------------|--------|
| Editor CodeMirror 6 | Texto plano con números de línea, resaltado de línea activa | ✅ |
| Subrayados LanguageTool | spelling (rojo), grammar (amarillo), style (azul) | ✅ |
| Tooltip dialog | Click en error → dialog con sugerencias, backdrop blur | ✅ |
| Aceptar sugerencia | diff-match-patch aplica el cambio | ✅ |
| Ignorar / Ignorar siempre | Persistencia en localStorage | ✅ |
| Detección de idioma | franc-min → ES/EN → LanguageTool | ✅ |
| Selector de idioma manual | Auto / Español / English en header | ✅ |
| Tono básico (wink-sentiment) | Badge + puntuación en sidepanel | ✅ |
| Reescritura Ollama | 4 estilos: Profesional/Directo/Amigable/Formal | ✅ |
| Status bar | Indicadores de LanguageTool, Ollama, Local, Transformers | ✅ |
| Persistencia | Texto guardado en localStorage | ✅ |
| Notificaciones toast | Múltiples stacked con dismiss | ✅ |
| UI shadcn-inspired | Tokens CSS, botones, select, textarea, badges | ✅ |

## Estilos de Reescritura

| Estilo | Descripción | Prompt Focus |
|--------|-------------|--------------|
| Profesional | Comunicación corporativa formal | Eliminar muletillas, corregir estructura |
| Directo | Máxima brevedad | Condensar, eliminar saludos innecesarios |
| Amigable | Tono cálido y natural | Lenguaje humano, no administrativo |
| Formal | Lenguaje técnico-académico | Vocabulario preciso, máxima corrección |

**Prompts anti-hallucinación:**
- COPY → VERIFY → REWRITE → VERIFY
- COPIA textual nombres, fechas, datos
- NO inventes información

**Temperatura Ollama:** 0.1 (baja creatividad)

## Problemas Conocidos

- LanguageTool público: límite 20 req/min y 20KB por request. Para producción usar self-hosted.
- Vite watcher puede fallar con EMFILE: usar `npm run build` + servir dist estático.

## Convenciones del Proyecto

- Naming: camelCase para variables y funciones
- Módulos: ES Modules nativos (import/export), sin CommonJS
- Servicios: cada motor vive en su propio archivo en src/services/
- Never llam APIs directamente desde ui/ o editor/
- Errores de motor: { ok: false, error: string }
- CSS: variables CSS en main.css para colores y tokens

## Tokens CSS (shadcn-inspired)

```css
--background: oklch(0.99 0 0)
--foreground: oklch(0.15 0.02 280)
--primary: oklch(0.55 0.2 250)
--secondary: oklch(0.96 0.01 280)
--muted: oklch(0.96 0.01 280)
--accent: oklch(0.96 0.01 280)
--destructive: oklch(0.55 0.2 25)
--border: oklch(0.92 0.01 280)
--radius: 0.5rem
```

## Colores de Error

```css
--color-error-spelling: #ef4444
--color-error-grammar: #eab308
--color-error-style: #3b82f6
```

## Variables de Entorno

```env
VITE_LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
VITE_OLLAMA_URL=http://54.146.142.76:11434
VITE_OLLAMA_MODEL=qwen2.5:7b
```

## Referencias Útiles

LanguageTool API: https://languagetool.org/http-api/
CodeMirror 6 docs: https://codemirror.net/docs/
Transformers.js: https://huggingface.co/docs/transformers.js
Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
shadcn/ui: https://ui.shadcn.com/

## Notas de la Sesión v2

- UI completamente rediseñada con estética shadcn/ui
- Sistema de toast mejorado (múltiples, stacked, dismiss)
- Tooltip convertido en dialog con backdrop blur
- Prompts de reescritura con estructura COPY → VERIFY → REWRITE → VERIFY
- Modelo Ollama: qwen2.5:7b (antes qwen2.5:1.5b)
- Temperatura reducida a 0.1 para reducir alucinaciones
- Transformers.js UI deshabilitado temporalmente (solo Ollama)
- Selector de idiomas en header (Auto/ES/EN)
- Persistencia del texto en localStorage
- Todo commited y pusheado al repositorio