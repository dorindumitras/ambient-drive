# Install Ambient Drive 0.2.6

Use MGU iDrive 7 with ambient lighting and MGU Store already configured. Requires mgu-deploy 0.7.11 or newer. App **0.2.6** requires Ambient Drive Service **0.2.5**; Store installs missing dependencies first. This is a test candidate pending vehicle retesting.

1. Connect MGU Store to the internet.
2. Settings → Add source → `dorindumitras/ambient-drive`.
3. Choose **Releases**, then **Check now**.
4. Open **Ambient Drive → Install / Update**. Follow any restart requested by Store.
5. Choose the per-mode colors and enable Ambient Drive. A first installation starts disabled.

These online steps install0.2.6 only after its prepared assets and catalog have been uploaded to the existing public catalog release. Until then the source still offers its previous version. No new source/link is needed.

For an existing installation, update both packages without uninstalling or clearing settings. The previous shared Sport color initializes Sport Plus once, including STANDARD. All existing rules and enabled/disabled state are retained. Comfort and Adaptive remain independent.

M/S takes priority over the base driving mode. STANDARD sends no color command and does not fall back to another rule. Choices save immediately; only native Back returns from the picker. The app does not enable driving modes absent from the car.

## USB

Extract `Ambient-Drive-0.2.6-Stick.zip` and copy its **mgu-repo** directory to the stick root. Use MGU Store → USB and install/update service0.2.5 then app0.2.6. Retain other unrelated sources on the stick; replace the old `ambient-drive-test` folder so only one candidate catalog is present. No compile or PuTTY command is needed for this update. See [TEST-PE-MGU.md](TEST-PE-MGU.md) and [docs/STICK-RO.md](docs/STICK-RO.md).

The public catalog uses prebuilt archives. The vehicle supplies its native SOME/IP module and firmware-generated configurations; Store supplies the BMW donor SDK. They are not redistributed. See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).
