const { Client } = require("ssh2");

const EOM = "]]>]]>";
const JUNOS_CAPABILITY = "urn:ietf:params:netconf:base:1.0";
const HELLO_PATTERN = /<(?:[A-Za-z_][\w.-]*:)?hello(?:\s|>)/i;

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeConnection(connection) {
  return {
    host: String(connection.host || "").trim(),
    port: Number(connection.port || 830),
    username: String(connection.username || "").trim(),
    password: String(connection.password || ""),
    readyTimeout: Number(connection.readyTimeout || 15000)
  };
}

function rpc(messageId, body) {
  return `<rpc message-id="${messageId}" xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">${body}</rpc>${EOM}`;
}

function commandRpc(messageId, command) {
  return rpc(messageId, `<command format="text">${escapeXml(command)}</command>`);
}

function commandXmlRpc(messageId, command) {
  return rpc(messageId, `<command>${escapeXml(command)}</command>`);
}

function parseTag(text, tag) {
  const qualifiedTag = `(?:[A-Za-z_][\\w.-]*:)?${tag}`;
  const match = text.match(new RegExp(`<${qualifiedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${qualifiedTag}>`, "i"));
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function decodeXml(value = "") {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function collectBlocks(text, tag) {
  const blocks = [];
  const qualifiedTag = `(?:[A-Za-z_][\\w.-]*:)?${tag}`;
  const pattern = new RegExp(`<${qualifiedTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${qualifiedTag}>`, "gi");
  let match;
  while ((match = pattern.exec(text))) {
    blocks.push(match[0]);
  }
  return blocks;
}

function collectTagValues(text, tag) {
  return collectBlocks(text, tag).map((block) => parseTag(block, tag)).filter(Boolean);
}

function parseInventoryModel(inventoryXml) {
  const chassisBlock = inventoryXml.match(/<chassis[\s\S]*?<\/chassis>/i)?.[0] || inventoryXml;
  return parseTag(chassisBlock, "description") || parseTag(chassisBlock, "name");
}

function parseRpcError(response) {
  if (!/<(?:[A-Za-z_][\w.-]*:)?rpc-error/i.test(response)) {
    return null;
  }

  const errorBlocks = collectBlocks(response, "rpc-error");
  for (const errorBlock of errorBlocks.length ? errorBlocks : [response]) {
    const severity = parseTag(errorBlock, "error-severity");
    if (severity.toLowerCase() === "warning") {
      continue;
    }
    const message = parseTag(errorBlock, "error-message");
    const path = parseTag(errorBlock, "error-path");
    const badElement = parseTag(errorBlock, "bad-element");
    return [severity, message, path || (badElement ? `bad element: ${badElement}` : "")].filter(Boolean).join(": ") || "NETCONF RPC returned an error.";
  }

  return null;
}

function isNetconfHello(message) {
  return HELLO_PATTERN.test(message || "");
}

function isLikelyJunos(osName, release) {
  const haystack = `${osName} ${release}`.toLowerCase();
  return haystack.includes("junos") || /\d+\.\d+[rx]/i.test(String(release || ""));
}

function isExModel(model) {
  return /^ex/i.test(String(model || "").trim());
}

function parseRoutingEngine(text) {
  const output = outputText(text);
  const idle = output.match(/Idle\s+(\d+)\s+percent/i);
  const cpu = idle ? Math.max(0, Math.min(100, 100 - Number(idle[1]))) : null;
  const model = output.match(/Model\s+(\S+)/i)?.[1] || "";
  const uptime = output.match(/Uptime\s+(.+)/i)?.[1]?.trim() || "";
  const memory = output.match(/Memory utilization\s+(\d+)\s+percent/i)?.[1] || "";

  return {
    cpuPercent: cpu,
    model,
    uptime,
    memoryPercent: memory
  };
}

function parseEnvironment(text) {
  const output = outputText(text);
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sectionLines = (className, itemPatterns = []) => {
    const rows = [];
    let collecting = false;
    const classPattern = new RegExp(`^${className}\\b`, "i");
    lines.forEach((line) => {
      if (/^(Power|Temp|Fans?)\b/i.test(line)) {
        collecting = classPattern.test(line);
      }
      if (!collecting) {
        return;
      }
      if (itemPatterns.length === 0 || itemPatterns.some((pattern) => pattern.test(line))) {
        rows.push(line);
      }
    });
    return rows;
  };
  const statusFromItems = (items) => {
    const statuses = items.map((item) => String(item.status || "").toLowerCase());
    const measurements = items.map((item) => String(item.measurement || "").toLowerCase());
    if (!items.length) {
      return "Unknown";
    }
    if (statuses.some((status) => /\b(failed|fail|alarm|bad|down|offline|overheat|hot)\b/i.test(status))
      || measurements.some((measurement) => /\b(high|over|alarm|failed|fail)\b/i.test(measurement))) {
      return "Alert";
    }
    if (statuses.some((status) => status === "absent" || status === "unknown")) {
      return "Warning";
    }
    if (statuses.every((status) => /\b(ok|online|normal|good|present|check)\b/i.test(status))) {
      return "OK";
    }
    return "Warning";
  };
  const statusFromLines = (rows) => {
    if (!rows.length) {
      return "Unknown";
    }
    if (rows.some((line) => /\b(failed|fail|alarm|bad|down|offline|overheat|hot)\b/i.test(line))) {
      return "Alert";
    }
    if (rows.some((line) => /\b(ok|online|normal|good|present|check)\b/i.test(line))) {
      return "OK";
    }
    return "Unknown";
  };

  const fanLines = sectionLines("Fans?", [/\bfan\b/i]);
  const powerLines = sectionLines("Power", [/\bpower\b/i, /\bpsu\b/i, /\bpem\b/i]);
  const tempLines = sectionLines("Temp", [/\btemperature\b/i, /\bthermal\b/i, /\btemp\b/i, /\bsensor\b/i]);
  const itemFromLine = (line) => {
    const match = line.match(/^(?:(Power|Temp|Fans?)\s+)?(.+?)\s{2,}(OK|Absent|Present|Failed|Offline|Online|Check|Testing|Unknown|[A-Za-z-]+)(?:\s{2,}(.+))?$/i);
    if (!match) {
      return { item: line, status: "Unknown", measurement: "" };
    }
    return {
      item: match[2].trim(),
      status: match[3].trim(),
      measurement: (match[4] || "").trim()
    };
  };

  const powerItems = powerLines.map(itemFromLine);
  const fanItems = fanLines.map(itemFromLine);
  const temperatureItems = tempLines.map(itemFromLine);

  return {
    fan: statusFromItems(fanItems),
    power: statusFromItems(powerItems),
    temperature: statusFromItems(temperatureItems) || statusFromLines(tempLines),
    powerItems,
    fanItems,
    temperatureItems,
    text: output.trim()
  };
}

function firstConfigBlock(xml, tag) {
  const config = xml.match(/<configuration[\s\S]*?<\/configuration>/i)?.[0] || xml;
  const qualifiedTag = `(?:[A-Za-z_][\\w.-]*:)?${tag}`;
  return config.match(new RegExp(`<${qualifiedTag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${qualifiedTag}>`, "i"))?.[0] || "";
}

function outputText(xml) {
  return parseTag(xml, "output") || decodeXml(xml.replace(/<[^>]+>/g, "\n"));
}

function physicalName(interfaceName) {
  return String(interfaceName || "").replace(/\.\d+$/, "");
}

function interfaceCoordinates(interfaceName) {
  const match = String(interfaceName || "").match(/^(?:ge|mge|xe|et|vcp)-(\d+)\/(\d+)\/(\d+)/i);
  if (!match) {
    return null;
  }
  return {
    fpc: match[1],
    pic: match[2],
    port: match[3],
    key: `${match[1]}/${match[2]}/${match[3]}`
  };
}

function interfaceSortKey(name) {
  const match = String(name || "").match(/^([a-z]+)-(\d+)\/(\d+)\/(\d+)/i);
  if (!match) {
    return { prefix: String(name || ""), fpc: 999, pic: 999, port: 999 };
  }
  const prefixOrder = { mge: 0, ge: 1, xe: 2, et: 3, vcp: 4 };
  return {
    prefix: prefixOrder[match[1].toLowerCase()] ?? 99,
    fpc: Number(match[2]),
    pic: Number(match[3]),
    port: Number(match[4])
  };
}

function compareInterfaces(a, b) {
  const left = interfaceSortKey(a?.name || a);
  const right = interfaceSortKey(b?.name || b);
  return left.fpc - right.fpc
    || left.pic - right.pic
    || left.port - right.port
    || left.prefix - right.prefix
    || String(a?.name || a).localeCompare(String(b?.name || b), undefined, { numeric: true });
}

function configurationText(xml) {
  return parseTag(xml, "configuration-set") || parseTag(xml, "configuration-text") || outputText(xml).trim();
}

function inferSwitchingMode(mode, vlanMembers) {
  if (mode) {
    return mode;
  }
  return (vlanMembers || []).length > 1 ? "trunk" : "access";
}

function parseInterfaceConfig(configXml) {
  const interfacesBlock = firstConfigBlock(configXml, "interfaces");
  const configs = new Map();

  collectBlocks(interfacesBlock, "interface").forEach((block) => {
    const name = parseTag(block, "name");
    if (!name || !/^(?:(?:ge|xe|et|mge)-\d+\/\d+\/\d+|ae\d+)$/i.test(name)) {
      return;
    }

    const unitBlocks = collectBlocks(block, "unit");
    const units = unitBlocks.map((unitBlock) => {
      const unit = parseTag(unitBlock, "name") || "0";
      const ethBlock = unitBlock.match(/<ethernet-switching>[\s\S]*?<\/ethernet-switching>/i)?.[0] || "";
      const inetBlock = unitBlock.match(/<inet(?:\s[^>]*)?>[\s\S]*?<\/inet>/i)?.[0] || "";
      const inet6Block = unitBlock.match(/<inet6(?:\s[^>]*)?>[\s\S]*?<\/inet6>/i)?.[0] || "";
      const vlanBlock = ethBlock.match(/<vlan>[\s\S]*?<\/vlan>/i)?.[0] || "";
      const vlanMembers = collectTagValues(vlanBlock, "members");

      return {
        unit,
        portType: ethBlock ? "l2" : inetBlock ? "l3" : "unknown",
        mode: inferSwitchingMode(parseTag(ethBlock, "interface-mode"), vlanMembers),
        vlanMembers,
        addresses: collectTagValues(inetBlock, "name"),
        inet6Addresses: collectTagValues(inet6Block, "name"),
        vlanId: parseTag(unitBlock, "vlan-id")
      };
    });

    const firstUnit = units.find((unit) => unit.portType !== "unknown") || units[0] || {
      unit: "0",
      portType: "unknown",
      mode: "",
      vlanMembers: [],
      addresses: [],
      vlanId: ""
    };

    const physicalConfig = {
      name,
      description: parseTag(block, "description"),
      unit: firstUnit.unit,
      portType: firstUnit.portType,
      mode: firstUnit.mode,
      vlanMembers: firstUnit.vlanMembers,
      addresses: firstUnit.addresses,
      inet6Addresses: firstUnit.inet6Addresses || [],
      vlanId: firstUnit.vlanId,
      nativeVlan: parseTag(block, "native-vlan-id"),
      mtu: parseTag(block, "mtu"),
      aeBundle: parseTag(block, "bundle"),
      lacpMode: hasLeaf(block.match(/<lacp>[\s\S]*?<\/lacp>/i)?.[0] || "", "active")
        ? "active"
        : hasLeaf(block.match(/<lacp>[\s\S]*?<\/lacp>/i)?.[0] || "", "passive")
          ? "passive"
          : "",
      units
    };

    configs.set(name, physicalConfig);
    units.forEach((unitConfig) => {
      configs.set(`${name}.${unitConfig.unit}`, {
        ...physicalConfig,
        name: `${name}.${unitConfig.unit}`,
        physicalName: name,
        unit: unitConfig.unit,
        portType: unitConfig.portType,
        mode: unitConfig.mode,
        vlanMembers: unitConfig.vlanMembers,
        addresses: unitConfig.addresses,
        inet6Addresses: unitConfig.inet6Addresses || [],
        vlanId: unitConfig.vlanId,
        nativeVlan: physicalConfig.nativeVlan
      });
    });
  });

  return configs;
}

function parseConfigVlans(configXml) {
  const vlansBlock = firstConfigBlock(configXml, "vlans");
  const vlans = collectBlocks(vlansBlock, "vlan")
    .map((block) => ({
      name: parseTag(block, "name"),
      vlanId: parseTag(block, "vlan-id"),
      l3Interface: parseTag(block, "l3-interface"),
      description: parseTag(block, "description")
    }))
    .filter((vlan) => vlan.name && vlan.vlanId);

  return new Map(vlans.map((vlan) => [vlan.name, vlan]));
}

function parseIrbConfig(configXml, configVlanMap) {
  const interfacesBlock = firstConfigBlock(configXml, "interfaces");
  const dhcpConfig = parseDhcpConfig(configXml);
  const vlanByIrb = new Map(
    Array.from(configVlanMap.values())
      .filter((vlan) => vlan.l3Interface)
      .map((vlan) => [vlan.l3Interface.replace(/^irb\./i, ""), vlan.name])
  );
  const irbBlock = collectBlocks(interfacesBlock, "interface").find((block) => parseTag(block, "name") === "irb") || "";

  return collectBlocks(irbBlock, "unit").map((unitBlock) => {
    const unit = parseTag(unitBlock, "name") || "0";
    const inetBlock = unitBlock.match(/<inet(?:\s[^>]*)?>[\s\S]*?<\/inet>/i)?.[0] || "";
    const irbName = `irb.${unit}`;
    const server = dhcpConfig.serverByInterface.get(irbName) || { enabled: false, poolName: "", network: "", rangeLow: "", rangeHigh: "", router: "", dns: "" };
    const relay = dhcpConfig.relayByInterface.get(irbName) || { enabled: false, servers: "" };
    return {
      unit,
      vlan: vlanByIrb.get(unit) || "",
      address: collectTagValues(inetBlock, "name")[0] || "",
      mtu: parseTag(inetBlock, "mtu"),
      description: parseTag(unitBlock, "description"),
      dhcpServer: server,
      dhcpRelay: relay
    };
  }).filter((irb) => irb.unit || irb.address || irb.vlan);
}

function parseDhcpConfig(configXml) {
  const accessBlock = firstConfigBlock(configXml, "access");
  const systemBlock = firstConfigBlock(configXml, "system");
  const forwardingBlock = firstConfigBlock(configXml, "forwarding-options");
  const pools = collectBlocks(accessBlock, "pool").map((poolBlock) => {
    const familyBlock = poolBlock.match(/<family(?:\s[^>]*)?>[\s\S]*?<\/family>/i)?.[0] || "";
    const inetBlock = familyBlock.match(/<inet(?:\s[^>]*)?>[\s\S]*?<\/inet>/i)?.[0] || familyBlock;
    const rangeBlock = collectBlocks(inetBlock, "range")[0] || "";
    const dhcpAttr = collectBlocks(inetBlock, "dhcp-attributes")[0] || "";
    return {
      enabled: true,
      poolName: parseTag(poolBlock, "name"),
      network: parseTag(inetBlock, "network"),
      rangeLow: parseTag(rangeBlock, "low"),
      rangeHigh: parseTag(rangeBlock, "high"),
      router: collectTagValues(dhcpAttr, "router")[0] || "",
      dns: collectTagValues(dhcpAttr, "name-server").join(",")
    };
  }).filter((pool) => pool.poolName || pool.network);

  const serverByInterface = new Map();
  const dhcpLocalServerBlock = collectBlocks(systemBlock, "dhcp-local-server")[0] || "";
  collectBlocks(dhcpLocalServerBlock, "group").forEach((groupBlock) => {
    const interfaces = collectBlocks(groupBlock, "interface")
      .map((block) => parseTag(block, "name"))
      .filter(Boolean);
    interfaces.forEach((ifName, index) => {
      const pool = pools[index] || pools[0] || {};
      serverByInterface.set(ifName, { enabled: true, ...pool });
    });
  });

  const relayByInterface = new Map();
  const relayBlock = collectBlocks(forwardingBlock, "dhcp-relay")[0] || "";
  const serverGroups = new Map();
  collectBlocks(relayBlock, "server-group").forEach((groupBlock) => {
    serverGroups.set(parseTag(groupBlock, "name"), collectTagValues(groupBlock, "address"));
  });
  collectBlocks(relayBlock, "group").forEach((groupBlock) => {
    const activeGroup = parseTag(groupBlock, "active-server-group") || parseTag(relayBlock, "active-server-group");
    const servers = serverGroups.get(activeGroup) || [];
    collectBlocks(groupBlock, "interface")
      .map((block) => parseTag(block, "name"))
      .filter(Boolean)
      .forEach((ifName) => relayByInterface.set(ifName, { enabled: true, servers: servers.join(",") }));
  });

  return { serverByInterface, relayByInterface };
}

function parseManagementConfig(configXml) {
  const systemBlock = firstConfigBlock(configXml, "system");
  const interfacesBlock = firstConfigBlock(configXml, "interfaces");
  const routingInstancesBlock = firstConfigBlock(configXml, "routing-instances");
  const managementInterfaces = collectBlocks(interfacesBlock, "interface")
    .map((block) => {
      const name = parseTag(block, "name");
      if (!["me0", "vme"].includes(name)) {
        return null;
      }
      const unitBlock = collectBlocks(block, "unit").find((unit) => (parseTag(unit, "name") || "0") === "0") || "";
      const inetBlock = unitBlock.match(/<inet(?:\s[^>]*)?>[\s\S]*?<\/inet>/i)?.[0] || "";
      return {
        name,
        ipv4Mode: hasLeaf(inetBlock, "dhcp") ? "dhcp" : "static",
        address: collectTagValues(inetBlock, "name")[0] || ""
      };
    })
    .filter(Boolean);
  const selected = managementInterfaces.find((item) => item.address || item.ipv4Mode === "dhcp") || managementInterfaces[0] || {};
  const mgmtInstance = collectBlocks(routingInstancesBlock, "instance").find((block) => parseTag(block, "name") === "mgmt_junos") || "";
  const defaultRoute = collectBlocks(mgmtInstance, "route").find((block) => parseTag(block, "name") === "0.0.0.0/0") || "";

  return {
    enabled: hasLeaf(systemBlock, "management-instance"),
    interfaceName: selected.name || "me0",
    ipv4Mode: selected.ipv4Mode || "static",
    address: selected.address || "",
    gateway: collectTagValues(defaultRoute, "next-hop")[0] || "",
    system: parseSystemSettings(systemBlock),
    modified: false
  };
}

function parseSystemSettings(systemBlock) {
  const ntpBlock = collectBlocks(systemBlock, "ntp")[0] || "";
  const nameServers = collectBlocks(systemBlock, "name-server")
    .map((block) => parseTag(block, "name") || parseTag(block, "name-server"))
    .filter(Boolean);
  const ntpServers = collectBlocks(ntpBlock, "server")
    .map((block) => parseTag(block, "name"))
    .filter(Boolean);

  return {
    hostName: parseTag(systemBlock, "host-name"),
    nameServers: nameServers.join(","),
    activeNameServers: nameServers,
    ntpServers: ntpServers.join(","),
    timeZone: parseTag(systemBlock, "time-zone") || "Asia/Bangkok",
    modified: false
  };
}

function parseRoutingInstances(configXml) {
  const routingInstancesBlock = firstConfigBlock(configXml, "routing-instances");
  const names = collectBlocks(routingInstancesBlock, "instance")
    .map((block) => parseTag(block, "name"))
    .filter(Boolean)
    .filter((name) => name !== "__juniper_private1__");
  return Array.from(new Set(["", ...names]));
}

function parseAggregateDeviceCount(configXml) {
  const chassisBlock = firstConfigBlock(configXml, "chassis");
  return parseTag(chassisBlock, "device-count");
}

function hasLeaf(block, tag) {
  const qualifiedTag = `(?:[A-Za-z_][\\w.-]*:)?${tag}`;
  return new RegExp(`<${qualifiedTag}(?:\\s[^>]*)?\\s*/>|<${qualifiedTag}(?:\\s[^>]*)?>`, "i").test(block || "");
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

function parseSpanningTreeConfig(configXml, configVlanMap) {
  const protocolsBlock = firstConfigBlock(configXml, "protocols");
  const vlanNameById = new Map(Array.from(configVlanMap.values()).map((vlan) => [vlan.vlanId, vlan.name]));
  const edgeInterfaces = new Set();
  const rstpBlock = protocolsBlock.match(/<rstp>[\s\S]*?<\/rstp>/i)?.[0] || "";
  const vstpBlock = protocolsBlock.match(/<vstp>[\s\S]*?<\/vstp>/i)?.[0] || "";

  if (vstpBlock) {
    const groups = new Map();
    collectBlocks(vstpBlock, "vlan").forEach((vlanBlock) => {
      const vlanId = parseTag(vlanBlock, "name");
      const vlanName = vlanNameById.get(vlanId) || vlanId;
      const priority = normalizeBridgePriority(parseTag(vlanBlock, "bridge-priority")) || "32768";
      groups.set(priority, [...(groups.get(priority) || []), vlanName]);
      collectBlocks(vlanBlock, "interface").forEach((interfaceBlock) => {
        if (hasLeaf(interfaceBlock, "edge")) {
          edgeInterfaces.add(physicalName(parseTag(interfaceBlock, "name")));
        }
      });
    });

    return {
      config: {
        mode: "vstp",
        rstpPriority: "32768",
        bpduBlockOnEdge: hasLeaf(vstpBlock, "bpdu-block-on-edge"),
        vstpGroups: Array.from(groups.entries()).map(([priority, vlans]) => ({
          priority,
          vlans: vlans.join(",")
        })),
        modified: false
      },
      edgeInterfaces: Array.from(edgeInterfaces)
    };
  }

  if (rstpBlock) {
    collectBlocks(rstpBlock, "interface").forEach((interfaceBlock) => {
      if (hasLeaf(interfaceBlock, "edge")) {
        edgeInterfaces.add(physicalName(parseTag(interfaceBlock, "name")));
      }
    });

    return {
      config: {
        mode: "rstp",
        rstpPriority: normalizeBridgePriority(parseTag(rstpBlock, "bridge-priority")) || "32768",
        bpduBlockOnEdge: hasLeaf(rstpBlock, "bpdu-block-on-edge"),
        vstpGroups: [],
        modified: false
      },
      edgeInterfaces: Array.from(edgeInterfaces)
    };
  }

  return {
    config: {
      mode: "none",
      rstpPriority: "32768",
      bpduBlockOnEdge: false,
      vstpGroups: [],
      modified: false
    },
    edgeInterfaces: []
  };
}

function parseLldpConfig(configXml) {
  const protocolsBlock = firstConfigBlock(configXml, "protocols");
  const lldpBlock = protocolsBlock.match(/<lldp>[\s\S]*?<\/lldp>/i)?.[0] || "";
  const lldpMedBlock = protocolsBlock.match(/<lldp-med>[\s\S]*?<\/lldp-med>/i)?.[0] || "";
  const lldpInterfaces = collectBlocks(lldpBlock, "interface")
    .map((block) => parseTag(block, "name"))
    .filter(Boolean);
  const lldpMedInterfaces = collectBlocks(lldpMedBlock, "interface")
    .map((block) => parseTag(block, "name"))
    .filter(Boolean);
  const interfaces = lldpInterfaces.length > 0 ? lldpInterfaces : lldpMedInterfaces;

  return {
    enabled: lldpInterfaces.length > 0,
    med: lldpMedInterfaces.length > 0,
    interfaces: interfaces.includes("all") || interfaces.length === 0 ? "all" : interfaces.join(","),
    modified: false
  };
}

function parseShowInterfacesTerse(text, interfaceConfigs) {
  const rows = [];
  let lastRow = null;
  const supportedPort = /^(ge|mge|xe|et|vcp)-/i;

  outputText(text)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .forEach((line) => {
      if (!line.trim() || /^Interface\s+Admin\s+Link/i.test(line)) {
        return;
      }

      const trimmed = line.trim();
      if (/^\S+/.test(line) && /^\S+\s+\S+\s+\S+/.test(trimmed)) {
        const parts = trimmed.split(/\s+/);
        const [name, adminStatus, operStatus, proto, local, remote] = parts;
        if (!supportedPort.test(name) || /\.16386$/i.test(name)) {
          lastRow = null;
          return;
        }
        const config = interfaceConfigs.get(name) || interfaceConfigs.get(physicalName(name));
        const row = {
          name,
          physicalName: physicalName(name),
          adminStatus: adminStatus || "unknown",
          operStatus: operStatus || "unknown",
          proto: proto || "",
          local: local || "",
          remote: remote || "",
          description: config?.description || "",
          config: config || null
        };
        rows.push(row);
        lastRow = row;
        return;
      }

      if (lastRow && trimmed) {
        lastRow.proto = [lastRow.proto, trimmed.split(/\s+/)[0]].filter(Boolean).join(", ");
      }
    });

  return rows.sort(compareInterfaces);
}

function parseVirtualChassisPorts(text) {
  const ports = [];
  let fpc = "0";

  outputText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line) => {
      if (!line || /^Interface\s+Type/i.test(line) || /^PIC\s*\/\s*Port/i.test(line) || /^[-\s]+$/.test(line)) {
        return;
      }

      const fpcMatch = line.match(/^(?:fpc|member)\s*[:#-]?\s*(\d+)\s*:?\s*$/i) || line.match(/^FPC\s+(\d+)/i);
      if (fpcMatch) {
        fpc = fpcMatch[1];
        return;
      }

      const parts = line.split(/\s+/);
      const portMatch = parts[0]?.match(/^(?:vcp-)?(?:(\d+)\/)?(\d+)\/(\d+)$/i);
      if (!portMatch) {
        return;
      }

      const rowFpc = portMatch[1] || fpc;
      const pic = portMatch[2];
      const port = portMatch[3];
      ports.push({
        fpc: rowFpc,
        pic,
        port,
        key: `${rowFpc}/${pic}/${port}`,
        interface: `vcp-${rowFpc}/${pic}/${port}`,
        type: parts[1] || "",
        trunk: parts[2] || "",
        status: parts[3] || parts[2] || "",
        speed: parts[4] || "",
        neighbor: parts.slice(5).join(" "),
        raw: line
      });
    });

  return ports;
}

function parseChassisHardwarePorts(text, existingPorts = []) {
  const output = outputText(text);
  const existingNames = new Set(existingPorts.map((port) => physicalName(port.name)));
  const ports = [];
  let currentFpc = "0";

  output.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    const fpcMatch = line.match(/^FPC\s+(\d+)/i);
    if (fpcMatch) {
      currentFpc = fpcMatch[1];
      return;
    }

    const picMatch = line.match(/^PIC\s+(\d+)\b.*?(\d+)x(.+)$/i);
    if (!picMatch) {
      return;
    }
    const pic = picMatch[1];
    const count = Number(picMatch[2]);
    const description = picMatch[3];
    let prefix = "ge";
    if (/25G/i.test(description)) {
      prefix = "et";
    } else if (/10G/i.test(description) && !/Base-T/i.test(description)) {
      prefix = "xe";
    } else if (/2\.5G/i.test(description)) {
      prefix = "mge";
    }

    const startPort = pic === "0" && prefix === "ge" && count === 32 ? 16 : 0;
    for (let index = 0; index < count; index += 1) {
      const name = `${prefix}-${currentFpc}/${pic}/${startPort + index}`;
      if (existingNames.has(name)) {
        continue;
      }
      ports.push({
        name,
        physicalName: name,
        adminStatus: "unknown",
        operStatus: "absent",
        proto: "",
        local: "",
        remote: "",
        description,
        speed: description,
        config: null,
        synthetic: true
      });
    }
  });

  if (/EX4100-48MP/i.test(output)) {
    for (let port = 0; port <= 15; port += 1) {
      const name = `mge-0/0/${port}`;
      if (!existingNames.has(name) && !ports.some((item) => item.name === name)) {
        ports.push({
          name,
          physicalName: name,
          adminStatus: "unknown",
          operStatus: "absent",
          proto: "",
          local: "",
          remote: "",
          description: "100M/1G/2.5G Base-T",
          speed: "100M/1G/2.5G",
          config: null,
          synthetic: true
        });
      }
    }
  }

  return ports.sort(compareInterfaces);
}

function parseOpticsDiagnostics(text) {
  const output = outputText(text);
  const optics = new Map();
  let current = null;
  output.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    const interfaceMatch = line.match(/^Physical interface:\s+(\S+)/i) || line.match(/^([a-z]+-\d+\/\d+\/\d+)\s*$/i);
    if (interfaceMatch) {
      current = {
        interface: physicalName(interfaceMatch[1]),
        module: "",
        wavelength: "",
        txPower: "",
        rxPower: "",
        temperature: "",
        voltage: "",
        raw: []
      };
      optics.set(current.interface, current);
      return;
    }
    if (!current || !line) {
      return;
    }
    current.raw.push(line);
    const fields = [
      ["module", /(?:module|transceiver|optic).*?(?:type|present)?\s*[:=]\s*(.+)$/i],
      ["wavelength", /wavelength\s*[:=]\s*(.+)$/i],
      ["txPower", /(?:laser )?output power\s*[:=]\s*(.+)$/i],
      ["rxPower", /(?:receiver )?signal average optical power\s*[:=]\s*(.+)$/i],
      ["temperature", /(?:laser )?temperature\s*[:=]\s*(.+)$/i],
      ["voltage", /(?:laser )?bias current\s*[:=]\s*(.+)$/i]
    ];
    fields.forEach(([key, pattern]) => {
      const match = line.match(pattern);
      if (match && !current[key]) {
        current[key] = match[1].trim();
      }
    });
  });
  return optics;
}

