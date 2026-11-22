# Ambient Drive

**0.2.8 test release** with service **0.2.6**. It improves drive-mode discovery on iDrive 7 and shows the selected colour as a square in Home. The xDrive30i and compact Home layout still need on-car verification.

A native iDrive7 app that changes ambient lighting according to the driving mode and the M/S gear selector position.

![Ambient Drive](ambient-drive.png)

Choose independent colors in this order: **Sport**, **Sport Plus**, **Sport Individual**, **Comfort**, **Adaptive**, **Eco Pro**, **Eco Pro Individual**, **M/S**. Select **STANDARD** to send no color command for that rule. M/S takes priority while the lever is in M/S, including S and manual M gears. Electric/Hybrid switching is not included.

These eight selectors are always visible. Additional supported signals such as Comfort Plus, Comfort Individual, Eco Pro Plus and off-road modes appear after them only when reported by the car. Configuring a row never enables a driving mode in the vehicle. Screenshots below are from an earlier UI version.

The native interface follows the iDrive language and uses the car's installed preview resources. Selections save immediately and the picker remains open until Back.

<img width="4032" height="2268" alt="Screen Display 1" src="https://github.com/user-attachments/assets/0c0f6855-62cd-4048-a3e8-61a513342ee4" />

## Install

In MGU Store use **Settings → Add source**, enter **dorindumitras/ambient-drive**, choose **Releases**, then **Check now**. Open Ambient Drive. Its service dependency is installed first when needed.

The Releases source offers app **0.2.8** and service **0.2.6**. Existing installations can update in place and keep their settings. [Version 0.2.8 packages and USB kit](https://github.com/dorindumitras/ambient-drive/releases/tag/v0.2.8)

<img width="4032" height="2268" alt="Ambient-Drive" src="https://github.com/user-attachments/assets/c1a8ae94-bfff-4ddb-949e-c837f072d902" />

## Upgrade

Update both packages without uninstalling or clearing settings. The previous shared Sport / Sport PLUS color initializes Sport Plus once, including STANDARD. Sport and Sport Plus then save independent choices. Existing Individual, Comfort, Adaptive, Eco Pro and M/S choices and the enable state are preserved. Upgrading from older shared Comfort / Adaptive versions also retains their one-time migration.

The Adaptive row is configurable before that driving mode is observed. Its lighting rule applies only when the vehicle reports ADAPTIVE; this app does not add Adaptive driving mode to a vehicle.

<img width="8064" height="4536" alt="Ambient-Drive 2" src="https://github.com/user-attachments/assets/6a7d099f-e83c-476d-9fbf-d51854653246" />

## Test status

The previous versions were tested on a BMW G01 plug-in with iDrive 7. The xDrive30i capture reported a valid FES Comfort value and readable ambient status, with no valid M/S update. The validation service can follow a verified FES mode when M/S has never reported and its rule is STANDARD. Continuous M/S telemetry retains priority. If an established M/S signal is lost, automation waits for a fresh sample.

No BMW SDK, executable, private keys or extracted artwork is distributed. Own code uses MIT; retain the included notices. See LICENSE.kit for the application kit license.

[MGU Store](https://github.com/robertnisipeanu/mgu-store) · [Publishing format](https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md)

## Source code and development

The complete app, service, runtime kit, build scripts and regression tests are in `apps/`, `native/`, `kit/`, `tools/` and `tests/`. See [BUILDING.md](BUILDING.md) for a clean build and verification, and [INSTALL.md](INSTALL.md) for installation. The release catalog remains the installation source; select **Releases** in MGU Store.

App source: [apps/dorin_ambientdrive](apps/dorin_ambientdrive). Service source: [native/dorin-ambient](native/dorin-ambient). Package hashes are recorded in [RELEASE-ARTIFACTS.json](RELEASE-ARTIFACTS.json).

The named source ZIP attached to a release is the complete source snapshot. GitHub's automatic source archives reflect the commit of their particular tag; the `catalog` tag is the distribution index and can refer to an earlier commit. For versioned source snapshots use a tag created after the source files have been committed.

## Native Home widget

The native BMW Home widget displays the detected driving mode, the automation state and a square representing the selected colour. A two-tone selection shows both colours. STANDARD and unknown or disabled states clear the square. The large layout uses the background canvas. The compact layout sends the square to the native icon cell and requires a physical display check.

Home reads only the service status and shares one sample across visible widgets. It distinguishes the selected colour from confirmed application. Tap opens the existing settings screen.

All eight selectors, native menus, previews and saved settings retain their existing representation. See [TEST-PE-MGU.md](TEST-PE-MGU.md) for the checks on the G01 plug-in and xDrive30i.
