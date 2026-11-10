# Ambient Drive0.2.6 verification

App **0.2.6**, service **0.2.5**. Prepared for the existing `dorindumitras/ambient-drive` Store source and `catalog` release. Status: locally verified test candidate. Public release checks are recorded separately after deployment.

## Product regression

All **15** regression/build checks passed: rules, UI, Adaptive migration, Sport split migration, service, transport startup, native swatches, native focus, STANDARD graphic, artwork, image result, recorded bindings, native layout, complete release and frozen artifact hashes. All eight primary modes were exercised with all11calibrated colors plus STANDARD. Migration checks include enabled and disabled states, a missing Sport Plus key, explicit STANDARD, independent choices and temporary Unix-socket/disk service restart. The accepted startup widgets/properties were compared to0.2.4, allowing only the new rows and required row ordering. Labels/references cover33HMI locales.

Twelve critical files remain byte-identical to0.2.5: UI main, artwork, native focus/preview/swatches, UI client, controller, vehicle driver, settings store, socket group, bootstrap and service unit.

## Store integration

The official MGU Store reader at commit **5bf4aa6da0d2af82b59385ba97b9a8091f0a3d9d** accepted all three prepared layouts: anonymous GitHub Releases, direct HTTPS catalog and USB folder. Both components list as `available` for a new installation and `update` over app0.2.5/service0.2.4. Package identity/version, full author, ID7 compatibility, dependency on service0.2.5, archive parsing, component file hashes, sizes, approved icon and absence of the BMW SDK passed. USB made no network requests.

The network adapter served the candidate files locally at their intended public URLs. This establishes reader compatibility; it does not claim a live download of unpublished0.2.6 assets or execute a vehicle install. Reader modules/provenance and machine-readable results were retained with the local delivery audit.

## Complete source and publication

The full source tree contains **113** files, including application, service, kit, font licenses, build scripts, tests, docs, metadata and hidden .gitignore. The named source ZIP and repository directory contain the same files. Both install artifacts and the icon have frozen checksums in RELEASE-ARTIFACTS.json. The GitHub bundle includes those artifacts, the absolute-URL catalog, the complete named source ZIP, checksums and publication instructions. The USB catalog resolves relative paths to the same archive bytes.

The existing public main tree was read at commit **f800ffcb4fd797d6fb53647588a457bbaa35dd57** before this update and matched all106previous source files; all README screenshot URLs were retained. Online installation uses the complete source tree plus the two prepared install assets, icon and absolute-URL catalog attached to the existing catalog release.

## Remaining physical validation

The G01 previously confirmed0.2.4 automatic colors and native previews. Physical0.2.6 retest, Sport Plus/Individual/Adaptive on equipped vehicles, full vehicle sleep/wake and first installation on other firmware remain unconfirmed. The existing head unit must supply its native SOME/IP module, generated service configurations, donor SDK and matching artwork. No new G01 reads are needed for the implemented menu/rule split; readings are needed if a newly tested vehicle does not report a mode distinctly.
