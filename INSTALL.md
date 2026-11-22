# Ambient Drive 0.2.8 — iDrive 7 test release

The GitHub Releases source and USB kit offer app 0.2.8 and service 0.2.6 for iDrive 7. Requires an existing configured MGU Store and mgu-deploy≥0.7.11.

## GitHub / Store

Settings → Add source → `dorindumitras/ambient-drive` → **Releases** → **Check now** → Ambient Drive → Install/Update. If the source is already present, use Check now and update the app. The catalog lists service 0.2.6 as a dependency. Preserve settings. After installation, open the app once and add Ambient Drive in the native Home Add widget list.

## USB

1. Extract Ambient-Drive-0.2.8-Test-MGU.zip.
2. Copy its mgu-repo folder to the USB root, replacing only the old ambient-drive-test folder.
3. MGU Store → USB → Ambient Drive → Update/Install. Update the included service to 0.2.6 before testing app 0.2.8. Preserve the existing installation/settings; follow any restart requested by Store.
4. Open the app once and verify the existing checkbox/colors.
5. In Home customization, open Add widget and select Ambient Drive. Try the small and large sizes. Tap the widget to open the app.

The included mgu-copy.json identifies the USB folder as a copy of github:dorindumitras/ambient-drive, allowing updates under the existing source when it is configured. A warning that the app belongs to another source should be reported; do not uninstall or clear settings as a workaround.

The widget reads status only. It displays only the mode, configured colour and automation state. Test Home behavior using TEST-PE-MGU.md.
