# Voz sintética local

Respuestas españolas generadas para los casos ficticios de VÉSICA. No son grabaciones humanas ni datos de pacientes. Se reproducen después del gesto de inicio cuando el navegador no dispone de una voz española o falla la síntesis nativa.

Generación: `python3 scripts/generate_voice.py` (eSpeak NG mediante espeakng-loader 0.2.4; FFmpeg/libmp3lame; 48 kbit/s mono). El paquete de generación se descarga desde PyPI y se verifica contra su SHA-256 publicado. Ni el generador binario ni un servicio remoto son necesarios para ejecutar el sitio.

`manifest.json` relaciona el texto exacto con cada clip. Después de cambiar los diálogos de `engine.js`, regenerar los clips y comprobar reproducción, interrupción por síntomas urgentes, pausa y volumen. La voz sintética puede sonar mecánica; no se presenta como voz humana realista.
