#!/usr/bin/env python3
"""Prepare complete USB/GitHub bundles for the existing Store source. No network/writes to GitHub."""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import zipfile
from source_files import source_files, source_zip, zip_bytes

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'publication'
USB = ROOT / 'validation/USB/mgu-repo/ambient-drive-test'
BASE = 'https://github.com/dorindumitras/ambient-drive/releases/download/catalog/'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def bundle(folder, destination):
    with zipfile.ZipFile(destination, 'w') as archive:
        for file in sorted(folder.rglob('*')):
            if file.is_file():
                zip_bytes(archive, file.relative_to(folder).as_posix(), file.read_bytes())


def main():
    frozen = json.loads((ROOT / 'RELEASE-ARTIFACTS.json').read_text())
    app, service = frozen['appVersion'], frozen['serviceVersion']
    catalog = json.loads((USB / 'catalog.json').read_text())
    assert catalog['schema'] == 2 and len(catalog['components']) == 2
    assert {c['id']: c['version'] for c in catalog['components']} == {'dorin_ambientdrive': app, 'dorin-ambient': service}
    expected = {c['id']: c['artifact'] for c in frozen['components']}
    for c in catalog['components']:
        a = c['artifact']; data = (USB / a['name']).read_bytes()
        assert len(data) == a['size'] == expected[c['id']]['size']
        assert sha(data) == a['sha256'] == expected[c['id']]['sha256']
        assert c['author'] == 'Dorin Dumitras' and c['mguHmi'] == ['ID7']
        assert sha((USB / 'ambient-drive.png').read_bytes()) == c['iconSha256'] == frozen['icon']['sha256']
    app_entry = next(c for c in catalog['components'] if c['kind'] == 'app')
    assert app_entry['requires']['dorin-ambient'] == service
    # Only this generated directory is replaced; all source and prior versions are retained.
    if OUT.exists():
        shutil.rmtree(OUT)
    github = OUT / 'github'; repo = github / 'repository'; assets = github / 'release-assets'
    assets.mkdir(parents=True)
    inventory = []
    for file in source_files(ROOT):
        relative = file.relative_to(ROOT); target = repo / relative
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(file, target)
        data = file.read_bytes()
        inventory.append({'path': relative.as_posix(), 'size': len(data), 'sha256': sha(data)})
    # A complete named source ZIP is attached alongside the install assets.
    source_zip(repo, assets / ('Ambient-Drive-' + app + '-source.zip'))
    public = copy.deepcopy(catalog)
    for c in public['components']:
        c['artifact']['url'] = BASE + c['artifact']['name']
    for c in catalog['components']:
        shutil.copyfile(USB / c['artifact']['name'], assets / c['artifact']['name'])
    shutil.copyfile(USB / 'ambient-drive.png', assets / 'ambient-drive.png')
    (assets / 'catalog.json').write_text(json.dumps(public, ensure_ascii=False, indent=2) + '\n')
    shutil.copyfile(ROOT / 'docs/PUBLISHING-RO.md', github / 'CUM-PUBLICI.md')
    (github / 'source-manifest.json').write_text(json.dumps(inventory, indent=2) + '\n')
    stick = OUT / 'stick'; stick.mkdir()
    shutil.copytree(ROOT / 'validation/USB/mgu-repo', stick / 'mgu-repo')
    for name in ['INSTALL.md', 'TEST-PE-MGU.md']:
        shutil.copyfile(ROOT / name, stick / name)
    shutil.copyfile(ROOT / 'docs/STICK-RO.md', stick / 'CITESTE-MA.md')
    (github / 'RELEASE-NOTES.md').write_text(
        '# Ambient Drive ' + app + '\n\nApp ' + app + ' / Service ' + service +
        '\n\nIndependent Sport, Sport Plus, Sport Individual, Comfort, Adaptive, Eco Pro, Eco Pro Individual and M/S colors, in that order.'
        ' Existing Sport color initializes Sport Plus once, including STANDARD. All other rules and the enable state are retained.'
        '\n\nTest candidate: local regressions and package checks are documented in docs/PUBLICATION-AUDIT.md.'
        ' Physical retest, additional driving modes and full vehicle sleep/wake remain pending. ID7 only.'
        ' Keep the existing catalog tag and Store source.\n')
    checksums = {}
    for file in sorted(assets.iterdir()):
        data = file.read_bytes(); checksums[file.name] = {'size': len(data), 'sha256': sha(data)}
    (github / 'CHECKSUMS.json').write_text(json.dumps(checksums, indent=2) + '\n')
    bundle(stick, OUT / ('Ambient-Drive-' + app + '-Stick.zip'))
    bundle(github, OUT / ('Ambient-Drive-' + app + '-GitHub-Complet.zip'))
    print(json.dumps({'appVersion': app, 'serviceVersion': service, 'sourceFiles': len(inventory),
        'stick': str(OUT / ('Ambient-Drive-' + app + '-Stick.zip')),
        'github': str(OUT / ('Ambient-Drive-' + app + '-GitHub-Complet.zip'))}, indent=2))


if __name__ == '__main__':
    main()
