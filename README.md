# Mini J-Web EX

Mini J-Web EX is a local Electron desktop application for configuring Juniper EX switches, with selected QFX compatibility checks, through a simplified J-Web-style GUI.

Current release: `0.6.0-beta.5`

Latest GitHub release:
[Mini J-Web EX 0.6.0-beta.5](https://github.com/nuaythebeest/Mini-JWeb/releases/tag/v0.6.0-beta.5)

The app connects to a switch, pulls a snapshot, keeps candidate edits local in the GUI, and sends changes only when the user runs refresh, operational tools, commit check, commit confirmed, commit, or candidate revert.

The `0.6.0-beta.5` release introduces a Mist-inspired QoL redesign with a collapsible navigation rail, clearer device identity, bundled Open Sans typography, and consistent controls across the application.

## Downloads

The current release includes:

- Windows x64 installer: `Mini J-Web EX Setup 0.6.0-beta.5-x64.exe`
- macOS Apple Silicon DMG: `Mini J-Web EX-0.6.0-beta.5-arm64.dmg`

Installers are currently unsigned, so Windows/macOS may warn that the publisher is unknown.

## Switch Prerequisites

Enable NETCONF over SSH before using the application:

```text
set system services netconf ssh
commit
```

The application uses NETCONF over SSH on TCP port `830` by default.

For Firmware Upgrade upload support, SFTP must also be enabled under SSH:

```text
set system services ssh sftp-server
commit check
commit confirmed 5
```

## Current Feature Set

- Device profiles with host, NETCONF port, username, password, and remember option
- Top-bar connection status, profile selection, connect, disconnect, refresh, revert, commit confirmed, and commit
- Dashboard with device summary, CPU, firmware, live port/VLAN counts, and separate Power, Fan, and Temperature sections
- Front-panel port view with two-row physical layout and VCP coloring
- Ports menu with search/filter by interface, member/FPC, link state, VLAN, or VCP
- VLAN creation, editing, deletion, and dependency warnings
- Interface configuration for access, trunk, Layer 3, voice VLAN, LLDP-MED, edge port, MTU, native VLAN, IPv4, and IPv6
- Member/FPC dropdown in the Interfaces menu for Virtual Chassis scale
- Aggregate Ethernet and LACP configuration
- Spanning Tree: RSTP, VSTP, bridge priority, BPDU block on edge, and edge-interface reflection
- IRB creation with optional unit rows, VLAN association, DHCP server, and DHCP relay
- Static routes with `default` or `mgmt_junos` routing-instance dropdown
- Management tools for OOB management, system settings, reboot, ping, traceroute, user creation, and commit-confirm timer
- Firmware Upgrade workflow with local file selection, SFTP pre-check, `/var/tmp` file-exists guardrail, overwrite option, storage cleanup, install log, `no-validate` option, reboot prompt, and alternate-slice snapshot
- Virtual Chassis workflow with current mode display, HGoE guardrails, preprovisioning, member model dropdown, VCP/network conversion actions, and `no-split-detection` option
- Monitoring tabs for VLAN, route, ARP, DHCP bindings, LACP, and spanning tree
- Commit preview, active configuration view, export set file, commit check, commit confirmed, and commit

## Supported and Sanity-Checked Platforms

Mini J-Web EX is currently focused on Junos OS campus/access switching workflows.

Sanity-checked so far:

- EX2300 / EX2300-C
- EX3400
- EX4100
- EX4300
- EX4650
- QFX5110

Current platform notes:

- EX3400 rear layout is treated as PIC 1 `2x40G QSFP` plus PIC 2 `4x10G SFP/SFP+`.
- EX4300 Virtual Chassis testing covered real two-member VC workflow and preprovisioning behavior.
- EX4650 and QFX5120-48Y share related hardware behavior, but the app should derive the workflow from software/model identity, not chassis string alone.
- QFX5110/QFX5120 are Junos OS, not Junos EVO, but QFX workflows are still treated as selected compatibility support rather than full EX-equivalent support.

## Virtual Chassis Notes

The Virtual Chassis menu includes:

- Current mode display: HGoE, HiGig / Non-HGoE, or enabled/non-HGoE platform
- HGoE minimum-version guardrails
- HGoE and HiGig mode-change actions with reboot confirmation
- Per-port VCP conversion where supported
- Non-HGoE warning that conversion may affect the full VCP group rather than one flexible port
- Preprovisioning with member ID, serial number, model, and role
- `no-split-detection` checkbox, recommended for two-member Virtual Chassis designs when appropriate

Generated candidate configuration should still be applied with commit safety:

```text
commit check
commit confirmed 5
```

## Firmware Upgrade Notes

Firmware Upgrade performs a staged workflow:

1. Select a local Junos package.
2. Run pre-check for SFTP and `/var/tmp` storage.
3. Check whether the package already exists in `/var/tmp`.
4. Upload, skip upload, or overwrite intentionally.
5. Run `request system software add`.
6. Show upgrade output and highlight `Upgrade Complete - Reboot Required`.
7. Offer reboot and `request system snapshot slice alternate` after the new version boots correctly.

The `no-validate` option is available only as an explicit operator choice for cases where Junos validation fails and recommends it.

## Local Development

Install dependencies:

```bash
npm install
```

Build the renderer:

```bash
npm run build
```

Run in development mode:

```bash
npm run dev
```

Run the built desktop app:

```bash
npm start
```

## Packaging

Build macOS Apple Silicon DMG:

```bash
npm run package:mac
```

Build Windows x64 installer:

```bash
npm run package:win
```

Generated packages are written to `release/`.

Post-RC1 builds use the product name `Mini J-Web EX`; existing RC1 installers may still show `Mini J-Web EX Windows` in artifact and shortcut names.

## Security Notes

- Credentials are handled locally by the Electron app.
- Saved profiles are intended for lab/operator convenience on the local computer.
- Installers are not code-signed yet.
- Production distribution should add proper code signing and stronger host-key trust controls.
