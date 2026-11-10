# Compatibility and test status

Candidate app **0.2.6**, service **0.2.5**, **ID7 only**.

The user reported app0.2.4 functional on a BMW G01 plug-in2020, including driving-mode/M/S color changes and original color previews. The new version separates Sport Plus and exposes eight independent, ordered selectors. Desktop rule, UI, migration, IPC, restart, native-layout and artifact checks passed. A physical0.2.6 retest and complete vehicle sleep/wake retention remain unconfirmed. Additional modes need an equipped vehicle; a visible selector does not establish that the vehicle supports that mode.

## Signal mapping

| Selector | FES value (or gear trigger) |
|---|---|
| Sport | SPORT_DYNAMIC / PHEV_SPORT_STANDARD |
| Sport Plus | SPORT_EXPERT / PHEV_SPORT_PLUS |
| Sport Individual | SPORT_INDIVIDUAL / PHEV_SPORT_INDIVIDUAL |
| Comfort | COMFORT / PHEV_HYBRID_COMFORT |
| Adaptive | ADAPTIVE |
| Eco Pro | ECO_PRO_EFFICIENT / PHEV_HYBRID_ECO |
| Eco Pro Individual | ECO_PRO_INDIVIDUAL |
| M/S | Physical lever in S_MINUS_PROGRAMM or M_MINUS_PROGRAMM, guarded by valid gear data |

The FES enumeration was present in the supplied G01 interface definition. Sport Plus and Individual mappings are regression-tested against simulated signals, not claimed as live captures of those modes on this car. Comfort Plus, Comfort Individual, Eco Pro Plus, four off-road modes, Ease, Traction Assist and Boost retain independent STANDARD-default rules and appear after the eight primary selectors when reported. Unknown/reserved values send no command. Electric/Hybrid-specific overrides remain excluded.

The service searches existing generated ComfortFunctionIuK, FES and Powertrain configurations and loads the head unit's native SOME/IP module. These firmware-derived files are not distributed. Their availability, palette and actual signals need validation on a previously untested unit.

The eleven palette entries and M/S binding were calibrated from the G01 readings. Previews are decoded from the installed model-specific ambient-light pack when identifiable, with native GID fallback. No BMW executable, SDK, extracted artwork or private key is included. The driver, control/write/readback behavior, root/socket launch context and atomic settings persistence are unchanged from the prior version.
