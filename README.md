# Ambient Drive

A native iDrive7 app that changes ambient lighting according to the driving mode and the M/S gear selector position.

![Ambient Drive](ambient-drive.png)

Choose independent colors in this order: **Sport**, **Sport Plus**, **Sport Individual**, **Comfort**, **Adaptive**, **Eco Pro**, **Eco Pro Individual**, **M/S**. Select **STANDARD** to send no color command for that rule. M/S takes priority while the lever is in M/S, including S and manual M gears. Electric/Hybrid switching is not included.

These eight selectors are always visible. Additional supported signals such as Comfort Plus, Comfort Individual, Eco Pro Plus and off-road modes appear after them only when reported by the car. Configuring a row never enables a driving mode in the vehicle. Screenshots below are from an earlier UI version.

The native interface follows the iDrive language and uses the car's installed preview resources. Selections save immediately and the picker remains open until Back.

<img width="4032" height="2268" alt="Screen Display 1" src="https://github.com/user-attachments/assets/0c0f6855-62cd-4048-a3e8-61a513342ee4" />

## Install

In MGU Store use **Settings → Add source**, enter **dorindumitras/ambient-drive**, choose **Releases**, then **Check now**. Open Ambient Drive. Its service dependency is installed first when needed.

Current packages: app **0.2.6**, service **0.2.5**. Requires iDrive7, MGU Store and mgu-deploy0.7.11 or newer.

<img width="4032" height="2268" alt="Ambient-Drive" src="https://github.com/user-attachments/assets/c1a8ae94-bfff-4ddb-949e-c837f072d902" />

## Upgrade

Update both packages without uninstalling or clearing settings. The previous shared Sport / Sport PLUS color initializes Sport Plus once, including STANDARD. Sport and Sport Plus then save independent choices. Existing Individual, Comfort, Adaptive, Eco Pro and M/S choices and the enable state are preserved. Upgrading from older shared Comfort / Adaptive versions also retains their one-time migration.

The Adaptive row is configurable before that driving mode is observed. Its lighting rule applies only when the vehicle reports ADAPTIVE; this app does not add Adaptive driving mode to a vehicle.

<img width="8064" height="4536" alt="Ambient-Drive 2" src="https://github.com/user-attachments/assets/6a7d099f-e83c-476d-9fbf-d51854653246" />

## Test status

Local migration, rule, IPC, service restart, UI and package checks passed. Previous app0.2.4 was reported functional by the user on a BMW G01 plug-in2020. App0.2.6 / service0.2.5 passed local verification and await on-car retesting. Sport Plus and Individual modes require a car that actually reports their corresponding FES signals. Full vehicle sleep/wake retention and physical operation of the additional modes, including Adaptive on an equipped car remain unconfirmed. The user's G01 has no Adaptive mode. Other models and firmware have not been physically validated. This is a test release.

No BMW SDK, executable, private keys or extracted artwork is distributed. Own code uses MIT; retain the included notices. See LICENSE.kit for the application kit license.

[MGU Store](https://github.com/robertnisipeanu/mgu-store) · [Publishing format](https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md)

## Source code and development

The complete app, service, runtime kit, build scripts and regression tests are in `apps/`, `native/`, `kit/`, `tools/` and `tests/`. See [BUILDING.md](BUILDING.md) for a clean build and verification, and [INSTALL.md](INSTALL.md) for installation. The release catalog remains the installation source; select **Releases** in MGU Store.

App source: [apps/dorin_ambientdrive](apps/dorin_ambientdrive). Service source: [native/dorin-ambient](native/dorin-ambient). Package hashes are recorded in [RELEASE-ARTIFACTS.json](RELEASE-ARTIFACTS.json).

The named source ZIP attached to a release is the complete source snapshot. GitHub's automatic source archives reflect the commit of their particular tag; the `catalog` tag is the distribution index and can refer to an earlier commit. For versioned source snapshots use a tag created after the source files have been committed.
