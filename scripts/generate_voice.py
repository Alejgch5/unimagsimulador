#!/usr/bin/env python3
"""Regenerate local Spanish synthetic fallback clips; never used by the running app.
Downloads espeakng-loader 0.2.4 from PyPI and verifies its published SHA-256.
Requires Linux x86_64, Python 3 and ffmpeg. Native Spanish browser voices are preferred.
"""
import ctypes
import hashlib
import io
import json
import pathlib
import re
import subprocess
import tempfile
import urllib.request
import wave
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / 'assets' / 'voice'
VERSION = '0.2.4'

def phrases():
    source = (ROOT / 'engine.js').read_text()
    quoted = re.compile(r"'((?:\\.|[^'\\])*)'")
    blocks = re.findall(r"firstLine:\s*('(?:\\.|[^'\\])*')", source)
    blocks += re.findall(r'this\._say\((.*?)\);', source, re.S)
    for call in re.findall(r'this\._injure\((.*?)\);', source, re.S):
        values = quoted.findall(call)
        if values: blocks.append("'" + values[-1] + "'")
    blocks += re.findall(r'const responses = \{(.*?)\n\s*\};', source, re.S)
    result = set()
    for block in blocks:
        for text in quoted.findall(block):
            if len(text) > 15 and ' ' in text:
                result.add(text.replace("\\'", "'").replace('\\n', '\n'))
    return sorted(result)

def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='vesica-voice-') as directory:
        directory = pathlib.Path(directory)
        with urllib.request.urlopen(f'https://pypi.org/pypi/espeakng-loader/{VERSION}/json', timeout=30) as response:
            info = json.load(response)
        artifact = next(u for u in info['urls'] if 'manylinux_2_17_x86_64' in u['filename'])
        with urllib.request.urlopen(artifact['url'], timeout=60) as response: content = response.read()
        if hashlib.sha256(content).hexdigest() != artifact['digests']['sha256']:
            raise RuntimeError('PyPI artifact checksum mismatch; refusing to synthesize')
        with zipfile.ZipFile(io.BytesIO(content)) as archive: archive.extractall(directory)
        libroot = directory / 'espeakng_loader'
        lib = ctypes.CDLL(str(libroot / 'libespeak-ng.so'))
        lib.espeak_Initialize.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_char_p, ctypes.c_int]
        lib.espeak_Initialize.restype = ctypes.c_int
        sample_rate = lib.espeak_Initialize(2, 0, str(libroot / 'espeak-ng-data').encode(), 0)
        if sample_rate <= 0: raise RuntimeError('Could not initialize eSpeak NG')
        lib.espeak_SetVoiceByName.argtypes = [ctypes.c_char_p]
        if lib.espeak_SetVoiceByName(b'es') != 0: raise RuntimeError('Spanish eSpeak voice unavailable')
        lib.espeak_SetParameter(1, 158, 0)  # words per minute
        lib.espeak_SetParameter(3, 43, 0)  # pitch
        chunks = []
        callback_type = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
        @callback_type
        def callback(samples, count, events):
            if samples and count: chunks.append(ctypes.string_at(samples, count * 2))
            return 0
        lib.espeak_SetSynthCallback(callback)
        lib.espeak_Synth.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_uint, ctypes.c_int, ctypes.c_uint, ctypes.c_uint, ctypes.c_void_p, ctypes.c_void_p]
        manifest = {}
        for text in phrases():
            identifier = hashlib.sha256(text.encode()).hexdigest()[:16]
            wav_path = directory / f'{identifier}.wav'
            chunks.clear()
            encoded = ctypes.create_string_buffer(text.encode('utf-8'))
            if lib.espeak_Synth(encoded, len(encoded), 0, 1, 0, 1, None, None) != 0:
                raise RuntimeError('Speech synthesis failed')
            pcm = b''.join(chunks)
            if not pcm or not any(pcm): raise RuntimeError('Empty generated speech')
            with wave.open(str(wav_path), 'wb') as output:
                output.setnchannels(1); output.setsampwidth(2); output.setframerate(sample_rate); output.writeframes(pcm)
            destination = TARGET / f'{identifier}.mp3'
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav_path),'-codec:a','libmp3lame','-b:a','48k',str(destination)],check=True)
            manifest[text] = f'assets/voice/{destination.name}'
        lib.espeak_Terminate()
        (TARGET / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        print(f'{len(manifest)} Spanish local voice clips generated; SHA-256 package integrity verified.')
if __name__ == '__main__': main()
