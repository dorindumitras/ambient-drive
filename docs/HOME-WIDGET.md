# Ambient Drive native Home widget

Candidate app0.2.7, based on0.2.6, with unchanged service0.2.5. Test release for USB and the existing GitHub Releases source; hardware validation remains unconfirmed.

The separate package/rhmiDataStartWidget manifest registers the native BMW Home entry. The existing app ID, main RHMI IDs, approved icon and saved service settings are retained. The widget UUID is stable between app versions and distinct from the main application UUID.

Native fields show the detected mode, the configured rule color and the service state. All StringIds are present in33widget locale tables; BMW selects them using the iDrive language. No new language getter or vehicle interface is used. The small layout uses native text; the large layout also receives an original768×512ambient-strip background with two-tone variants. The existing OEM interior preview in the main app is unchanged. Native layout geometry, wrapping and artwork placement require the G01 test.

Unchanged widget images are not rewritten each second: frames update on state/lifecycle changes, with a30second recovery refresh. Native text cells are refreshed occasionally.

The Home controller uses only status requests over the existing Unix socket, shared between visible placed widgets, with a2second timeout and at most one new sample a second. It never enables/disables automation or sets a rule. A removed or hidden widget stops initiating status reads; unsupported SDK widget support is optional and cannot block the existing app start. Tap uses the existing runtime mapEntryState/openEntryState wiring.

ON is shown only when the reported phase is active and its last confirmed color matches the selected rule. Unknown modes, old errors without a current resolved mode, offline service, disabled automation, STANDARD, applying, ambient off and unconfirmed states are represented without a fabricated live color. This display is not an independent physical-light sensor.

Changes to the kit runtime are confined to the Widget section, including cleanup when a widget is removed during image upload. Main startup XML/JSON, all non-widget runtime code and the complete service archive are compared against a frozen0.2.6 baseline. SDK/OEM binaries and artwork are not bundled.

Reference: cauliflowermossgrape/idrive7-apps commit422957a85461826c1e8654d37c8ec66a94849f9c, kit/tools/build.py build_start_widget, under the retained MIT license. Widget lifecycle conventions follow the kit already present in Ambient Drive; package-form registration is the scoped port.

G01 xDrive30i2026 M/S telemetry remains under separate diagnosis. This candidate does not change its input binding or claim a compatibility fix. See TEST-PE-MGU.md for hardware validation.
