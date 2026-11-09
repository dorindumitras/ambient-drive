# Install Ambient Drive

Use MGU iDrive 7 with ambient lighting and MGU Store already configured. The catalog requires mgu-deploy 0.7.11 or newer. App 0.2.5 requires Ambient Drive Service 0.2.4; the Store installs a missing dependency first.

1. Connect MGU Store to the internet.
2. Open Settings → Add source and enter `dorindumitras/ambient-drive`.
3. Choose **Releases**, then **Check now**.
4. Open **Ambient Drive → Install**. Follow any restart requested by Store.
5. Open the app, choose the per-mode colors and enable Ambient Drive. A first installation starts disabled.

For an existing installation, update the service and app without clearing settings. The previous shared Comfort / Adaptive color initializes both independent rules once. Other colors and the enable state are retained.

M/S takes priority over the base driving mode. STANDARD sends no color command and does not fall back to another rule. Color choices save immediately; Back returns from the picker. The app does not add driving modes that the car does not have.

For offline testing, a source build produces the `validation/USB/mgu-repo/ambient-drive-test` catalog. Copy `mgu-repo` from inside `USB` to the stick root and use the Store's USB page. See [TEST-PE-MGU.md](TEST-PE-MGU.md).

The release contains the two packages needed for the catalog layout. A user does not need to compile the public source for that installation path. The vehicle's BMW SDK/native resources are supplied by the existing head unit, not this repository.

See [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) for the tests that are still pending.
