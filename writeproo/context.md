# CONTEXT DEL PROYECTO

Instrucción para la IA: Lee este archivo completo antes de responder cualquier cosa. Este documento es la fuente de verdad del proyecto. Continúa desde el estado descrito aquí.

## Resumen del Proyecto

- Nombre: WritePro
- Qué hace: Corrector de escritura web (similar a Grammarly) que detecta errores de ortografía, gramática, puntuación y estilo en español e inglés, con indicador de tono y reescritura de frases. 100% open source, sin APIs de pago ni modelos propietarios.
- Estado actual: **Completo** — los 9 pasos del CONTEXT están implementados
- Contexto: Proyecto independiente. No tiene relación con App_Rewrite (redactor corporativo con Gemini), que permanece en su propio repo.

## Stack Tecnológico

- Runtime: Node.js (solo para dev server y build)
- Build: Vite (vanilla, sin framework)
- Frontend: Vanilla JS + HTML + CSS (sin React, sin frameworks)
- Estilo visual: Inspirado en shadcn/ui — cards, tokens CSS, estados loading/error/success bien definidos
- Editor de texto: CodeMirror 6 (subrayado inline de errores)
- Motor gramática: LanguageTool
  - Dev: API pública https://api.languagetool.org/v2/check
  - Prod: self-hosted docker run -p 8010:8010 silviof/docker-languagetool
- Detección idioma: franc-min (detecta ES/EN automáticamente)
- Tono básico: wink-sentiment (instantáneo, sin red)
- Tono avanzado + reescritura básica: @xenova/transformers (corre en browser via WebAssembly, se cachea en IndexedDB)
- Reescritura avanzada: Ollama local (opcional, detectado en runtime)
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
    │   └── statusbar.js
    ├── core/
    │   ├── orchestrator.js
    │   ├── diff.js
    │   └── languageToolBridge.js
    └── styles/
        ├── main.css
        ├── editor.css
        ├── tooltip.css
        ├── sidepanel.css
        └── statusbar.css

## Lo que ya está hecho

Todos los 9 pasos implementados:

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | Setup Vite vanilla + dependencias + estructura + .env/.gitignore | ✅ Completo |
| 2 | Editor base CodeMirror 6 (texto plano, 60% layout responsive) | ✅ Completo |
| 3 | LanguageTool API + debounce 800ms + markers (spelling/grammar/style) | ✅ Completo |
| 4 | Tooltip sugerencias + diff-match-patch + botones Aceptar/Ignorar/Ignorar siempre | ✅ Completo |
| 5 | Detección idioma (franc-min) → LanguageTool | ✅ Completo |
| 6 | Tono básico (wink-sentiment) + sidepanel | ✅ Completo |
| 7 | Transformers.js carga lazy + tono avanzado + reescritura básica | ✅ Completo |
| 8 | Ollama opcional (detección + reescritura) | ✅ Completo |
| 9 | Status bar con 4 indicadores de motores | ✅ Completo |

## Trabajo de la Última Sesión

Implementación completa del proyecto WritePro según los 9 pasos del CONTEXT:
- Editor CodeMirror 6 con subrayados inline por categoría
- LanguageTool con debounce y persistencia de reglas ignoradas
- Detección automática de idioma ES/EN
- Panel lateral con tono (básico + avanzado con Transformers)
- Reescritura con Transformers.js (Flan-T5) y Ollama opcional
- Status bar con estado de todos los motores

## Próximos Pasos

Todos completados — el proyecto está listo para usar.

## Problemas Conocidos

En este entorno, el watcher de Vite puede fallar con EMFILE: too many open files.
Workaround: vite build --watch o vite build + servir el dist estático.

## Convenciones del Proyecto

- Naming: camelCase para variables y funciones
- Módulos: ES Modules nativos (import/export), sin CommonJS
- Servicios: cada motor vive en su propio archivo en src/services/
- Nunca llamar APIs directamente desde ui/ o editor/
- Errores de motor: { ok: false, error: string }
- CSS: variables CSS en main.css para colores y tokens

Colores de error:
--color-error-spelling: #ef4444
--color-error-grammar: #eab308
--color-error-style: #3b82f6

## Variables de Entorno

VITE_LANGUAGETOOL_URL=https://api.languagetool.org/v2/check
VITE_OLLAMA_URL=http://54.146.142.76:11434
VITE_OLLAMA_MODEL=llama3.2

## Referencias Útiles

LanguageTool API: https://languagetool.org/http-api/
CodeMirror 6 docs: https://codemirror.net/docs/
Transformers.js: https://huggingface.co/docs/transformers.js
Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
shadcn/ui: https://ui.shadcn.com/

## Notas Adicionales

LanguageTool público: límite 20 req/min y 20KB por request.
Para producción usar self-hosted con Docker.

Transformers.js descarga el modelo en la primera visita (~80-300MB).
Usar IndexedDB para cachear.

Ollama se detecta con fetch a localhost:11434/api/tags con timeout de 1 segundo.