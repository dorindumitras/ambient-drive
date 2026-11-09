# Compatibility and test status

The catalog targets **ID7 only**. Published app: **0.2.5**. Required service: **0.2.4**.

The user reported app 0.2.4 functional on a BMW G01 plug-in 2020, including driving-mode/M-S color changes and original color previews. App 0.2.5 adds independent Comfort and Adaptive rules. It passed desktop migration, regression, IPC, restart, layout and artifact checks; a physical 0.2.5 retest and complete vehicle sleep/wake retention remain unconfirmed. The user's G01 has no Adaptive mode, so physical Adaptive operation needs an equipped vehicle. Other models and firmware have not been physically validated.

The service uses the head unit's native SOME/IP module and searches existing generated configurations for ComfortFunctionIuK, FES and Powertrain. These firmware-derived files are not distributed with the app. Their availability and the actual signals must be checked when validating a previously untested unit. Archive integrity and a successful source build do not establish that vehicle compatibility.

Previews are decoded from an existing model-specific ambient-light pack on the head unit when it can be identified unambiguously; a native GID path is available as fallback. No extracted BMW artwork is shipped. The eleven palette entries and M/S binding were calibrated from the G01 readings; behavior on other units is part of vehicle validation.

Electric/Hybrid overrides are intentionally excluded. The app changes ambient lighting only; it does not enable Adaptive, Sport PLUS or other vehicle functions.
