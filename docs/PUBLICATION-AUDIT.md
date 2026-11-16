# Ambient Drive0.2.7 — Home-widget release verification

Based on the complete0.2.6 source, with unchanged service0.2.5. Publication was requested by the user after preparing the tested USB candidate. Hardware validation has not been reported and is not inferred from that request. Public download checks are recorded separately after deployment.

## Local checks

The19regression/build checks cover all existing rule, migration, IPC/persistence, root transport, native menu/preview/swatch/focus and artifact checks, plus Home presentation, widget lifecycle/resources, bounded status client and packaged Home resources. Test fixtures use mock RHMI and temporary Unix sockets; no BMW SDK/native binary is run on the audit host.

The native main startup XML and JSON, all non-widget runtime code and the complete service archive are compared against the frozen0.2.6 baseline. The service SHA256 remains9309c3a657494888df6d0269758076b2a4b7885aeb89529de13bd1c2f9f7e162. Home status rendering covers all modes/colors, disabled/unknown/offline states, false-confirmation avoidance, small/large behavior, read-only visible polling and recovery. Lifecycle tests include actual tap-to-main wiring and removal during a pending image upload.

The widget is registered in package/rhmiDataStartWidget, with33native locale tables, the approved icon and a stable UUID. All widget StringIds used at runtime exist in every widget language table. The small native fields and large ambient-strip background require visual validation on the car; local mocks cannot prove HMI layout placement or text wrapping.

Home shares at most one status request per second between placed visible widgets, closes a stalled socket after2seconds, and avoids repeatedly rewriting identical PNGs. Frames update on state/lifecycle changes with a30second recovery refresh. Existing main-app requests retain their12second default timeout.

## Test delivery

The USB candidate contains app0.2.7 and service0.2.5, local catalog checksums and the approved icon. mgu-copy.json identifies it as an offline copy of github:dorindumitras/ambient-drive so a configured GitHub source retains the app origin during update. The complete source archive is included. Package integrity, source completeness, a clean-source rebuild and Store-reader results are retained with the final local delivery report.

## Hardware status

No Home widget has been installed or observed on the G01 by this audit. Required checks: Add widget list, small/large text and image placement, tap, live updates with the app screen closed, language changes, hide/remove/re-add, restart and vehicle sleep/wake.

The separate G01 xDrive30i2026 M/S input problem remains under diagnosis. The Home candidate keeps the service binding unchanged and will show waiting when no current mode can be resolved. This is not a vehicle compatibility fix.
