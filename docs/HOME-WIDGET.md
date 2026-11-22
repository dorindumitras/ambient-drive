# Ambient Drive Home widget

The native BMW widget reports the detected driving mode and the state of automation. A square shows the chosen rule colour. Two-tone rules show the hue and white in one square. STANDARD, disabled automation and unavailable data clear the previous square.

The large layout draws the square into `BackgroundImage1`. The compact layout sends it as an asset to `IconCam`. The compact asset path is covered by local tests and needs visual confirmation on iDrive. Both placements use native StringIds for the mode and status.

The separate `rhmiDataStartWidget` manifest preserves the existing widget identity. The widget reads service status once per second at most, uses one sample for all visible placements and updates changed cells and image content, with periodic refreshes for recovery. It never changes the automation setting or rules.
