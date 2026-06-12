import { sha512 } from "sha512-crypt-ts";

const VLAN_NAME = /^[A-Za-z][A-Za-z0-9_.-]{0,62}$/;
const IFACE_NAME = /^[a-z]+-\d+\/\d+\/\d+(?:\.\d+)?(?::\d+)?$/i;
const CIDR = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IPV6_CIDR = /^[0-9A-Fa-f:.]+\/\d{1,3}$/;
const ROUTE_PREFIX = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
const IP = /^(\d{1,3}\.){3}\d{1,3}$/;
const VLAN_ID = /^\d{1,4}$/;
const AE_NUMBER = /^\d+$/;
const POOL_NAME = /^[A-Za-z][A-Za-z0-9_.-]{0,62}$/;
const USER_NAME = /^[A-Za-z_][A-Za-z0-9_.-]{0,62}$/;
const HOST_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
const FQDN_OR_IP = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/;
const TIME_ZONE = /^[A-Za-z_]+\/[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)?$/;
const VC_SERIAL = /^[A-Za-z0-9_-]+$/;
const VC_ROLES = new Set(["routing-engine", "line-card"]);
const PORT_SPEEDS = new Set(["1g", "10g", "25g", "40g", "100g"]);

function irbHasDhcpServices(irb = {}) {
  return Boolean(irb.dhcpServer?.enabled || irb.dhcpRelay?.enabled);
}

function irbHasConfig(irb = {}) {
  return Boolean(
    String(irb.unit || "").trim()
    || String(irb.vlan || "").trim()
    || String(irb.address || "").trim()
    || String(irb.mtu || "").trim()
    || String(irb.description || "").trim()
    || irbHasDhcpServices(irb)
  );
}
const PROTECTED_VLANS = new Set(["default"]);
const BRIDGE_PRIORITIES = new Set(Array.from({ length: 16 }, (_, index) => String(index * 4096)));

export function ensureUnit(interfaceName) {
  return String(interfaceName || "").includes(".") ? interfaceName : `${interfaceName}.0`;
}

export function stripUnit(interfaceName) {
  return String(interfaceName || "").replace(/\.\d+$/, "");
}

export function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateMtu(value, label, errors) {
  if (!value) {
    return;
  }
  const mtu = Number(value);
  if (!Number.isInteger(mtu) || mtu < 256 || mtu > 9216) {
    errors.push(`${label}: MTU must be 256-9216.`);
  }
}

function aeName(value) {
  return `ae${String(value || "").replace(/^ae/i, "")}`;
}

function randomSalt(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

function junosEncryptedPassword(password) {
  return sha512.crypt(String(password || ""), randomSalt(16));
}

function isIp(value) {
  return IP.test(String(value || ""));
}

function parseStaticRoutes(text = "") {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((routes, line) => {
      const baseMatch = line.match(/^set\s+(?:routing-instances\s+(\S+)\s+)?routing-options\s+static\s+route\s+(\S+)\s+next-hop\s+(\S+)/);
      if (baseMatch) {
        routes.push({
          routingInstance: baseMatch[1] || "",
          prefix: baseMatch[2],
          nextHop: baseMatch[3],
          qualifiedNextHop: "",
          qualifiedPreference: "10",
          modified: false
        });
        return routes;
      }
      const qualifiedMatch = line.match(/^set\s+(?:routing-instances\s+(\S+)\s+)?routing-options\s+static\s+route\s+(\S+)\s+qualified-next-hop\s+(\S+)(?:\s+preference\s+(\S+))?/);
      if (qualifiedMatch) {
        const route = routes.find((item) => item.routingInstance === (qualifiedMatch[1] || "") && item.prefix === qualifiedMatch[2])
          || {
            routingInstance: qualifiedMatch[1] || "",
            prefix: qualifiedMatch[2],
            nextHop: "",
            modified: false
          };
        if (!routes.includes(route)) {
          routes.push(route);
        }
        route.qualifiedNextHop = qualifiedMatch[3];
        route.qualifiedPreference = qualifiedMatch[4] || "10";
      }
      return routes;
    }, []);
}

function normalizeBridgePriority(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return "";
  }
  const shorthand = raw.match(/^(\d+)k$/);
  if (shorthand) {
    return String(Number(shorthand[1]) * 1024);
  }
  return raw;
}