function parseShowVlans(text, configVlanMap) {
  const vlans = [];
  let currentVlan = null;

  outputText(text)
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || /^Routing instance\s+VLAN name/i.test(line) || /^Name\s+Tag/i.test(line) || /^VLAN\s+Name/i.test(line) || /^[-\s]+$/.test(line)) {
        return;
      }

      const parts = line.split(/\s+/);
      const vlanIdIndex = parts.findIndex((part, index) => index > 0 && /^\d{1,4}$/.test(part));
      if (vlanIdIndex < 1) {
        if (currentVlan && /^[a-z]+-\d+\/\d+\/\d+|^ae\d+|^irb|^vlan/i.test(line)) {
          currentVlan.interfaces.push(line.replace(/\*$/, ""));
        }
        return;
      }

      const name = parts[0] === "default-switch" && vlanIdIndex > 1 ? parts[1] : parts[0];
      const vlanId = parts[vlanIdIndex];
      const fromConfig = configVlanMap.get(name) || {};
      currentVlan = {
        name,
        vlanId,
        l3Interface: fromConfig.l3Interface || "",
        description: fromConfig.description || "",
        interfaces: []
      };
      vlans.push(currentVlan);
    });

  if (vlans.length > 0) {
    return vlans;
  }

  return Array.from(configVlanMap.values());
}

