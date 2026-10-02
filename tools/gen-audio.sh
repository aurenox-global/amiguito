#!/usr/bin/env bash
# Genera los audios de la VOZ PROPIA (Piper) con transformación "infantil"
# (sube tono + formantes con rubberband => timbre de niño/a, sin cambiar idioma).
#
# Uso:
#   bash tools/gen-audio.sh [PITCH] [TEMPO]
#   PITCH: factor de tono (1.22 = +22%)   TEMPO: velocidad (1.06 = 6% más rápido)
# Voces (por idioma):
#   es -> es_AR-daniela-high.onnx   en -> en_US-amy-medium.onnx
set -euo pipefail
cd "$(dirname "$0")/.."

PITCH="${1:-1.22}"
TEMPO="${2:-1.06}"
PIPER="${PIPER:-/home/zota/.local/bin/piper}"
VOICES="${VOICES:-/home/zota/llama-server/voices}"

node tools/gen-voice.mjs >/dev/null

while IFS=$'\t' read -r lang id text; do
  [ -z "${id:-}" ] && continue
  if [ "$lang" = "en" ]; then voice="$VOICES/en_US-amy-medium.onnx"; else voice="$VOICES/es_AR-daniela-high.onnx"; fi
  mkdir -p "assets/audio/$lang"
  printf '%s' "$text" | "$PIPER" -m "$voice" -f /tmp/_amg.wav 2>/dev/null
  ffmpeg -v error -y -i /tmp/_amg.wav \
    -filter:a "rubberband=pitch=${PITCH}:tempo=${TEMPO}" \
    -ar 22050 -ac 1 -c:a libmp3lame -b:a 96k "assets/audio/$lang/$id.mp3"
done < /tmp/phrases.tsv

rm -f /tmp/_amg.wav
echo "OK es=$(ls assets/audio/es/*.mp3 | wc -l) en=$(ls assets/audio/en/*.mp3 | wc -l) pitch=$PITCH tempo=$TEMPO"
