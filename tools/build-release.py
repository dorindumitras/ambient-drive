#!/usr/bin/env python3
"""Build the SDK-free app, tool kit, offline Store catalog, and source archive."""
import copy
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import zipfile
from source_files import source_zip as write_source_zip

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release'
USB = OUT / 'USB' / 'mgu-repo' / 'ambient-drive'


def pack(destination, members):
    raw = io.BytesIO()
    with tarfile.open(fileobj=raw, mode='w', format=tarfile.PAX_FORMAT) as archive:
        for name, data, mode in sorted(members):
            entry = tarfile.TarInfo(name)
            entry.size, entry.mode, entry.mtime = len(data), mode, 0
            entry.uid = entry.gid = 0
            archive.addfile(entry, io.BytesIO(data))
    with destination.open('wb') as stream:
        with gzip.GzipFile(filename='', fileobj=stream, mode='wb', mtime=0) as compressed:
            compressed.write(raw.getvalue())


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--validation', action='store_true', help='Build a test candidate while on-car validation is pending')
    args = parser.parse_args()
    global OUT, USB
    if args.validation:
        OUT = ROOT / 'validation'
        USB = OUT / 'USB' / 'mgu-repo' / 'ambient-drive-test'
    profile = json.loads((ROOT / 'native/dorin-ambient/profile.json').read_text())
    if profile.get('pendingSignals'):
        raise SystemExit('Release blocked: required vehicle telemetry is not yet verified.')
    pending = set(profile.get('pendingWork', []))
    if pending and (not args.validation or pending - {'oemUIValidation'}):
        raise SystemExit('Release blocked: ' + ', '.join(sorted(pending)))
    USB.mkdir(parents=True, exist_ok=True)
    subprocess.run(['python3', 'tools/build-native.py', 'dorin_ambientdrive'], cwd=ROOT, check=True)
    stage = ROOT / 'dist/dorin_ambientdrive/source'
    package = json.loads((stage / 'package.json').read_text())
    app_version = package['version']
    package.update(license='MIT', mguHmi=['ID7'])
    (stage / 'package.json').write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n')
    if (stage / 'node_modules/oap-sdk').exists():
        raise RuntimeError('Release must not include BMW SDK')
    app_file = USB / ('dorin_ambientdrive@' + app_version + '.tgz')
    pack(app_file, [('package/' + str(p.relative_to(stage)), p.read_bytes(), 0o644)
                    for p in stage.rglob('*') if p.is_file()])
    tool = ROOT / 'native/dorin-ambient'
    source = json.loads((tool / 'component.json').read_text())
    tool_version = source['version']
    manifest = {key: copy.deepcopy(source[key]) for key in
                ['id', 'kind', 'version', 'title', 'description', 'mguHmi', 'enable', 'recmgr', 'restart', 'check', 'deactivate']}
    members = []
    manifest['files'] = []
    for item in source['files']:
        data = (tool / item.get('from', item['path'])).read_bytes()
        manifest['files'].append(dict(path=item['path'], mode=item['mode'], sha256=sha(data)))
        members.append(('files/' + item['path'], data, int(item['mode'], 8)))
    manifest['units'] = []
    for unit in source['units']:
        members.append(('units/' + unit['name'], (tool / unit.get('from', unit['name'])).read_bytes(), 0o644))
        manifest['units'].append(dict(name=unit['name']))
    members.append(('component.json', (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode(), 0o644))
    tool_file = USB / ('dorin-ambient@' + tool_version + '.tgz')
    pack(tool_file, members)
    icon = stage / 'rhmiData/variantGroups/Common/images/dorin_ambientdrive_icon.png'
    shutil.copyfile(icon, USB / 'ambient-drive.png')
    components = []
    for identifier, kind, title, artifact in [
            ('dorin-ambient', 'tool', 'Ambient Drive Service', tool_file),
            ('dorin_ambientdrive', 'app', 'Ambient Drive', app_file)]:
        data = artifact.read_bytes()
        requires = {'mgu-deploy': '0.7.11'}
        if kind == 'app':
            requires['dorin-ambient'] = tool_version
        components.append(dict(id=identifier, kind=kind, title=title, version=(app_version if kind == 'app' else tool_version),
            description=((json.loads((ROOT / 'apps/dorin_ambientdrive/app.json').read_text())['description'] if kind == 'app' else source['description']) + (' Versiune de test.' if args.validation else '')),
            author='Dorin Dumitras', mguHmi=['ID7'], uninstallable=True, requires=requires,
            icon='ambient-drive.png', iconSha256=sha(icon.read_bytes()),
            artifact=dict(name=artifact.name, url=artifact.name, size=len(data), sha256=sha(data))))
    (USB / 'catalog.json').write_text(json.dumps(dict(schema=2, components=components), ensure_ascii=False, indent=2) + '\n')
    shutil.copyfile(ROOT / 'README.md', OUT / 'CITESTE-MA.md')
    if args.validation:
        shutil.copyfile(ROOT / 'TEST-PE-MGU.md', OUT / 'TEST-PE-MGU.md')
    source_zip = OUT / ('Ambient-Drive-' + app_version + '-surse.zip')
    write_source_zip(ROOT, source_zip)
    result = OUT / ('Ambient-Drive-' + app_version + ('-Test-MGU.zip' if args.validation else '-MGU-Store.zip'))
    with zipfile.ZipFile(result, 'w', zipfile.ZIP_DEFLATED) as archive:
        for p in sorted((OUT / 'USB').rglob('*')):
            if p.is_file():
                archive.write(p, str(p.relative_to(OUT)))
        archive.write(OUT / 'CITESTE-MA.md', 'CITESTE-MA.md')
        if args.validation:
            archive.write(OUT / 'TEST-PE-MGU.md', 'TEST-PE-MGU.md')
            archive.writestr('VALIDARE-PE-MASINA.txt', 'Versiune de test. Verificarile locale nu inlocuiesc testul pe MGU si sleep/wake.\n')
        archive.write(source_zip, source_zip.name)
    print(result)


if __name__ == '__main__':
    main()