async function getDeviceSnapshot(connection) {
  return openNetconfSession(connection, async ({ send, close }) => {
    const [interfacesTerse, configuration, chassisHardware, opticsDiagnostics, virtualChassisPortsOutput, vlanAttempt, staticRouteConfigAttempt] = await Promise.all([
      send(rpc("show-interfaces-terse", '<get-interface-information format="text"><terse/></get-interface-information>')),
      send(rpc("configuration", "<get-configuration><configuration><interfaces/><vlans/><protocols/><chassis/><system/><routing-instances/><access/><forwarding-options/></configuration></get-configuration>")),
      send(commandRpc("show-chassis-hardware", "show chassis hardware")).catch(() => ""),
      send(commandRpc("show-interfaces-diagnostics-optics", "show interfaces diagnostics optics")).catch(() => ""),
      send(commandRpc("show-virtual-chassis-vc-port", "show virtual-chassis vc-port")).catch(() => ""),
      send(rpc("show-vlan", '<get-vlan-information format="text"/>')).catch((error) => error),
      send(rpc("static-route-config", '<get-configuration database="committed" format="set"><configuration><routing-options/><routing-instances/></configuration></get-configuration>')).catch(() => "")
    ]);
    const vlanOutput = vlanAttempt instanceof Error
      ? await send(rpc("show-vlans", '<get-vlan-information/>'))
      : vlanAttempt;
    const staticRouteConfig = staticRouteConfigAttempt || "";
    await close();

    const interfaceConfigs = parseInterfaceConfig(configuration);
    const configVlans = parseConfigVlans(configuration);
    const irbs = parseIrbConfig(configuration, configVlans);
    const management = parseManagementConfig(configuration);
    const spanningTree = parseSpanningTreeConfig(configuration, configVlans);
    const lldp = parseLldpConfig(configuration);
    const vlans = parseShowVlans(vlanOutput, configVlans);
    const tersePorts = parseShowInterfacesTerse(interfacesTerse, interfaceConfigs);
    const chassisPorts = parseChassisHardwarePorts(chassisHardware, tersePorts);
    const optics = parseOpticsDiagnostics(opticsDiagnostics);
    const virtualChassisPorts = parseVirtualChassisPorts(virtualChassisPortsOutput);
    const vcpByKey = new Map(virtualChassisPorts.map((port) => [port.key, port]));
    const ports = [...tersePorts, ...chassisPorts]
      .map((port) => {
        const coordinates = interfaceCoordinates(physicalName(port.name));
        const vcp = coordinates ? vcpByKey.get(coordinates.key) || null : null;
        return {
          ...port,
          optics: optics.get(physicalName(port.name)) || null,
          vcp
        };
      })
      .sort(compareInterfaces);

    return {
      ports,
      virtualChassisPorts,
      vlans,
      configuredInterfaces: Array.from(interfaceConfigs.values())
        .filter((item) => (item.portType !== "unknown" || item.aeBundle) && item.name === physicalName(item.name) && !/^ae\d+$/i.test(item.name))
        .sort(compareInterfaces),
      aggregateInterfaces: Array.from(interfaceConfigs.values())
        .filter((item) => item.portType !== "unknown" && /^ae\d+$/i.test(item.name))
        .sort(compareInterfaces),
      irbs,
      aggregateDeviceCount: parseAggregateDeviceCount(configuration),
      staticRoutesText: configurationText(staticRouteConfig).trim(),
      routingInstances: parseRoutingInstances(configuration),
      spanningTree: spanningTree.config,
      stpEdgeInterfaces: spanningTree.edgeInterfaces,
      lldp,
      management,
      fetchedAt: new Date().toISOString()
    };
  });
}

