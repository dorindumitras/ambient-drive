#!/usr/bin/env python3
"""Check the exact StartWidget package, locales and unchanged main UI."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
STAGE = ROOT / 'dist/dorin_ambientdrive'
WIDGET = STAGE / 'source/rhmiDataStartWidget'


def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def main():
    baseline = json.loads((ROOT / 'tests/fixtures/widget-baseline-0.2.6.json').read_text())
    for name, expected in baseline['mainUi'].items():
        assert sha(STAGE / 'source/rhmiData/uiDescriptions/ID7' / name) == expected, name
    runtime = (ROOT / 'kit/runtime/mgu.js').read_text()
    begin = runtime.index('function patchStartWidgetEvents(app)')
    end = runtime.index('/* ---------------- generic settings screen', begin)
    assert hashlib.sha256(runtime[:begin].encode()).hexdigest() == baseline['runtimePrefix']
    assert hashlib.sha256(runtime[end:].encode()).hexdigest() == baseline['runtimeSuffix']
    app = json.loads((WIDGET / 'application.json').read_text())['application']
    primary = json.loads((STAGE / 'source/rhmiData/application.json').read_text())['application']
    assert app['type'] == 'StartWidget' and app['entryPoints'] == []
    assert app['uuid'] != primary['uuid'] and app['stringBundleUuid'] != primary['stringBundleUuid']
    assert app['uiDescriptions'][0]['hmi'] == ['ID7']
    ui = json.loads((WIDGET / 'uiDescriptions/ID7/uiDescription.json').read_text())
    comp = ui['containers']['500']['components']['501']
    assert comp['name'] == 'DORIN_AMBIENTDRIVE_WIDGET'
    assert comp['cells']['Widget']['value'] == 'LT_Table_OnlineApps_DriveRecorderWidget'
    assert ET.parse(WIDGET / 'uiDescriptions/ID7/application.xml').find('.//component').attrib['type'] == 'startWidget'
    schema_file = STAGE / 'source/javascript/ui-schema.js'
    schema = json.loads(schema_file.read_text().split('module.exports = ', 1)[1].rstrip(';\n'))
    required = {comp['cells']['SelectionName']['value'], 'SID_AD_WIDGET_NO_DATA'}
    required.update('SID_DORIN_AMBIENTDRIVE_MODE_' + m.upper() for m in schema['modes'])
    required.update('SID_AD_COLOR_' + (c.upper() if c else 'NONE') for c in schema['colors'])
    required.update('SID_AD_WIDGET_' + s for s in ['ON','OFF','WAITING','APPLYING','UNCONFIRMED','AMBIENT_OFF','STANDARD','COLOR_SET','UNAVAILABLE'])
    tables = list((WIDGET / 'variantGroups/Common/texts').glob('*.json'))
    assert len(tables) == 33
    for table in tables:
        values = json.loads(table.read_text()); assert required <= values.keys()
        assert values[comp['cells']['SelectionName']['value']] == 'Ambient Drive'
        assert (STAGE / 'rhmiDataStartWidget/strings' / table.name).read_bytes() == table.read_bytes()
    ro = json.loads((WIDGET / 'variantGroups/Common/texts/ro_RO.json').read_text())
    assert ro['SID_AD_COLOR_NONE'] == 'STANDARD' and ro['SID_AD_WIDGET_WAITING'] == 'Așteaptă date'
    icon = WIDGET / 'variantGroups/Common/images' / comp['cells']['SelectionIcon']['value']
    assert sha(icon) == baseline['iconSha256']
    # Rebuild only widget metadata at two versions: identity must survive updates.
    sys.path.insert(0, str(ROOT / 'kit/tools'))
    spec = importlib.util.spec_from_file_location('widget_builder', ROOT / 'kit/tools/build.py')
    builder = importlib.util.module_from_spec(spec); spec.loader.exec_module(builder)
    manifest = json.loads((ROOT / 'apps/dorin_ambientdrive/app.json').read_text())
    runtime_spec = json.loads((STAGE / 'source/javascript/kit/app-spec.json').read_text())
    assert runtime_spec['startWidget']['smallImage'] == manifest['startWidget']['smallImage'] == 'IconCam'
    with tempfile.TemporaryDirectory(prefix='ambient-widget-') as temp:
        temp = Path(temp)
        ids = []
        for version in ['0.2.7', '0.2.8']:
            manifest['version'] = version
            builder.build_start_widget(manifest, manifest['id'], str(icon), str(temp/version), str(temp/(version+'-pkg')))
            ids.append(json.loads((temp/(version+'-pkg')/'application.json').read_text())['application']['uuid'])
        assert ids == [app['uuid'], app['uuid']]
    print('OK: packaged native Home metadata, 33 locales, approved icon, stable widget identity and unchanged main UI.')


if __name__ == '__main__':
    main()
