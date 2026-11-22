# Muñeca Brava — Aprende español | Capítulos 18, 19 y 20

Aplicación web educativa interactiva para aprender español argentino (rioplatense) con traducciones al armenio oriental a través de los capítulos 18, 19 y 20 de la telenovela *Muñeca Brava*.

## Características principales

- **3 capítulos independientes** (Capítulos 18, 19 y 20), cada uno con su propio reproductor de YouTube (IFrame Player API), controles de velocidad (`0.5x` a `1.5x`), salto ±5 s, repetición de frase y subtítulos sincronizados clicables.
- **Traducción español → armenio oriental** al hacer clic en cualquier frase, palabra, ejemplo o pregunta sin ocultar el español original.
- **Transcripción completa integrada (1.824 réplicas originales)**: los tres episodios incluyen de serie todas sus réplicas originales con marcas de tiempo exactas y traducción completa al armenio oriental — Capítulo 18 (586 líneas), Capítulo 19 (518 líneas) y Capítulo 20 (720 líneas) — sin descargas, subidas manuales ni llamadas a APIs externas.
- **150 palabras y expresiones esenciales** (50 por capítulo), marcación de argentinismos, avisos de registro coloquial, pronunciación en audio y seguimiento *Ya lo sé*.
- **Sección «Español argentino»** con tabla comparativa (*Argentina · España · Հայերեն*), guía de voseo y pronunciación porteña, y 20 ejercicios interactivos de transformación `tú ↔ vos`.
- **Gramática en contexto** con explicaciones detalladas en armenio oriental y práctica interactiva en cada capítulo.
- **18 juegos interactivos por capítulo** (54 experiencias en total) con orden y respuestas aleatorizadas, incluyendo *Memory*, *Pasapalabra*, *Dictado*, *Responde rápido*, *Habla español*, *Continúa la historia* y *El gran concurso* (30 preguntas con comodines).
- **Favoritos y progreso local** guardados automáticamente en `localStorage` sin necesidad de servidor, registro ni claves API.

## Instalación y ejecución local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

## Compilación para producción

```bash
npm run build
```

Los archivos estáticos optimizados se generan en la carpeta `dist/`.

## Despliegue en hosting estático

### GitHub Pages
1. Ejecuta `npm run build`.
2. Publica el contenido de la carpeta `dist/` en la rama `gh-pages` (o usa GitHub Actions con `actions/deploy-pages`).

### Vercel
1. Importa el repositorio en Vercel.
2. Framework Preset: **Vite** · Build Command: `npm run build` · Output Directory: `dist`.

### Netlify
1. Conecta el repositorio en Netlify o arrastra la carpeta `dist/` a Netlify Drop.
2. Build Command: `npm run build` · Publish Directory: `dist`.