async function getActiveConfiguration(connection) {
  return openNetconfSession(connection, async ({ send, close }) => {
    const configuration = await send(rpc("active-configuration", '<get-configuration database="committed" format="set"/>'));
    await close();
    return configurationText(configuration);
  });
}

async function discardCandidateChanges(connection) {
  return openNetconfSession(connection, async ({ send, close }) => {
    let locked = false;
    try {
      await send(rpc("lock", "<lock><target><candidate/></target></lock>"));
      locked = true;
      await send(rpc("discard", "<discard-changes/>"));
      return { ok: true, message: "Candidate reverted to active configuration." };
    } finally {
      if (locked) {
        await send(rpc("unlock", "<unlock><target><candidate/></target></unlock>")).catch(() => null);
      }
      await close();
    }
  });
}

function openNetconfSession(connection, onReady) {
  const settings = normalizeConnection(connection);

  return new Promise((resolve, reject) => {
    if (!settings.host || !settings.username || !settings.password) {
      reject(new Error("Host, username, and password are required."));
      return;
    }

    const client = new Client();
    let streamRef;
    let buffer = "";
    let settled = false;
    let helloTimer;
    const pending = [];

    const cleanup = () => {
      clearTimeout(helloTimer);
      if (streamRef) {
        streamRef.removeAllListeners();
      }
      client.removeAllListeners();
      client.end();
    };

    const fail = (error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    };

    const send = (xml) =>
      new Promise((rpcResolve, rpcReject) => {
        pending.push({ resolve: rpcResolve, reject: rpcReject });
        streamRef.write(xml);
      });

    const close = () =>
      new Promise((closeResolve) => {
        if (!streamRef || streamRef.destroyed) {
          cleanup();
          closeResolve();
          return;
        }
        streamRef.write(rpc("close", "<close-session/>"));
        setTimeout(() => {
          cleanup();
          closeResolve();
        }, 250);
      });

    client
      .on("ready", () => {
        client.subsys("netconf", (err, stream) => {
          if (err) {
            fail(err);
            return;
          }

          streamRef = stream;
          helloTimer = setTimeout(() => {
            fail(new Error("NETCONF subsystem opened, but no server hello was received. Verify NETCONF over SSH is enabled on this switch."));
          }, settings.readyTimeout);
          stream
            .on("data", (chunk) => {
              buffer += chunk.toString("utf8");
              while (buffer.includes(EOM)) {
                const idx = buffer.indexOf(EOM);
                const message = buffer.slice(0, idx);
                buffer = buffer.slice(idx + EOM.length);

                if (isNetconfHello(message)) {
                  clearTimeout(helloTimer);
                  stream.write(`<hello xmlns="urn:ietf:params:xml:ns:netconf:base:1.0"><capabilities><capability>${JUNOS_CAPABILITY}</capability></capabilities></hello>${EOM}`);
                  if (!settled) {
                    settled = true;
                    Promise.resolve(onReady({ send, close }))
                      .then(resolve)
                      .catch(reject)
                      .finally(cleanup);
                  }
                  continue;
                }

                const next = pending.shift();
                if (next) {
                  const rpcError = parseRpcError(message);
                  if (rpcError) {
                    next.reject(new Error(rpcError));
                  } else {
                    next.resolve(message);
                  }
                }
              }
            })
            .on("error", fail)
            .on("close", () => {
              if (!settled) {
                fail(new Error("NETCONF session closed before it was ready."));
              }
            });
        });
      })
      .on("error", fail)
      .connect({
        host: settings.host,
        port: settings.port,
        username: settings.username,
        password: settings.password,
        readyTimeout: settings.readyTimeout,
        keepaliveInterval: 10000
      });
  });
}

