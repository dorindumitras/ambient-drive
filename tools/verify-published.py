#!/usr/bin/env python3
"""Compare a local clean build with the audited public 0.2.5/0.2.4 packages."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
expected = json.loads((ROOT / 'RELEASE-ARTIFACTS.json').read_text())
folder = ROOT / 'validation/USB/mgu-repo/ambient-drive-test'
for component in expected['components']:
    artifact = component['artifact']
    file = folder / artifact['name']
    data = file.read_bytes()
    assert len(data) == artifact['size'], file.name + ': size differs'
    assert hashlib.sha256(data).hexdigest() == artifact['sha256'], file.name + ': hash differs'
    print('MATCH: ' + file.name)
icon = (folder / expected['icon']['name']).read_bytes()
assert hashlib.sha256(icon).hexdigest() == expected['icon']['sha256']
print('MATCH: approved icon')
