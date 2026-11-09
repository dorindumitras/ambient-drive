import json
import hashlib
import copy
from pathlib import Path
from xml.etree import ElementTree

root = Path(__file__).resolve().parents[1]
stage = root / 'dist/dorin_ambientdrive/source'
ui = json.loads((stage / 'rhmiData/uiDescriptions/ID7/uiDescription.json').read_text())
components = {v['name']: v for state in ui['containers'].values() for v in state.get('components', {}).values() if 'name' in v}
assert components['ENABLED']['type'] == 'checkBox'
assert 'MODE_ELECTRIC' not in components and 'MODE_BATTERY_CONTROL' not in components
assert 'MODE_ADAPTIVE' in components
assert 'MODE_SPORT_PLUS' not in components
for name in ['SPORT', 'COMFORT', 'ADAPTIVE', 'ECO_PRO', 'MANUAL']:
    comp = components['MODE_' + name]
    assert comp['type'] == 'button'
    assert comp['rows'][0]['TextNoColor'] == {'value': 'SID_AD_COLOR_NONE', 'type': 'StringId'}
    assert comp['rows'][0]['TextNoColorVisible'] == {'value': True, 'type': 'Bool'}
    assert comp['rows'][0]['FontSize'] == {'value': 13, 'type': 'Float'}
colors = ['none'] + ['bronze', 'bronze_white', 'orange', 'orange_white', 'white', 'blue', 'blue_white', 'green', 'green_white', 'lilac', 'lilac_white']
for color in colors:
    comp = components['COLOR_' + color.upper()]
    assert comp['type'] == 'radioButton'
    assert comp['rows'][0]['Text'] == {'value': 'SID_AD_COLOR_' + color.upper(), 'type': 'StringId'}

refs = set()


def visit(value):
    if isinstance(value, dict):
        if value.get('type') == 'StringId':
            refs.add(value['value'])
        for item in value.values():
            visit(item)
    elif isinstance(value, list):
        for item in value:
            visit(item)


visit(ui)
tables = {}
for file in (stage / 'rhmiData/variantGroups/Common/texts').glob('*.json'):
    table = json.loads(file.read_text())
    assert refs <= table.keys(), (file.name, refs - table.keys())
    assert {'SID_AD_COLOR_NONE', 'SID_AD_COLOR_ORANGE', 'SID_AD_COLOR_GREEN', 'SID_AD_COLOR_BLUE',
            'SID_AD_PHASE_SETUP', 'SID_AD_PHASE_WAITING', 'SID_AD_PHASE_ERROR', 'SID_AD_PHASE_UI_ERROR', 'SID_AD_EMPTY'} <= table.keys()
    tables[file.stem] = table
assert len(tables) == 33
assert all(table['SID_AD_COLOR_NONE'] == 'STANDARD' for table in tables.values())
assert all(table['SID_DORIN_AMBIENTDRIVE_ENABLED'] == 'Ambient Drive' for table in tables.values())
assert all(table['SID_DORIN_AMBIENTDRIVE_MODE_MANUAL'] == 'M/S' for table in tables.values())
assert all(table['SID_DORIN_AMBIENTDRIVE_MODE_COMFORT'] == 'Comfort' for table in tables.values())
assert all(table['SID_DORIN_AMBIENTDRIVE_MODE_ADAPTIVE'] == 'Adaptive' for table in tables.values())
assert all('Comfort / Adaptive' not in table.values() for table in tables.values())
assert tables['ro_RO']['SID_AD_COLOR_LILAC_WHITE'] == 'Lila-Alb'
assert tables['ro_RO']['SID_AD_COLOR_BRONZE_WHITE'] == 'Bronz-Alb'
assert not (stage / 'node_modules/oap-sdk').exists()
xml = (stage / 'rhmiData/uiDescriptions/ID7/application.xml').read_text()
tree = ElementTree.fromstring(xml)
state = next(c for c in ui['containers'].values() if c['type'] == 'state')
preview_id = state['properties']['Preview']['value']
assert state['components'][str(preview_id)]['name'] == 'INTERIOR_PREVIEW'
assert state['components'][str(preview_id)]['type'] == 'preview'
native_state = tree.find("container[@type='state']")
assert native_state.attrib['widget'] == 'LT_State_Regular_ContentHidden'
assert native_state.find("property[@id='4']").attrib['value'] == str(preview_id)
preview = native_state.find("layoutGroup[@name='ContentPreview']/component")
assert preview.attrib['id'] == str(preview_id) and preview.attrib['widget'] == 'LT_PreviewTable_1Graphic_1Text'
for name in ['ENABLED','MODE_SPORT','MODE_COMFORT','MODE_ADAPTIVE','MODE_ECO_PRO','MODE_MANUAL']:
    assert components[name]['properties']['Preview']['value'] == preview_id
for node in native_state.findall("layoutGroup[@name='List']/component[@type='button']"):
    assert node.attrib['widget'] == 'LT_Button_ColorPick'