async function connectAndInspect(connection) {
  return openNetconfSession(connection, async ({ send, close }) => {
    const [software, inventory, routingEngine, environment] = await Promise.all([
      send(rpc("software", "<get-software-information/>")),
      send(rpc("inventory", "<get-chassis-inventory/>")),
      send(rpc("show-routing-engine", '<get-route-engine-information format="text"/>')),
      send(commandRpc("show-chassis-environment", "show chassis environment")).catch(() => "")
    ]);
    await close();

    const osName = parseTag(software, "host-name") || "Junos";
    const release = parseTag(software, "junos-version") || parseTag(software, "package-information");
    const model = parseInventoryModel(inventory);
    const junos = isLikelyJunos(osName, release);
    const ex = isExModel(model);

    return {
      ok: junos && ex,
      osName,
      release,
      model,
      routingEngine: parseRoutingEngine(routingEngine),
      environment: parseEnvironment(environment),
      warnings: [
        junos ? "" : "Device software does not look like Junos OS from NETCONF system information.",
        ex ? "" : "Hardware model does not look like a Juniper EX switch. This prototype is intentionally scoped to EX."
      ].filter(Boolean)
    };
  });
}

async function getMonitoringOutput(connection, view) {
  const commands = {
    vlan: "show vlan",
    route: "show route",
    arp: "show arp",
    dhcpBinding: "show dhcp server binding",
    lacp: "show lacp interfaces",
    spanningTree: "show spanning-tree bridge"
  };
  const command = commands[view] || commands.vlan;
  return openNetconfSession(connection, async ({ send, close }) => {
    const output = await send(commandRpc(`monitor-${view || "vlan"}`, command));
    await close();
    return { view: view || "vlan", command, output: outputText(output).trim() };
  });
}

