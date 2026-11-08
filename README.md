# Ambient Drive

**By Dorin Dumitras.** A native iDrive7 app that changes ambient lighting according to the driving mode and the M/S gear selector position.

![Ambient Drive](ambient-drive.png)

Choose independent colors for **Sport / Sport PLUS**, **Comfort**, **Adaptive**, **Eco Pro** and **M/S**, or select **STANDARD** to send no color command for that rule. M/S takes priority while the lever is in M/S. Sport and Sport PLUS share one rule; Comfort and Adaptive are independent. Electric/Hybrid switching is not included.

The native interface follows the iDrive language and uses the car's installed preview resources. Selections save immediately and the picker remains open until Back.

## Install

In MGU Store use **Settings → Add source**, enter **maxon50/ambient-drive**, choose **Releases**, then **Check now**. Open Ambient Drive. Its service dependency is installed first when needed.

Current packages: app **0.2.5**, service **0.2.4**. Requires iDrive7, MGU Store and mgu-deploy0.7.11 or newer.

## Upgrade

Update both packages without uninstalling or clearing settings. The previous shared Comfort / Adaptive color initializes both rows, including STANDARD. Further changes are independent. The enable state and other rules are preserved.

The Adaptive row is configurable before that driving mode is observed. Its lighting rule applies only when the vehicle reports ADAPTIVE; this app does not add Adaptive driving mode to a vehicle.

## Test status

Local migration, rule, IPC, service restart, UI and package checks passed. Previous app0.2.4 was reported functional by the user on a BMW G01 plug-in2020. App0.2.5 awaits on-car retesting. Full vehicle sleep/wake retention and physical operation of Adaptive on an equipped car remain unconfirmed. The user's G01 has no Adaptive mode. Other models and firmware have not been physically validated. This is a test release.

No BMW SDK, executable, private keys or extracted artwork is distributed. Own code uses MIT; retain the included notices. See LICENSE.kit for the application kit license.

[MGU Store](https://github.com/robertnisipeanu/mgu-store) · [Publishing format](https://github.com/robertnisipeanu/mgu-store/blob/main/docs/PUBLISHING.md)