export function validateConfig(config) {
  const errors = [];
  const vlanNames = new Set(config.vlans.map((vlan) => vlan.name).filter(Boolean));
  const vlanIds = new Set(config.vlans.map((vlan) => String(vlan.vlanId || "")).filter(Boolean));
  const vlanPreviousNames = new Set(config.vlans.map((vlan) => vlan.previousName).filter(Boolean));
  const spanningTree = config.spanningTree || defaultConfig.spanningTree;

  config.vlans.forEach((vlan, index) => {
    if (!VLAN_NAME.test(vlan.name || "")) {
      errors.push(`VLAN ${index + 1}: name must start with a letter and use letters, numbers, dash, dot, or underscore.`);
    }
    if (vlan.previousName && !VLAN_NAME.test(vlan.previousName)) {
      errors.push(`VLAN ${vlan.name || index + 1}: original name is not valid.`);
    }
    const id = Number(vlan.vlanId);
    if (!Number.isInteger(id) || id < 1 || id > 4094) {
      errors.push(`VLAN ${vlan.name || index + 1}: VLAN ID must be 1-4094.`);
    }
  });

  config.interfaces.filter((item) => item.modified !== false).forEach((item, index) => {
    if (!IFACE_NAME.test(item.name || "")) {
      errors.push(`Interface ${index + 1}: enter an EX interface such as ge-0/0/1 or xe-0/1/0.`);
    }
    if (item.portSpeed && !PORT_SPEEDS.has(String(item.portSpeed).toLowerCase())) {
      errors.push(`${item.name || `Interface ${index + 1}`}: port speed must be 1g, 10g, 25g, 40g, or 100g.`);
    }
    if (item.bundleAe) {
      if (!AE_NUMBER.test(String(item.bundleAe))) {
        errors.push(`${item.name || `Interface ${index + 1}`}: aggregate bundle must be a number such as 0 for ae0.`);
      }
      return;
    }
    validateMtu(item.mtu, item.name || `Interface ${index + 1}`, errors);
    if ((item.portType || "l2") === "l3") {
      if (item.stpEdge) {
        errors.push(`${item.name || `Interface ${index + 1}`}: edge port is only available for access interfaces.`);
      }
      const unit = Number(item.unit || "0");
      if (!Number.isInteger(unit) || unit < 0 || unit > 16384) {
        errors.push(`${item.name || `Interface ${index + 1}`}: Layer 3 unit must be 0-16384.`);
      }
      if (unit !== 0) {
        const vlanId = Number(item.l3VlanId);
        if (!VLAN_ID.test(String(item.l3VlanId || "")) || !Number.isInteger(vlanId) || vlanId < 1 || vlanId > 4094) {
          errors.push(`${item.name || `Interface ${index + 1}`}: Layer 3 unit ${unit} requires a VLAN ID from 1-4094.`);
        }
      }
      if ((item.ipv4Mode || "static") !== "dhcp" && splitCsv(item.ipAddresses).length === 0 && splitCsv(item.ipv6Addresses).length === 0) {
        errors.push(`${item.name || `Interface ${index + 1}`}: Layer 3 interface requires at least one IPv4 or IPv6 CIDR address.`);
      }
      if ((item.ipv4Mode || "static") !== "dhcp") splitCsv(item.ipAddresses).forEach((address) => {
        if (!CIDR.test(address)) {
          errors.push(`${item.name}: ${address} is not a valid CIDR address.`);
        }
      });
      splitCsv(item.ipv6Addresses).forEach((address) => {
        if (!IPV6_CIDR.test(address)) {
          errors.push(`${item.name}: ${address} is not a valid IPv6 CIDR address.`);
        }
      });
      return;
    }
    if (item.mode === "access") {
      if (!vlanNames.has(item.accessVlan)) {
        errors.push(`${item.name || `Interface ${index + 1}`}: access VLAN must exist in the VLAN table.`);
      }
      if (item.voice.enabled && item.voice.vlan === item.accessVlan) {
        errors.push(`${item.name}: voice VLAN must be different from data VLAN.`);
      }
    }
    if (item.mode === "trunk" && splitCsv(item.trunkVlans).some((vlan) => !vlanNames.has(vlan))) {
      errors.push(`${item.name || `Interface ${index + 1}`}: every trunk VLAN must exist in the VLAN table.`);
    }
    if (item.mode !== "access" && item.stpEdge) {
      errors.push(`${item.name || `Interface ${index + 1}`}: edge port is only available for access interfaces.`);
    }
    if (item.mode === "access" && item.stpEdge && spanningTree.mode === "none") {
      errors.push(`${item.name || `Interface ${index + 1}`}: enable RSTP or VSTP before using edge port.`);
    }
    if (item.voice.enabled && !vlanNames.has(item.voice.vlan)) {
      errors.push(`${item.name || `Interface ${index + 1}`}: voice VLAN must exist in the VLAN table.`);
    }
  });

  if (spanningTree.mode === "rstp" && !BRIDGE_PRIORITIES.has(normalizeBridgePriority(spanningTree.rstpPriority))) {
    errors.push("RSTP bridge priority must be 0-61440 in 4096 increments.");
  }

  if (spanningTree.mode === "vstp") {
    const vlanNameById = new Map(config.vlans.map((vlan) => [String(vlan.vlanId || ""), vlan.name]).filter(([id, name]) => id && name));
    const vstpUsage = new Map();
    (spanningTree.vstpGroups || []).forEach((group, index) => {
      if (!BRIDGE_PRIORITIES.has(normalizeBridgePriority(group.priority))) {
        errors.push(`VSTP group ${index + 1}: bridge priority must be 0-61440 in 4096 increments.`);
      }
      if (splitCsv(group.vlans).length === 0) {
        errors.push(`VSTP group ${index + 1}: select at least one VLAN.`);
      }
      splitCsv(group.vlans).forEach((vlan) => {
        if (!vlanNames.has(vlan) && !vlanIds.has(vlan)) {
          errors.push(`VSTP group ${index + 1}: VLAN ${vlan} must exist in the VLAN table.`);
          return;
        }
        const canonicalVlan = vlanNames.has(vlan) ? vlan : vlanNameById.get(vlan) || vlan;
        const previousGroup = vstpUsage.get(canonicalVlan);
        if (previousGroup) {
          errors.push(`VSTP group ${index + 1}: VLAN ${vlan} already belongs to VSTP group ${previousGroup}.`);
          return;
        }
        vstpUsage.set(canonicalVlan, index + 1);
      });
    });
  }

  config.irbs.filter(irbHasConfig).forEach((irb, index) => {
    const unitValue = String(irb.unit || "").trim();
    const unit = Number(unitValue);
    const address = String(irb.address || "").trim();
    if (!unitValue || !Number.isInteger(unit) || unit < 0 || unit > 16384) {
      errors.push(`IRB ${index + 1}: unit must be a positive number.`);
    }
    if (address && !CIDR.test(address)) {
      errors.push(`IRB ${irb.unit || index + 1}: address must be CIDR format, for example 192.0.2.1/24.`);
    }
    validateMtu(irb.mtu, `IRB ${irb.unit || index + 1}`, errors);
    if (irb.vlan && !vlanNames.has(irb.vlan) && !vlanPreviousNames.has(irb.vlan)) {
      errors.push(`IRB ${irb.unit || index + 1}: linked VLAN must exist.`);
    }
    if (irb.dhcpServer?.enabled && irb.dhcpRelay?.enabled) {
      errors.push(`IRB ${irb.unit || index + 1}: DHCP server and DHCP relay cannot both be enabled on the same IRB.`);
    }
    if (irb.dhcpServer?.enabled) {
      if (!CIDR.test(irb.dhcpServer.network || "")) {
        errors.push(`IRB ${irb.unit || index + 1}: DHCP server network must be CIDR format.`);
      }
      if (!IP.test(irb.dhcpServer.rangeLow || "") || !IP.test(irb.dhcpServer.rangeHigh || "")) {
        errors.push(`IRB ${irb.unit || index + 1}: DHCP server range low/high must be IPv4 addresses.`);
      }
      if (!IP.test(irb.dhcpServer.router || "")) {
        errors.push(`IRB ${irb.unit || index + 1}: DHCP server default gateway must be an IPv4 address.`);
      }
      if (irb.dhcpServer.poolName && !POOL_NAME.test(irb.dhcpServer.poolName)) {
        errors.push(`IRB ${irb.unit || index + 1}: DHCP pool name must start with a letter and use letters, numbers, dash, dot, or underscore.`);
      }
      splitCsv(irb.dhcpServer.dns).forEach((server) => {
        if (!IP.test(server)) {
          errors.push(`IRB ${irb.unit || index + 1}: DHCP DNS server ${server} is not valid.`);
        }
      });
    }
    if (irb.dhcpRelay?.enabled) {
      if (splitCsv(irb.dhcpRelay.servers).length === 0) {
        errors.push(`IRB ${irb.unit || index + 1}: DHCP relay requires at least one server.`);
      }
      splitCsv(irb.dhcpRelay.servers).forEach((server) => {
        if (!IP.test(server)) {
          errors.push(`IRB ${irb.unit || index + 1}: DHCP relay server ${server} is not valid.`);
        }
      });
    }
  });

  if (config.aggregate?.deviceCount) {
    const count = Number(config.aggregate.deviceCount);
    if (!Number.isInteger(count) || count < 1 || count > 128) {
      errors.push("Aggregate Ethernet device count must be 1-128.");
    }
  }

  (config.aggregate?.interfaces || []).filter((item) => item.modified !== false).forEach((item, index) => {
    if (!AE_NUMBER.test(String(item.number || ""))) {
      errors.push(`AE ${index + 1}: enter an aggregate number such as 0 for ae0.`);
    }
    validateMtu(item.mtu, `ae${item.number || index}`, errors);
    if ((item.portType || "none") === "none") {
      return;
    }
    if ((item.portType || "l2") === "l3") {
      const unit = Number(item.unit || "0");
      if (!Number.isInteger(unit) || unit < 0 || unit > 16384) {
        errors.push(`ae${item.number || index}: Layer 3 unit must be 0-16384.`);
      }
      if (unit !== 0) {
        const vlanId = Number(item.l3VlanId);
        if (!VLAN_ID.test(String(item.l3VlanId || "")) || !Number.isInteger(vlanId) || vlanId < 1 || vlanId > 4094) {
          errors.push(`ae${item.number || index}: Layer 3 unit ${unit} requires a VLAN ID from 1-4094.`);
        }
      }
      if ((item.ipv4Mode || "static") !== "dhcp" && splitCsv(item.ipAddresses).length === 0 && splitCsv(item.ipv6Addresses).length === 0) {
        errors.push(`ae${item.number || index}: Layer 3 interface requires at least one IPv4 or IPv6 CIDR address.`);
      }
      if ((item.ipv4Mode || "static") !== "dhcp") splitCsv(item.ipAddresses).forEach((address) => {
        if (!CIDR.test(address)) {
          errors.push(`ae${item.number || index}: ${address} is not a valid CIDR address.`);
        }
      });
      splitCsv(item.ipv6Addresses).forEach((address) => {
        if (!IPV6_CIDR.test(address)) {
          errors.push(`ae${item.number || index}: ${address} is not a valid IPv6 CIDR address.`);
        }
      });
      return;
    }
    if (item.mode === "access" && !vlanNames.has(item.accessVlan)) {
      errors.push(`ae${item.number || index}: access VLAN must exist in the VLAN table.`);
    }
    if (item.mode === "trunk" && splitCsv(item.trunkVlans).length === 0) {
      errors.push(`ae${item.number || index}: select at least one trunk VLAN.`);
    }
    if (item.mode === "trunk" && splitCsv(item.trunkVlans).some((vlan) => !vlanNames.has(vlan))) {
      errors.push(`ae${item.number || index}: every trunk VLAN must exist in the VLAN table.`);
    }
  });

  config.staticRoutes.forEach((route, index) => {
    if (route.modified === false) {
      return;
    }
    if (!ROUTE_PREFIX.test(route.prefix || "")) {
      errors.push(`Static route ${index + 1}: prefix must be CIDR format.`);
    }
    if (!IP.test(route.nextHop || "")) {
      errors.push(`Static route ${route.prefix || index + 1}: next hop must be an IPv4 address.`);
    }
    if (route.qualifiedNextHop && !IP.test(route.qualifiedNextHop)) {
      errors.push(`Static route ${route.prefix || index + 1}: qualified next-hop must be an IPv4 address.`);
    }
  });

  if (config.management.enabled) {
    if (!["me0", "vme"].includes(config.management.interfaceName)) {
      errors.push("Management interface should be me0 or vme for EX switches.");
    }
    if ((config.management.ipv4Mode || "static") === "static" && !CIDR.test(config.management.address || "")) {
      errors.push("Management address must be CIDR format.");
    }
    if (config.management.gateway && !IP.test(config.management.gateway)) {
      errors.push("Management gateway must be an IPv4 address.");
    }
  }
  if (config.management.revertTimer) {
    const timer = Number(config.management.revertTimer);
    if (!Number.isInteger(timer) || timer < 1 || timer > 120) {
      errors.push("Commit confirm revert timer must be 1-120 minutes.");
    }
  }

  (config.management.users || []).forEach((user, index) => {
    if (!USER_NAME.test(user.username || "")) {
      errors.push(`User ${index + 1}: username must start with a letter or underscore and use letters, numbers, dash, dot, or underscore.`);
    }
    if (!user.password) {
      errors.push(`User ${user.username || index + 1}: password is required.`);
    }
    if (!["super-user", "read-only"].includes(user.privilege || "")) {
      errors.push(`User ${user.username || index + 1}: privilege must be super-user or read-only.`);
    }
  });

  const virtualChassis = config.virtualChassis || defaultConfig.virtualChassis;
  if (virtualChassis.modified !== false && virtualChassis.preprovisioned) {
    const memberIds = new Set();
    const serials = new Set();
    let routingEngines = 0;
    (virtualChassis.members || []).forEach((member, index) => {
      const label = `VC member ${member.memberId || index + 1}`;
      const memberId = Number(member.memberId);
      if (!Number.isInteger(memberId) || memberId < 0 || memberId > 9) {
        errors.push(`${label}: member ID must be 0-9.`);
      }
      if (memberIds.has(String(member.memberId))) {
        errors.push(`${label}: member ID is duplicated.`);
      }
      memberIds.add(String(member.memberId));
      if (!VC_SERIAL.test(member.serialNumber || "")) {
        errors.push(`${label}: serial number is required and must use letters, numbers, dash, or underscore.`);
      }
      if (serials.has(String(member.serialNumber || ""))) {
        errors.push(`${label}: serial number is duplicated.`);
      }
      serials.add(String(member.serialNumber || ""));
      if (!VC_ROLES.has(member.role || "")) {
        errors.push(`${label}: role must be routing-engine or line-card.`);
      }
      if (member.role === "routing-engine") {
        routingEngines += 1;
      }
    });
    if ((virtualChassis.members || []).length === 0) {
      errors.push("Virtual Chassis preprovisioning requires at least one member.");
    }
    if (routingEngines > 2) {
      errors.push("Virtual Chassis preprovisioning should not define more than two routing-engine members.");
    }
  }

  const system = config.management.system || defaultConfig.management.system;
  if (system.modified !== false) {
    if (system.hostName && !HOST_NAME.test(system.hostName)) {
      errors.push("System hostname must be a valid hostname.");
    }
    splitCsv(system.nameServers).forEach((server) => {
      if (!IP.test(server)) {
        errors.push(`Name server ${server} must be an IPv4 address.`);
      }
    });
    splitCsv(system.ntpServers).forEach((server) => {
      if (!IP.test(server) && !FQDN_OR_IP.test(server)) {
        errors.push(`NTP server ${server} must be an IPv4 address or FQDN.`);
      }
    });
    const activeNameServers = system.activeNameServers || [];
    const stagedNameServers = splitCsv(system.nameServers);
    const hasCommittedDns = activeNameServers.length > 0;
    const hasEffectiveDns = stagedNameServers.length > 0;
    const hasNtpFqdn = splitCsv(system.ntpServers).some((server) => !isIp(server));
    if (hasNtpFqdn && (!hasCommittedDns || !hasEffectiveDns)) {
      errors.push("NTP FQDN requires name-server already committed. Commit name-server first, refresh, then add the NTP FQDN.");
    }
    if (system.timeZone && !TIME_ZONE.test(system.timeZone)) {
      errors.push("Time zone must look like Asia/Bangkok.");
    }
  }

  return errors;
}

