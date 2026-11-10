#!/usr/bin/env python3
"""Run the product regression suite after building with --validation."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
tests = [
    'rules', 'ui', 'adaptive-migration', 'sport-split', 'service', 'transport-startup',
    'native-swatches', 'native-focus', 'standard-graphic', 'artwork',
    'image-result', 'verified-bindings',
]
commands = [['node', 'tests/' + name + '.test.js'] for name in tests]
commands.extend([
    [sys.executable, 'tools/check-native.py'],
    [sys.executable, 'tools/verify-release.py', '--validation'],
    [sys.executable, 'tools/verify-published.py'],
])
for command in commands:
    print('RUN: ' + ' '.join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True, timeout=45)
print('PASS: ' + str(len(commands)) + ' regression/build checks')