function sanitizeCliToken(value, label, { required = false, allowHostname = true } = {}) {
  const token = String(value || "").trim();
  if (!token) {
    if (required) {
      throw new Error(`${label} is required.`);
    }
    return "";
  }
  const pattern = allowHostname ? /^[A-Za-z0-9_.:/-]+$/ : /^[A-Za-z0-9_.:-]+$/;
  if (!pattern.test(token)) {
    throw new Error(`${label} contains unsupported characters.`);
  }
  return token;
}

function sanitizeFileName(value, label = "File name") {
  const fileName = String(value || "").trim();
  if (!fileName) {
    throw new Error(`${label} is required.`);
  }
  if (!/^[A-Za-z0-9_.+-]+$/.test(fileName) || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new Error(`${label} contains unsupported characters.`);
  }
  return fileName;
}

function sanitizeWholeNumber(value, label) {
  const token = String(value ?? "").trim();
  if (!/^\d+$/.test(token)) {
    throw new Error(`${label} must be a number.`);
  }
  return token;
}

function parseStorageOutput(text = "") {
  const lines = outputText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = lines
    .filter((line) => !/^Filesystem\b/i.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length < 6) {
        return null;
      }
      return {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        capacity: parts[4],
        mountedOn: parts.slice(5).join(" ")
      };
    })
    .filter(Boolean);
  return {
    rows,
    varTmp: rows.find((row) => row.mountedOn === "/var/tmp")
      || rows.find((row) => row.mountedOn.startsWith("/var"))
      || rows.find((row) => row.mountedOn === "/.mount")
      || rows.find((row) => row.mountedOn === "/")
      || rows[0]
      || null,
    raw: outputText(text).trim()
  };
}