color_state = next(c for c in ui['containers'].values() if c.get('name') == 'COLORS')
color_preview = color_state['properties']['Preview']['value']
assert color_state['components'][str(color_preview)]['name'] == 'COLOR_PREVIEW'
color_xml = next(c for c in tree.findall('container') if str(c.attrib['id']) in ui['containers'] and ui['containers'][c.attrib['id']].get('name') == 'COLORS')
radios = color_xml.findall("layoutGroup[@name='List']/component[@type='radioButton']")
assert len(radios) == 12
assert all(n.attrib['widget'] == 'LT_RadioButton_MyV_Settings_Light_1Row' for n in radios)
assert all(components['COLOR_' + c.upper()]['properties']['Preview']['value'] == color_preview for c in colors)
application = json.loads((stage / 'rhmiData/application.json').read_text())['application']
assert application['nativeGids'] == ['GID_MYV_LIGHT_INTERIORLIGHT_AMBIENTLIGHTCOLOR_ICON', 'GID_MYV_SETTINGS_INTERIORLIGHT_AMBIENTLIGHT_PREVIEW']
assert (stage / 'javascript/native-swatches.js').exists()
assert (stage / 'javascript/native-preview.js').exists()
for state_xml in tree.findall('container'):
    preview_group = state_xml.find("layoutGroup[@name='ContentPreview']")
    if preview_group is None:
        continue
    assert preview_group.find("property[@id='3']").attrib['value'] == '1'
    assert preview_group.find("component/property[@id='3']") is None
    assert state_xml.find("layoutGroup[@name='List']/property[@id='15']") is None
for container in ui['containers'].values():
    for comp in container['components'].values():
        if comp['type'] == 'preview':
            assert 'Focusable' not in comp.get('properties', {})
# The only structural change allowed against the accepted0.2.4 startup is the
# new Adaptive button. Sequential IDs shift; compare by stable component names.
baseline_xml = (root / 'tests/fixtures/startup-0.2.4.xml').read_text()
assert hashlib.sha256(baseline_xml.encode()).hexdigest() == '9e3d6d6895cb8fc0588aae3545e4e660525be9e7ebfd4d66e9a013449ab1b134'
baseline_ui = json.loads((root / 'tests/fixtures/ui-description-0.2.4.json').read_text())
baseline_tree = ElementTree.fromstring(baseline_xml)
baseline_states = {state['name']: (key, state) for key, state in baseline_ui['containers'].items()}
id_map = {}
for key, state in ui['containers'].items():
    old_key, old_state = baseline_states[state['name']]
    id_map[key] = old_key
    old_components = {comp['name']: cid for cid, comp in old_state['components'].items()}
    for cid, comp in state['components'].items():
        if comp['name'] != 'MODE_ADAPTIVE':
            id_map[cid] = old_components[comp['name']]
    old_groups = {g.attrib['name']: g.attrib['id'] for g in baseline_tree.find("container[@id='%s']" % old_key).findall('layoutGroup')}
    for group in tree.find("container[@id='%s']" % key).findall('layoutGroup'):
        id_map[group.attrib['id']] = old_groups[group.attrib['name']]
adaptive_id = next(cid for state in ui['containers'].values() for cid, comp in state['components'].items() if comp.get('name') == 'MODE_ADAPTIVE')
reduced = copy.deepcopy(tree)
removed = 0
for group in reduced.iter('layoutGroup'):
    for node in list(group):
        if node.tag == 'component' and node.attrib['id'] == adaptive_id:
            group.remove(node)
            removed += 1
assert removed == 1
for node in reduced.iter():
    if node.tag in {'container', 'layoutGroup', 'component'}:
        node.attrib['id'] = id_map[node.attrib['id']]
    elif node.tag == 'property' and node.attrib['id'] in {'4', '9'}:
        node.attrib['value'] = id_map[node.attrib['value']]
def structural(element):
    return element.tag, element.attrib, (element.text or '').strip(), [structural(child) for child in element]
assert structural(reduced) == structural(baseline_tree), 'Unexpected startup layout/property change beyond the Adaptive row'
all_ids = [node.attrib['id'] for node in tree.iter() if node.tag in {'container', 'layoutGroup', 'component'}]
assert len(all_ids) == len(set(all_ids))
runtime = json.loads((stage / 'javascript/kit/app-spec.json').read_text())
assert set(runtime['focusGroups']) == {'MAIN', 'COLORS'}
for state_xml in tree.findall('container'):
    name = ui['containers'][state_xml.attrib['id']]['name']
    groups = runtime['focusGroups'][name]
    assert groups['list'] == int(state_xml.find("layoutGroup[@name='List']").attrib['id'])
    assert groups['preview'] == int(state_xml.find("layoutGroup[@name='ContentPreview']").attrib['id'])
assert (stage / 'javascript/native-focus.js').exists()
assert (stage / 'rhmiData/variantGroups/Common/images/ambient_drive_standard.png').exists()
assert json.loads((stage / 'package.json').read_text())['author'] == 'Dorin Dumitras'
print('OK: accepted startup structure plus one Adaptive row; consistent IDs/focus groups; separate Comfort/Adaptive in33locales; OEM controls,11colors+STANDARD; no BMW SDK.')
