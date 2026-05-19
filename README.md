# Mini J-Web EX Windows

Mini J-Web EX Windows is a local Electron desktop application for configuring Juniper EX switches with a simplified J-Web-style GUI.

Current beta: `0.5.0-beta.11`

The app pulls a snapshot from the switch, keeps the candidate configuration local while the user edits forms, and contacts the switch again only for refresh, operational tools, commit-check, commit confirmed, commit, or candidate revert.

## Prototype Scope

- Device access over NETCONF/SSH
- Dashboard with model, firmware, CPU, fan, power, temperature, and hardware environment details
- Front-panel port status with EX4100-48MP MultiGigabit/uplink awareness
- VLAN creation
- Ethernet switching interfaces in access or trunk mode
- Layer 3 interfaces with IPv4 static, IPv4 DHCP, and IPv6 addressing
- Voice VLAN configuration
- LLDP and LLDP-MED
- Aggregate Ethernet with LACP
- RSTP and VSTP
- Static routes
- `mgmt_junos` management VRF for out-of-band management
- IRB interface creation and VLAN association
- DHCP server and DHCP relay under IRB workflow
- System settings, reboot, ping, traceroute, user creation, and revert timer tools
- Firmware upgrade workflow with local file selection, SFTP upload to `/var/tmp`, storage/SFTP pre-checks, install output, reboot, and alternate slice snapshot
- Monitoring outputs for VLAN, route, ARP, DHCP bindings, LACP, and spanning tree
- Preview and export of generated Junos `set` commands
- NETCONF commit-check, commit confirmed, and commit

## Protocol Choice

The prototype uses NETCONF over SSH on TCP port 830.

NETCONF is a good fit for Junos because it supports candidate configuration workflows, commit-check, commit, lock, and unlock. This keeps the GUI fast because the app does not query Junos after every field edit.

## Switch Prerequisites

Enable NETCONF over SSH on the EX switch:

```text
set system services netconf ssh
commit
```

The application verifies that the connected target reports Junos and an EX model before showing the device as ready. Current beta focus is EX Series, which runs Junos OS on Broadcom-based switching hardware.

The generated voice VLAN syntax uses ELS-style Junos EX syntax:

```text
set switch-options voip interface ge-0/0/2.0 vlan voice-vlan
```

## Next Version Virtual Chassis Requirements

- Show the HGoE minimum release before offering HGoE mode-change actions. For EX4100 and EX4100-F, warn when the connected switch is below Junos OS `24.2R1`.
- In non-HGoE/HiGig mode, warn that changing VC ports to network-port mode is not a flexible one-port conversion. Treat it as an all-port/group mode change that can leave the switch without usable VCP links.
- HGoE/HiGig mode changes require reboot and should always show the exact Junos request command before confirmation.
- Firmware Upgrade must verify SFTP readiness before upload. If disabled, offer to commit `set system services ssh sftp-server`, then offer `delete system services ssh sftp-server` after the upgrade if required by policy.
- Firmware Upgrade must check `/var/tmp` free space and offer `request system storage cleanup no-confirm` before uploading a local Junos package.
- Firmware Upgrade must check whether `/var/tmp/<package>` already exists before uploading. If present, let the user skip upload and proceed to install the existing file, or explicitly choose overwrite.
- Firmware Upgrade offers an opt-in `no-validate` install mode for cases where Junos explicitly reports validation failure and recommends `no-validate`, for example `request system software add no-validate /var/tmp/<package>.tgz`.

## Local Development

Install dependencies:

```bash
npm install
```

Build the renderer:

```bash
npm run build
```

Run the desktop app after building:

```bash
npm start
```

Run in development mode:

```bash
npm run dev
```

## Package for Customers

Build a Windows x64 installer:

```bash
npm run package:win
```

Generated installers are written to `release/`.

## Security Notes

- The username and password are passed from the renderer to the Electron main process only when the user verifies, commit-checks, or commits.
- Credentials are not persisted to disk by this prototype.
- For production, add certificate/host-key trust controls and optional credential vault integration before customer deployment.