function parseSftpEnabled(configText = "") {
  const output = outputText(configText);
  return /set\s+system\s+services\s+ssh\s+sftp-server\b/i.test(output)
    || /(^|\n)\s*sftp-server\s*;/i.test(output);
}

function buildTroubleshootCommand({ tool, source, destination, routingInstance }) {
  const target = sanitizeCliToken(destination, "Destination", { required: true });
  const sourceAddress = sanitizeCliToken(source, "Source");
  const instance = sanitizeCliToken(routingInstance, "Routing instance");
  const parts = [];

  if (tool === "ping") {
    parts.push("ping");
    if (instance) {
      parts.push("routing-instance", instance);
    }
    parts.push(target);
    if (sourceAddress) {
      parts.push("source", sourceAddress);
    }
    parts.push("count", "5");
    return parts.join(" ");
  }

  if (tool === "traceroute") {
    parts.push("traceroute", target, "no-resolve", "wait", "1", "ttl", "12");
    if (instance) {
      parts.push("routing-instance", instance);
    }
    if (sourceAddress) {
      parts.push("source", sourceAddress);
    }
    return parts.join(" ");
  }

  throw new Error("Unsupported testing tool.");
}

function formatTracerouteOutput(xml) {
  const resultBlock = collectBlocks(xml, "traceroute-results")[0] || "";
  if (!resultBlock) {
    return outputText(xml).trim();
  }
  const target = parseTag(resultBlock, "target-host") || parseTag(resultBlock, "target-ip");
  const lines = target ? [`traceroute to ${target}`] : ["traceroute"];
  collectBlocks(resultBlock, "hop").forEach((hopBlock) => {
    const ttl = parseTag(hopBlock, "ttl-value") || "?";
    const probes = collectBlocks(hopBlock, "probe-result").map((probeBlock) => {
      const ip = parseTag(probeBlock, "ip-address");
      const failure = parseTag(probeBlock, "probe-failure");
      const rtt = parseTag(probeBlock, "rtt");
      if (failure) {
        return "*";
      }
      return [ip || parseTag(hopBlock, "last-ip-address") || "*", rtt ? `${(Number(rtt) / 1000).toFixed(2)} ms` : ""].filter(Boolean).join(" ");
    });
    lines.push(`${ttl}  ${probes.join("  ") || "*"}`);
  });
  if (hasLeaf(resultBlock, "traceroute-success")) {
    lines.push("Traceroute success");
  }
  return lines.join("\n");
}

