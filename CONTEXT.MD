# CONTEXT DEL PROYECTO

Instrucción para la IA: Lee este archivo completo antes de responder cualquier cosa. Este documento es la fuente de verdad del proyecto. Continúa desde el estado descrito aquí.

## Resumen del Proyecto
- Nombre: WritePro
- Qué hace: Corrector de escritura web (similar a Grammarly) que detecta errores de ortografía, gramática, puntuación y estilo en español e inglés, con indicador de tono y reescritura de frases. 100% open source, sin APIs de pago ni modelos propietarios.
- Estado actual: Proyecto nuevo — configuración inicial pendiente
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
    │   └── langdetect.js
    ├── ui/
    │   ├── tooltip.js
    │   ├── sidepanel.js
    │   └── statusbar.js
    ├── core/
    │   ├── orchestrator.js
    │   └── diff.js
    └── styles/
        ├── main.css
        ├── editor.css
        ├── tooltip.css
        ├── sidepanel.css
        └── statusbar.css

## Lo que ya está hecho
Nada aún — proyecto en configuración inicial

## Trabajo de la Última Sesión
Proyecto creado. Aún no se ha escrito código.

## Próximos Pasos

1. [ALTA] Setup inicial del proyecto
- npm create vite@latest writeproo -- --template vanilla
- Instalar dependencias base: codemirror, diff-match-patch, franc-min, wink-sentiment
- Configurar .env y .gitignore

2. [ALTA] Editor base con CodeMirror 6
- src/editor/index.js: instanciar CM6 en el div #editor
- Configurar idioma básico (texto plano por ahora)
- Responsive: ocupa el 60% izquierdo del layout
3. [ALTA] Servicio LanguageTool + subrayados inline
- src/services/languagetool.js: POST con debounce 800ms
- src/editor/markers.js: extensión CM6 que pinta errores
- Colores: rojo=spelling, amarillo=grammar, azul=style

4. [ALTA] Tooltip con sugerencias + aplicar cambio
- src/ui/tooltip.js: aparece al hacer clic en error subrayado
- src/core/diff.js: aplica sugerencia con diff-match-patch
- Botones: Aceptar / Ignorar / Ignorar siempre

5. [MEDIA] Detección automática de idioma
- src/services/langdetect.js: franc-min sobre el texto actual
- Se pasa como parámetro language a LanguageTool

6. [MEDIA] Indicador de tono básico
- src/services/sentiment.js: wink-sentiment en tiempo real
- src/ui/sidepanel.js: muestra tono + score en panel lateral

7. [MEDIA] Transformers.js (tono avanzado + reescritura básica)
- Carga lazy al primer uso (no bloquea arranque)
- Cachear modelo en IndexedDB para no re-descargar

8. [BAJA] Soporte Ollama (reescritura avanzada)
- src/services/capabilities.js: detecta http://54.146.142.76:11434 con fetch + timeout 1s
- Si disponible, habilitar botón "Reescribir con Ollama"

9. [BAJA] Status bar de motores
- src/ui/statusbar.js: indicadores por cada motor
- Se actualiza al resultado de detectCapabilities()

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