export function buildSetCommands(config) {
  const commands = [];
  const spanningTree = config.spanningTree || defaultConfig.spanningTree;
  const vlanIdByName = new Map(config.vlans.map((vlan) => [vlan.name, vlan.vlanId]));
  const vstpVlanId = (vlanName) => vlanIdByName.get(vlanName) || vlanName;
  const edgeInterfaces = config.interfaces
    .filter((item) => item.stpEdge && item.portType !== "l3" && item.mode === "access")
    .map((item) => ({ ifd: stripUnit(item.name), vlan: item.accessVlan }))
    .filter((item) => item.ifd);
  const currentVlanNames = new Set(config.vlans.map((vlan) => vlan.name).filter(Boolean));
  const renamedVlanNames = new Set(
    config.vlans
      .filter((vlan) => vlan.previousName && vlan.previousName !== vlan.name)
      .map((vlan) => vlan.previousName)
  );
  const currentInterfaceNames = new Set(config.interfaces.map((item) => stripUnit(item.name)).filter(Boolean));
  const currentAggregateNames = new Set((config.aggregate?.interfaces || []).map((item) => aeName(item.number)).filter(Boolean));
  const baselineInterfaceNames = new Set(config.baseline?.interfaces || []);
  const virtualChassis = config.virtualChassis || defaultConfig.virtualChassis;

  (config.baseline?.vlans || []).forEach((vlanName) => {
    const protectedVlan = PROTECTED_VLANS.has(String(vlanName || "").toLowerCase());
    if (vlanName && !protectedVlan && !currentVlanNames.has(vlanName) && !renamedVlanNames.has(vlanName)) {
      commands.push(`delete vlans ${vlanName}`);
    }
  });

  (config.baseline?.interfaces || []).forEach((interfaceName) => {
    if (interfaceName && !currentInterfaceNames.has(interfaceName)) {
      commands.push(`delete interfaces ${interfaceName}`);
    }
  });

  (config.baseline?.aggregateInterfaces || []).forEach((interfaceName) => {
    if (interfaceName && !currentAggregateNames.has(interfaceName)) {
      commands.push(`delete interfaces ${interfaceName}`);
    }
  });

  config.vlans.filter((vlan) => vlan.modified !== false).forEach((vlan) => {
    if (vlan.previousName && vlan.previousName !== vlan.name) {
      commands.push(`rename vlans ${vlan.previousName} to ${vlan.name}`);
    }
    commands.push(`set vlans ${vlan.name} vlan-id ${vlan.vlanId}`);
    if (vlan.description) {
      commands.push(`set vlans ${vlan.name} description "${vlan.description.replace(/"/g, '\\"')}"`);
    }
  });

  config.irbs.filter((irb) => irb.modified !== false && irbHasConfig(irb)).forEach((irb) => {
    const unit = String(irb.unit || "").trim();
    if (!unit) {
      return;
    }
    const irbName = `irb.${unit}`;
    const previousAddress = String(irb.previousAddress || "").trim();
    const address = String(irb.address || "").trim();
    if (previousAddress && previousAddress !== address) {
      commands.push(`delete interfaces irb unit ${unit} family inet address ${previousAddress}`);
    }
    if (address) {
      commands.push(`delete interfaces irb unit ${unit} family inet dhcp`);
      commands.push(`set interfaces irb unit ${unit} family inet address ${address}`);
    }
    if (irb.mtu) {
      commands.push(`set interfaces irb unit ${unit} family inet mtu ${irb.mtu}`);
    }
    if (irb.description) {
      commands.push(`set interfaces irb unit ${unit} description "${irb.description.replace(/"/g, '\\"')}"`);
    }
    if (irb.vlan) {
      commands.push(`set vlans ${irb.vlan} l3-interface ${irbName}`);
    }
    if (irb.dhcpServer?.enabled) {
      const poolName = irb.dhcpServer.poolName || `IRB_${irb.unit}_POOL`;
      const groupName = irb.dhcpServer.groupName || "MINI_JWEB_DHCP";
      commands.push(`set access address-assignment pool ${poolName} family inet network ${irb.dhcpServer.network}`);
      commands.push(`set access address-assignment pool ${poolName} family inet range CLIENTS low ${irb.dhcpServer.rangeLow}`);
      commands.push(`set access address-assignment pool ${poolName} family inet range CLIENTS high ${irb.dhcpServer.rangeHigh}`);
      commands.push(`set access address-assignment pool ${poolName} family inet dhcp-attributes router ${irb.dhcpServer.router}`);
      splitCsv(irb.dhcpServer.dns).forEach((server) => {
        commands.push(`set access address-assignment pool ${poolName} family inet dhcp-attributes name-server ${server}`);
      });
      commands.push(`set system services dhcp-local-server group ${groupName} interface ${irbName}`);
    }
    if (irb.dhcpRelay?.enabled) {
      const groupName = irb.dhcpRelay.groupName || `IRB_${irb.unit}_RELAY`;
      splitCsv(irb.dhcpRelay.servers).forEach((server) => {
        commands.push(`set forwarding-options dhcp-relay server-group ${groupName} ${server}`);
      });
      commands.push(`set forwarding-options dhcp-relay active-server-group ${groupName}`);
      commands.push(`set forwarding-options dhcp-relay group ${groupName} interface ${irbName}`);
    }
  });

  config.interfaces.filter((item) => item.modified !== false).forEach((item) => {
    const ifd = stripUnit(item.name);
    const ifl = ensureUnit(ifd);
    const unit = (item.portType || "l2") === "l3" ? String(item.unit || "0") : "0";

    if (item.bundleAe) {
      commands.push(`delete interfaces ${ifd} unit 0`);
      commands.push(`delete interfaces ${ifd} native-vlan-id`);
      commands.push(`delete interfaces ${ifd} mtu`);
      commands.push(`delete switch-options voip interface ${ifl}`);
      commands.push(`delete protocols lldp-med interface ${ifd}`);
      commands.push(`set interfaces ${ifd} ether-options 802.3ad ${aeName(item.bundleAe)}`);
      return;
    }

    if (baselineInterfaceNames.has(ifd)) {
      const cleanupUnits = Array.from(new Set(["0", unit]));
      cleanupUnits.forEach((cleanupUnit) => {
        commands.push(`delete interfaces ${ifd} unit ${cleanupUnit} family ethernet-switching`);
        commands.push(`delete interfaces ${ifd} unit ${cleanupUnit} family inet`);
        commands.push(`delete interfaces ${ifd} unit ${cleanupUnit} family inet6`);
      });
      commands.push(`delete interfaces ${ifd} vlan-tagging`);
      commands.push(`delete interfaces ${ifd} native-vlan-id`);
      commands.push(`delete switch-options voip interface ${ifl}`);
      commands.push(`delete protocols lldp-med interface ${ifd}`);
    }

    if (item.description) {
      commands.push(`set interfaces ${ifd} description "${item.description.replace(/"/g, '\\"')}"`);
    }
    if (item.mtu) {
      commands.push(`set interfaces ${ifd} mtu ${item.mtu}`);
    }

    if ((item.portType || "l2") === "l3") {
      commands.push(`delete interfaces ${ifd}`);
      if (item.description) {
        commands.push(`set interfaces ${ifd} description "${item.description.replace(/"/g, '\\"')}"`);
      }
      if (item.mtu) {
        commands.push(`set interfaces ${ifd} mtu ${item.mtu}`);
      }
      if (String(unit) !== "0") {
        commands.push(`delete interfaces ${ifd} unit 0`);
      } else {
        commands.push(`delete interfaces ${ifd} unit 0 family ethernet-switching`);
      }
      commands.push(`delete interfaces ${ifd} native-vlan-id`);
      if (String(unit) !== "0" || item.nativeVlan) {
        commands.push(`set interfaces ${ifd} vlan-tagging`);
      } else {
        commands.push(`delete interfaces ${ifd} vlan-tagging`);
      }
      if (String(unit) !== "0") {
        commands.push(`set interfaces ${ifd} unit ${unit} vlan-id ${item.l3VlanId}`);
      }
      if (item.nativeVlan) {
        commands.push(`set interfaces ${ifd} native-vlan-id ${item.nativeVlan}`);
      }
      if ((item.ipv4Mode || "static") === "dhcp") {
        commands.push(`set interfaces ${ifd} unit ${unit} family inet dhcp`);
      } else {
        splitCsv(item.ipAddresses).forEach((address) => {
          commands.push(`set interfaces ${ifd} unit ${unit} family inet address ${address}`);
        });
      }
      splitCsv(item.ipv6Addresses).forEach((address) => {
        commands.push(`set interfaces ${ifd} unit ${unit} family inet6 address ${address}`);
      });
      return;
    }

    commands.push(`set interfaces ${ifd} unit ${unit} family ethernet-switching interface-mode ${item.mode}`);
    if (item.nativeVlan) {
      commands.push(`set interfaces ${ifd} native-vlan-id ${item.nativeVlan}`);
    }

    if (item.mode === "access") {
      commands.push(`set interfaces ${ifd} unit ${unit} family ethernet-switching vlan members ${item.accessVlan}`);
    } else {
      splitCsv(item.trunkVlans).forEach((vlan) => {
        commands.push(`set interfaces ${ifd} unit ${unit} family ethernet-switching vlan members ${vlan}`);
      });
    }

    if (item.voice.enabled) {
      commands.push(`set switch-options voip interface ${ifl} vlan ${item.voice.vlan}`);
      if (item.voice.forwardingClass) {
        commands.push(`set switch-options voip interface ${ifl} forwarding-class ${item.voice.forwardingClass}`);
      }
      if (item.voice.lldpMed) {
        commands.push(`set protocols lldp-med interface ${ifd}`);
      }
    }
  });

  if (config.aggregate?.modified !== false && config.aggregate?.deviceCount) {
    commands.push(`set chassis aggregated-devices ethernet device-count ${config.aggregate.deviceCount}`);
  }

  (config.aggregate?.interfaces || []).filter((item) => item.modified !== false).forEach((item) => {
    const ifd = aeName(item.number);
    const unit = (item.portType || "none") === "l3" ? String(item.unit || "0") : "0";
    commands.push(`delete interfaces ${ifd} unit ${unit} family ethernet-switching`);
    commands.push(`delete interfaces ${ifd} unit ${unit} family inet`);
    commands.push(`delete interfaces ${ifd} unit ${unit} family inet6`);
    if (item.lacpMode && item.lacpMode !== "none") {
      commands.push(`set interfaces ${ifd} aggregated-ether-options lacp ${item.lacpMode}`);
    } else {
      commands.push(`delete interfaces ${ifd} aggregated-ether-options lacp`);
    }
    if (item.description) {
      commands.push(`set interfaces ${ifd} description "${item.description.replace(/"/g, '\\"')}"`);
    }
    if (item.mtu) {
      commands.push(`set interfaces ${ifd} mtu ${item.mtu}`);
    }
    if ((item.portType || "none") === "none") {
      return;
    }
    if ((item.portType || "l2") === "l3") {
      if (String(unit) !== "0" || item.nativeVlan) {
        commands.push(`set interfaces ${ifd} vlan-tagging`);
      }
      if (String(unit) !== "0") {
        commands.push(`set interfaces ${ifd} unit ${unit} vlan-id ${item.l3VlanId}`);
      }
      if (item.nativeVlan) {
        commands.push(`set interfaces ${ifd} native-vlan-id ${item.nativeVlan}`);
      }
      if ((item.ipv4Mode || "static") === "dhcp") {
        commands.push(`set interfaces ${ifd} unit ${unit} family inet dhcp`);
      } else {
        splitCsv(item.ipAddresses).forEach((address) => {
          commands.push(`set interfaces ${ifd} unit ${unit} family inet address ${address}`);
        });
      }
      splitCsv(item.ipv6Addresses).forEach((address) => {
        commands.push(`set interfaces ${ifd} unit ${unit} family inet6 address ${address}`);
      });
      return;
    }
    commands.push(`set interfaces ${ifd} unit 0 family ethernet-switching interface-mode ${item.mode}`);
    if (item.nativeVlan) {
      commands.push(`set interfaces ${ifd} native-vlan-id ${item.nativeVlan}`);
    }
    if (item.mode === "access") {
      commands.push(`set interfaces ${ifd} unit 0 family ethernet-switching vlan members ${item.accessVlan}`);
    } else {
      splitCsv(item.trunkVlans).forEach((vlan) => {
        commands.push(`set interfaces ${ifd} unit 0 family ethernet-switching vlan members ${vlan}`);
      });
    }
  });

  if (spanningTree.modified !== false && ["none", "rstp", "vstp"].includes(spanningTree.mode)) {
    commands.push("delete protocols rstp");
    commands.push("delete protocols vstp");
  }

  if (spanningTree.modified !== false && spanningTree.mode === "rstp") {
    commands.push(`set protocols rstp bridge-priority ${normalizeBridgePriority(spanningTree.rstpPriority) || "32768"}`);
    if (spanningTree.bpduBlockOnEdge) {
      commands.push("set protocols rstp bpdu-block-on-edge");
    }
    edgeInterfaces.forEach((item) => {
      commands.push(`set protocols rstp interface ${item.ifd} edge`);
    });
  }

  if (spanningTree.modified !== false && spanningTree.mode === "vstp") {
    if (spanningTree.bpduBlockOnEdge) {
      commands.push("set protocols vstp bpdu-block-on-edge");
    }
    (spanningTree.vstpGroups || []).forEach((group) => {
      splitCsv(group.vlans).forEach((vlan) => {
        commands.push(`set protocols vstp vlan ${vstpVlanId(vlan)} bridge-priority ${normalizeBridgePriority(group.priority) || "32768"}`);
      });
    });
    edgeInterfaces.forEach((item) => {
      if (item.vlan) {
        commands.push(`set protocols vstp vlan ${vstpVlanId(item.vlan)} interface ${item.ifd} edge`);
      }
    });
  }

  if (config.lldp.modified !== false && config.lldp.enabled) {
    const targets = splitCsv(config.lldp.interfaces || "all");
    targets.forEach((target) => {
      commands.push(`set protocols lldp interface ${target}`);
      if (config.lldp.med) {
        commands.push(`set protocols lldp-med interface ${target === "all" ? "all" : target}`);
      }
    });
  }

  config.staticRoutes.filter((route) => route.modified !== false).forEach((route) => {
    const base = route.routingInstance
      ? `set routing-instances ${route.routingInstance} routing-options static route`
      : "set routing-options static route";
    commands.push(`${base} ${route.prefix} next-hop ${route.nextHop}`);
    if (route.qualifiedNextHop) {
      commands.push(`${base} ${route.prefix} qualified-next-hop ${route.qualifiedNextHop} preference ${route.qualifiedPreference || "10"}`);
    }
  });

  if (virtualChassis.modified !== false) {
    if (virtualChassis.noSplitDetection) {
      commands.push("set virtual-chassis no-split-detection");
    } else {
      commands.push("delete virtual-chassis no-split-detection");
    }
    if (virtualChassis.preprovisioned) {
      commands.push("set virtual-chassis preprovisioned");
      (virtualChassis.members || []).forEach((member) => {
        commands.push(`set virtual-chassis member ${member.memberId} serial-number ${member.serialNumber}`);
        commands.push(`set virtual-chassis member ${member.memberId} role ${member.role || "line-card"}`);
      });
    } else {
      commands.push("delete virtual-chassis preprovisioned");
    }
  }

  config.interfaces.filter((item) => item.modified !== false && item.portSpeed).forEach((item) => {
    const match = String(item.name || "").match(/^[a-z]+-(\d+)\/(\d+)\/(\d+)/i);
    if (!match) {
      return;
    }
    const [, fpc, pic, port] = match;
    const speed = String(item.portSpeed).toLowerCase();
    const portNumber = Number(port);
    const groupedSpeed = String(item.speedProfile || "").includes("group4")
      && Number.isInteger(portNumber)
      && portNumber >= 0
      && portNumber <= 47
      && ["1g", "10g", "25g"].includes(speed);
    const targetPorts = groupedSpeed
      ? Array.from({ length: 4 }, (_unused, offset) => Math.floor(portNumber / 4) * 4 + offset)
      : [portNumber];
    targetPorts.forEach((targetPort) => {
      commands.push(`set chassis fpc ${fpc} pic ${pic} port ${targetPort} speed ${speed}`);
    });
  });

  if (config.management.modified !== false && config.management.enabled) {
    commands.push("set system management-instance");
    commands.push(`delete interfaces ${config.management.interfaceName} unit 0 family inet`);
    commands.push(`delete interfaces ${config.management.interfaceName} unit 0 family inet6`);
    if ((config.management.ipv4Mode || "static") === "dhcp") {
      commands.push(`set interfaces ${config.management.interfaceName} unit 0 family inet dhcp`);
    } else {
      commands.push(`set interfaces ${config.management.interfaceName} unit 0 family inet address ${config.management.address}`);
    }
    if (config.management.gateway) {
      commands.push(`set routing-instances mgmt_junos routing-options static route 0.0.0.0/0 next-hop ${config.management.gateway}`);
    }
  }

  (config.management.users || []).filter((user) => user.modified !== false).forEach((user) => {
    const className = user.privilege || "read-only";
    const escapedPassword = junosEncryptedPassword(user.password).replace(/"/g, '\\"');
    commands.push(`set system login user ${user.username} class ${className}`);
    commands.push(`set system login user ${user.username} authentication encrypted-password "${escapedPassword}"`);
  });

  const system = config.management.system || defaultConfig.management.system;
  if (system.modified !== false) {
    if (system.hostName) {
      commands.push(`set system host-name ${system.hostName}`);
    }
    commands.push("delete system name-server");
    splitCsv(system.nameServers).forEach((server) => {
      commands.push(`set system name-server ${server}`);
    });
    commands.push("delete system ntp");
    splitCsv(system.ntpServers).forEach((server) => {
      commands.push(`set system ntp server ${server}`);
    });
    commands.push(`set system time-zone ${system.timeZone || "Asia/Bangkok"}`);
  }

  return Array.from(new Set(commands));
}

export function interfaceFromSnapshot(item, edgeInterfaces = new Set()) {
  const vlanMembers = item.vlanMembers || [];
  const mode = item.portType === "l3" ? "access" : item.mode || (vlanMembers.length > 1 ? "trunk" : "access");
  const physicalInterface = item.physicalName || stripUnit(item.name);
  return {
    name: physicalInterface,
    description: item.description || "",
    portType: item.portType === "l3" ? "l3" : "l2",
    unit: item.unit || "0",
    mode,
    accessVlan: mode === "access" ? vlanMembers[0] || "" : "",
    trunkVlans: mode === "trunk" ? vlanMembers.join(",") : "",
    nativeVlan: item.nativeVlan || "",
    l3VlanId: item.vlanId || "",
    ipv4Mode: "static",
    ipAddresses: (item.addresses || []).join(","),
    ipv6Addresses: (item.inet6Addresses || []).join(","),
    mtu: item.mtu || "",
    bundleAe: item.aeBundle ? item.aeBundle.replace(/^ae/i, "") : "",
    stpEdge: edgeInterfaces.has(physicalInterface),
    modified: false,
    voice: {
      enabled: false,
      vlan: "",
      forwardingClass: "assured-forwarding",
      lldpMed: true
    }
  };
}

export function aggregateFromSnapshot(item) {
  const base = interfaceFromSnapshot(item);
  return {
    ...base,
    number: String(item.name || "").replace(/^ae/i, ""),
    lacpMode: item.lacpMode || "none",
    portType: item.portType === "unknown" ? "none" : base.portType,
    mode: item.portType === "unknown" ? "" : base.mode,
    modified: false
  };
}

export function configFromSnapshot(snapshot, previousConfig = defaultConfig) {
  const physicalInterfaces = Array.from(
    new Map((snapshot.configuredInterfaces || []).map((item) => [item.physicalName || stripUnit(item.name), item])).values()
  );
  const baselineInterfaces = Array.from(new Set(physicalInterfaces.map((item) => item.physicalName || stripUnit(item.name))));
  const edgeInterfaces = new Set(snapshot.stpEdgeInterfaces || []);
  const aggregateInterfaces = (snapshot.aggregateInterfaces || []).map(aggregateFromSnapshot);
  const baselineAggregateInterfaces = Array.from(new Set(aggregateInterfaces.map((item) => aeName(item.number)).filter(Boolean)));

  return {
    ...previousConfig,
    baseline: {
      vlans: (snapshot.vlans || []).map((vlan) => vlan.name),
      interfaces: baselineInterfaces,
      aggregateInterfaces: baselineAggregateInterfaces
    },
    vlans: (snapshot.vlans || []).map((vlan) => ({
      name: vlan.name,
      vlanId: vlan.vlanId,
      description: vlan.description || "",
      modified: false
    })),
    interfaces: physicalInterfaces.map((item) => interfaceFromSnapshot(item, edgeInterfaces)),
    irbs: (snapshot.irbs || []).map((irb) => ({
      ...irb,
      previousAddress: irb.address || "",
      dhcpServer: { enabled: false, poolName: "", network: "", rangeLow: "", rangeHigh: "", router: "", dns: "", ...(irb.dhcpServer || {}) },
      dhcpRelay: { enabled: false, servers: "", ...(irb.dhcpRelay || {}) },
      modified: false
    })),
    staticRoutes: parseStaticRoutes(snapshot.staticRoutesText),
    management: {
      ...(previousConfig.management || defaultConfig.management),
      ...(snapshot.management || {}),
      modified: false,
      system: {
        ...defaultConfig.management.system,
        ...((previousConfig.management || {}).system || {}),
        ...((snapshot.management || {}).system || {}),
        modified: false
      },
      users: []
    },
    lldp: snapshot.lldp || previousConfig.lldp || defaultConfig.lldp,
    virtualChassis: snapshot.virtualChassisConfig || previousConfig.virtualChassis || defaultConfig.virtualChassis,
    spanningTree: snapshot.spanningTree || previousConfig.spanningTree || defaultConfig.spanningTree,
    aggregate: {
      deviceCount: snapshot.aggregateDeviceCount || "",
      interfaces: aggregateInterfaces,
      modified: false
    }
  };
}

export const defaultSpanningTree = {
  mode: "none",
  rstpPriority: "32768",
  bpduBlockOnEdge: false,
  vstpGroups: [],
  modified: false
};

export const defaultConfig = {
  vlans: [],
  interfaces: [],
  irbs: [],
  staticRoutes: [],
  management: {
    enabled: false,
    interfaceName: "me0",
    ipv4Mode: "static",
    address: "",
    gateway: "",
    revertTimer: "10",
    modified: false,
    system: {
      hostName: "",
      nameServers: "",
      activeNameServers: [],
      ntpServers: "",
      timeZone: "Asia/Bangkok",
      modified: false
    },
    users: []
  },
  lldp: {
    enabled: false,
    med: false,
    interfaces: "all",
    modified: false
  },
  virtualChassis: {
    preprovisioned: false,
    noSplitDetection: false,
    members: [],
    modified: false
  },
  spanningTree: defaultSpanningTree,
  aggregate: {
    deviceCount: "",
    interfaces: [],
    modified: false
  }
};
