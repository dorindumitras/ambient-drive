#!/usr/bin/env python3
"""Build native ID7 controls with per-HMI-language StringId resources."""
import json
from pathlib import Path
import subprocess
import sys
import native_locales
from xml.etree import ElementTree
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parents[1]


def main():
    app_id = sys.argv[1] if len(sys.argv) > 1 else 'dorin_ambientdrive'
    subprocess.run(['node', 'tools/gen-schema.js', app_id], cwd=ROOT, check=True)
    spec = json.loads((ROOT / 'apps' / app_id / 'app.json').read_text())
    subprocess.run([sys.executable, 'kit/tools/build.py', app_id], cwd=ROOT, check=True)
    stage = ROOT / 'dist' / app_id
    standard = stage / 'source/rhmiData/variantGroups/Common/images/ambient_drive_standard.png'
    subprocess.run(['node', 'tools/make-standard.js', str(standard)], cwd=ROOT, check=True)
    (stage / 'rhmiData/resources/ambient_drive_standard.png').write_bytes(standard.read_bytes())
    xml = ElementTree.fromstring((stage / 'source/rhmiData/uiDescriptions/ID7/application.xml').read_text())
    description = json.loads((stage / 'source/rhmiData/uiDescriptions/ID7/uiDescription.json').read_text())
    runtime_file = stage / 'source/javascript/kit/app-spec.json'
    runtime = json.loads(runtime_file.read_text())
    runtime['focusGroups'] = {}
    for state in xml.findall('container'):
        groups = {group.attrib.get('name'): int(group.attrib['id']) for group in state.findall('layoutGroup')}
        if 'List' in groups and 'ContentPreview' in groups:
            name = description['containers'][state.attrib['id']]['name']
            runtime['focusGroups'][name] = {'list': groups['List'], 'preview': groups['ContentPreview']}
    runtime_file.write_text(json.dumps(runtime, ensure_ascii=False, indent=1) + '\n')
    modes = [i[1][5:].lower() for i in spec['screens'][0]['items'] if i[0] == 'colorpick']
    for directory in [stage / 'source/rhmiData/variantGroups/Common/texts', stage / 'rhmiData/strings']:
        for file in directory.glob('*.json'):
            values = json.loads(file.read_text())
            values.update(native_locales.resources(app_id, modes, file.stem))
            assert len(values) <= 1024
            file.write_text(json.dumps(values, ensure_ascii=False, indent=1) + '\n')
    entry = ROOT / 'tools/build-release.py'
    loader = spec_from_file_location('release_pack', entry)
    packer = module_from_spec(loader); loader.loader.exec_module(packer)
    source = stage / 'source'
    packer.pack(ROOT / 'dist' / (app_id + '@' + spec['version'] + '.tgz'),
                [('package/' + str(p.relative_to(source)), p.read_bytes(), 0o644) for p in source.rglob('*') if p.is_file()])
    packer.pack(ROOT / 'dist' / (app_id + '@' + spec['version'] + '.mgu'),
                [(str(p.relative_to(stage)), p.read_bytes(), 0o644) for p in stage.rglob('*') if p.is_file()])
    print('Native controls and 33 HMI locale tables updated.')


if __name__ == '__main__':
    main()