async function runDeviceAction(connection, action) {
  const requested = String(action?.type || "");
  return openNetconfSession(connection, async ({ send, close }) => {
    const sendWithTimeout = (xml, timeoutMs = 30000) =>
      Promise.race([
        send(xml),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Device action timed out. Refresh the session and try again if the switch is still reachable.")), timeoutMs);
        })
      ]);
    try {
      if (requested === "firmwarePrecheck") {
        const storageOutput = await sendWithTimeout(commandRpc("firmware-storage", "show system storage"), 20000);
        const sshConfigOutput = await sendWithTimeout(commandRpc("firmware-ssh-config", "show configuration system services ssh | display set"), 20000);
        const versionOutput = await sendWithTimeout(commandRpc("firmware-version", "show version"), 20000);
        const storage = parseStorageOutput(storageOutput);
        return {
          ok: true,
          action: requested,
          storage,
          sftpEnabled: parseSftpEnabled(sshConfigOutput),
          sshConfig: outputText(sshConfigOutput).trim(),
          version: outputText(versionOutput).trim()
        };
      }

      if (requested === "firmwareCleanStorage") {
        const command = "request system storage cleanup no-confirm";
        const output = await sendWithTimeout(commandRpc("firmware-clean-storage", command), 120000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Storage cleanup completed."
        };
      }

      if (requested === "firmwareInstall") {
        const fileName = sanitizeFileName(action.fileName, "Firmware package name");
        const command = `request system software add ${action.noValidate ? "no-validate " : ""}/var/tmp/${fileName}`;
        const output = await sendWithTimeout(commandRpc("firmware-install", command), 45 * 60 * 1000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Software install command completed."
        };
      }

      if (requested === "snapshotAlternate") {
        const allMembers = Boolean(action.allMembers);
        const command = `request system snapshot slice alternate${allMembers ? " all-members" : ""}`;
        const output = await sendWithTimeout(commandRpc("snapshot-alternate", command), 20 * 60 * 1000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Snapshot command completed."
        };
      }

      if (requested === "reboot") {
        const output = await sendWithTimeout(commandRpc("request-reboot", "request system reboot in 1"), 15000);
        return {
          ok: true,
          action: requested,
          command: "request system reboot in 1",
          output: outputText(output).trim() || "Reboot requested."
        };
      }

      if (requested === "virtualChassisMode") {
        const mode = String(action.mode || "").toLowerCase();
        const command = mode === "hgoe"
          ? "request virtual-chassis mode hgoe reboot"
          : mode === "higig"
            ? "request virtual-chassis mode hgoe disable reboot"
            : "";
        if (!command) {
          throw new Error("Unsupported Virtual Chassis mode action.");
        }
        const output = await sendWithTimeout(commandRpc(`vc-mode-${mode}`, command), 30000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Virtual Chassis mode command sent. The switch may reboot."
        };
      }

      if (requested === "virtualChassisNetworkPortMode") {
        const target = String(action.target || "").toLowerCase();
        const command = target === "network"
          ? "request virtual-chassis mode network-port reboot"
          : target === "vcp"
            ? "request virtual-chassis mode network-port disable reboot"
            : "";
        if (!command) {
          throw new Error("Unsupported Virtual Chassis network-port action.");
        }
        const output = await sendWithTimeout(commandRpc(`vc-network-port-${target}`, command), 30000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Virtual Chassis network-port command sent. The switch may reboot."
        };
      }

      if (requested === "virtualChassisPort") {
        const operation = String(action.operation || "").toLowerCase();
        if (!["set", "delete"].includes(operation)) {
          throw new Error("Unsupported Virtual Chassis port operation.");
        }
        const picSlot = sanitizeWholeNumber(action.picSlot, "PIC slot");
        const port = sanitizeWholeNumber(action.port, "Port");
        const command = `request virtual-chassis vc-port ${operation} pic-slot ${picSlot} port ${port}`;
        const output = await sendWithTimeout(commandRpc(`vc-port-${operation}-${picSlot}-${port}`, command), 30000);
        return {
          ok: true,
          action: requested,
          command,
          output: outputText(output).trim() || "Virtual Chassis port command completed."
        };
      }

      if (requested === "ping" || requested === "traceroute") {
        const command = buildTroubleshootCommand({ tool: requested, ...action });
        const rpcPayload = requested === "traceroute" ? commandXmlRpc(`tool-${requested}`, command) : commandRpc(`tool-${requested}`, command);
        const output = await sendWithTimeout(rpcPayload, requested === "traceroute" ? 20000 : 20000);
        return {
          ok: true,
          action: requested,
          command,
          output: (requested === "traceroute" ? formatTracerouteOutput(output) : outputText(output).trim()) || "No output returned."
        };
      }

      throw new Error("Unsupported device action.");
    } finally {
      await close();
    }
  });
}

async function loadAndMaybeCommit({ connection, setCommands, commit = false, confirmed = false, confirmTimeout = 10 }) {
  const commands = Array.isArray(setCommands) ? setCommands.filter(Boolean) : [];
  if (commands.length === 0) {
    throw new Error("No configuration commands were generated.");
  }

  return openNetconfSession(connection, async ({ send, close }) => {
    let locked = false;
    let candidateTouched = false;
    let committed = false;
    try {
      await send(rpc("lock", "<lock><target><candidate/></target></lock>"));
      locked = true;

      await send(
        rpc(
          "load",
          `<load-configuration action="set" format="text"><configuration-set>${escapeXml(commands.join("\n"))}</configuration-set></load-configuration>`
        )
      );
      candidateTouched = true;

      await send(rpc("commit-check", "<commit-configuration><check/></commit-configuration>"));

      if (commit) {
        const timeout = Math.max(1, Math.min(120, Number(confirmTimeout || 10)));
        const commitBody = confirmed
          ? `<commit-configuration><confirmed/><confirm-timeout>${timeout}</confirm-timeout><log>Mini J-Web EX prototype confirmed commit</log></commit-configuration>`
          : "<commit-configuration><log>Mini J-Web EX prototype commit</log></commit-configuration>";
        await send(rpc("commit", commitBody));
        committed = true;
      }

      return {
        ok: true,
        committed: commit,
        commandCount: commands.length,
        message: commit ? (confirmed ? `Commit confirmed started. Commit again within ${confirmTimeout || 10} minute(s) to keep changes.` : "Commit completed.") : "Commit check passed."
      };
    } finally {
      if (locked && candidateTouched && !committed) {
        await send(rpc("discard", "<discard-changes/>")).catch(() => null);
      }
      if (locked) {
        await send(rpc("unlock", "<unlock><target><candidate/></target></unlock>")).catch(() => null);
      }
      await close();
    }
  });
}

function commitCheckSetCommands(payload) {
  return loadAndMaybeCommit({ ...payload, commit: false });
}

function commitSetCommands(payload) {
  return loadAndMaybeCommit({ ...payload, commit: true });
}

module.exports = {
  connectAndInspect,
  getDeviceSnapshot,
  getActiveConfiguration,
  getMonitoringOutput,
  runDeviceAction,
  discardCandidateChanges,
  commitCheckSetCommands,
  commitSetCommands
};
