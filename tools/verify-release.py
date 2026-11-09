#!/usr/bin/env python3
"""Check the exact offline artifacts, including tool hashes and ID7 UI resources."""
import hashlib
import argparse
import json
from pathlib import Path, PurePosixPath
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
USB = ROOT / 'release/USB/mgu-repo/ambient-drive'


def safe(name):
    p = PurePosixPath(name)
    assert not p.is_absolute() and '..' not in p.parts and '\\' not in name, name


def load_tar(file):
    result = {}
    with tarfile.open(file, 'r:gz') as archive:
        for member in archive.getmembers():
            safe(member.name)
            assert member.isfile() and member.name not in result, member.name
            result[member.name] = archive.extractfile(member).read()
    return result


def main():
    global USB
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--validation', action='store_true')
    args = parser.parse_args()
    if args.validation:
        USB = ROOT / 'validation/USB/mgu-repo/ambient-drive-test'
    catalog = json.loads((USB / 'catalog.json').read_text())
    assert catalog['schema'] == 2 and len(catalog['components']) == 2
    for component in catalog['components']:
        assert component['mguHmi'] == ['ID7']
        artifact = component['artifact']
        assert artifact['url'] == artifact['name']
        data = (USB / artifact['name']).read_bytes()
        assert len(data) == artifact['size']
        assert hashlib.sha256(data).hexdigest() == artifact['sha256']
        assert hashlib.sha256((USB / component['icon']).read_bytes()).hexdigest() == component['iconSha256']
        members = load_tar(USB / artifact['name'])
        if component['kind'] == 'tool':
            meta = json.loads(members['component.json'])
            assert meta['id'] == component['id'] and meta['version'] == component['version']
            for item in meta['files']:
                assert hashlib.sha256(members['files/' + item['path']]).hexdigest() == item['sha256']
            assert meta['recmgr'] == ['dorin-ambient']
            assert meta['restart'] == ['dorin-ambient.service']
            assert meta['deactivate'] == ['node', 'deactivate.js']
            assert meta['check'] == ['client.js', 'status']
            unit = members['units/dorin-ambient.service'].decode()
            for fragment in ['Group=root', 'LimitCORE=1',
                             'ExecStart=/usr/bin/node /var/opt/dorin-ambient/current/bootstrap.js']:
                assert fragment in unit
        else:
            package = json.loads(members['package/package.json'])
            assert package['name'] == component['id'] and package['version'] == component['version']
            assert package['mguHmi'] == ['ID7'] and package['license'] == 'MIT'
            assert 'package/' + package['main'] in members
            assert not any('node_modules/oap-sdk/' in name or name.endswith('.node') for name in members)
            config = json.loads(members['package/config/base.json'])
            assert config['rhmiLoadingEnabled'] and config['entryPointLoadingEnabled']
            description = json.loads(members['package/rhmiData/uiDescriptions/ID7/uiDescription.json'])
            names = {c.get('name') for state in description['containers'].values() for c in state.get('components', {}).values()}
            assert {'STATUS', 'ENABLED', 'MODE_SPORT', 'MODE_COMFORT', 'MODE_ADAPTIVE', 'MODE_ECO_PRO', 'MODE_MANUAL'} <= names
            assert 'MODE_ELECTRIC' not in names
            assert package['author'] == component['author'] == 'Dorin Dumitras'
            assert component['requires']['dorin-ambient'] == next(c['version'] for c in catalog['components'] if c['kind'] == 'tool')
            assert 'package/javascript/LICENSE' in members and 'package/javascript/NOTICE' in members
    app_version = next(c['version'] for c in catalog['components'] if c['kind'] == 'app')
    source = ROOT / ('validation' if args.validation else 'release') / ('Ambient-Drive-' + app_version + '-surse.zip')
    with zipfile.ZipFile(source) as archive:
        names = archive.namelist()
        for name in names:
            safe(name)
            assert not any(fragment in name for fragment in ['node_modules/', '/oap-sdk/', 'id_rsa', '.ppk', 'mgu putty', 'someip-interfaces.json', '/dist/', '/release/'])
        assert 'ambient-drive/mgu-repo.json' in names
        assert 'ambient-drive/kit/tools/build.py' in names
        assert 'ambient-drive/tools/verify-release.py' in names
        assert 'ambient-drive/tests/service.test.js' in names
    print('OK: exact catalog checksums; tool hashes/units; ID7 app resources; SDK-free packages and publishable source archive.')


if __name__ == '__main__':
    main()
