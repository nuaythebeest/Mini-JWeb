import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Cable,
  CheckCircle2,
  ClipboardCheck,
  CloudCog,
  Download,
  EthernetPort,
  FileCode2,
  Gauge,
  GitBranch,
  Layers3,
  List,
  LogOut,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Network,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  Settings,
  ShieldCheck,
  Terminal,
  Trash2,
  X,
  Upload
} from "lucide-react";
import { buildSetCommands, configFromSnapshot, defaultConfig, validateConfig } from "./configBuilder";
import "./styles.css";

function VlanIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 5v14M12 5v14M17 5v14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <circle cx="7" cy="7" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="17" cy="17" r="1.6" fill="currentColor" />
    </svg>
  );
}

function AggregateIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h6M13 7h6M5 17h6M13 17h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7v4.5c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="5" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SpanningTreeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7a7 7 0 0 1 10 0l1.5 1.5M17 17a7 7 0 0 1-10 0L5.5 15.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 4.5v4h-4M5.5 19.5v-4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IrbIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 18c4.5 0 5-12 14-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 6c4.5 0 5 12 14 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M16 4h4v4M16 20h4v-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="6" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="5" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LldpIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="5" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="19" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 10.5 6.8 8.2M14 10.5l3.2-2.3M10.5 14l-2.2 2.5M13.5 14l2.2 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "deviceAccess", label: "Device Access", icon: CloudCog },
  { id: "ports", label: "Ports", icon: List },
  { id: "virtualChassis", label: "Virtual Chassis", icon: Network },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "vlans", label: "VLANs", icon: Layers3 },
  { id: "interfaces", label: "Interfaces", icon: EthernetPort },
  { id: "speedSettings", label: "Speed Settings", icon: Cable },
  { id: "aggregate", label: "Aggregate Ethernet", icon: AggregateIcon },
  { id: "spanningTree", label: "Spanning Tree", icon: GitBranch },
  { id: "irb", label: "IRB", icon: Network },
  { id: "routing", label: "Routing", icon: Route },
  { id: "management", label: "Management", icon: ShieldCheck },
  { id: "lldp", label: "LLDP", icon: LldpIcon },
  { id: "commit", label: "Commit", icon: ClipboardCheck }
];

const forwardingClasses = ["", "best-effort", "assured-forwarding", "expedited-forwarding", "network-control"];
const bridgePriorities = Array.from({ length: 16 }, (_, index) => String(index * 4096));
const credentialsStorageKey = "mini-jweb-ex-connection";
const deviceProfilesStorageKey = "mini-jweb-ex-device-profiles";
const navigationCollapsedStorageKey = "mini-jweb-ex-navigation-collapsed";

function blankConnection() {
  return { host: "", port: "830", username: "", password: "", remember: false };
}

function normalizeConnectionProfile(profile = {}) {
  return {
    host: String(profile.host || "").trim(),
    port: String(profile.port || "830").trim() || "830",
    username: String(profile.username || "").trim(),
    password: String(profile.password || ""),
    remember: Boolean(profile.remember)
  };
}

function profileKey(profile = {}) {
  const normalized = normalizeConnectionProfile(profile);
  return `${normalized.username}@${normalized.host}:${normalized.port}`;
}

function profileLabel(profile = {}) {
  const normalized = normalizeConnectionProfile(profile);
  return `${normalized.host || "No host"}:${normalized.port || "830"}${normalized.username ? ` (${normalized.username})` : ""}`;
}

function loadDeviceProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(deviceProfilesStorageKey) || "[]");
    return Array.isArray(stored)
      ? stored.map(normalizeConnectionProfile).filter((item) => item.host)
      : [];
  } catch (_error) {
    return [];
  }
}

function saveDeviceProfiles(profiles) {
  localStorage.setItem(deviceProfilesStorageKey, JSON.stringify(profiles.map(normalizeConnectionProfile).filter((item) => item.host)));
}

function upsertDeviceProfile(profiles, profile) {
  const normalized = normalizeConnectionProfile({ ...profile, remember: true });
  if (!normalized.host) {
    return profiles;
  }
  const key = profileKey(normalized);
  const next = profiles.filter((item) => profileKey(item) !== key);
  return [normalized, ...next].slice(0, 12);
}

function actionStatusTone(message = "") {
  const value = String(message || "").toLowerCase();
  if (!value) {
    return "info";
  }
  if (/failed|error|warning|cancelled|canceled/.test(value)) {
    return "error";
  }
  if (/running|refreshing|reverting|loading|connecting/.test(value)) {
    return "info";
  }
  return "success";
}

function initialConnection() {
  const profiles = loadDeviceProfiles();
  if (profiles.length > 0) {
    return profiles[0];
  }
  try {
    const stored = JSON.parse(localStorage.getItem(credentialsStorageKey) || "{}");
    return normalizeConnectionProfile(stored);
  } catch (_error) {
    return blankConnection();
  }
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  const { value, ...rest } = props;
  return <input {...rest} value={value ?? ""} />;
}

function selectedVlans(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function VlanMultiPicker({ label, vlans, value, onChange }) {
  const selected = selectedVlans(value);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(selected);
  const [search, setSearch] = useState("");
  const filteredVlans = vlans.filter((vlan) => {
    const haystack = `${vlan.name} ${vlan.vlanId}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const selectedSet = new Set(draft);
  const allFilteredSelected = filteredVlans.length > 0 && filteredVlans.every((vlan) => selectedSet.has(vlan.name));
  const summary = selected.length === 0
    ? "Select VLANs"
    : selected.length === 1
      ? selected[0]
      : `${selected.length} VLANs selected`;

  function openPicker() {
    setDraft(selected);
    setSearch("");
    setOpen(true);
  }

  function toggle(name) {
    setDraft((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  function toggleFiltered() {
    if (allFilteredSelected) {
      const filteredNames = new Set(filteredVlans.map((vlan) => vlan.name));
      setDraft((current) => current.filter((name) => !filteredNames.has(name)));
      return;
    }
    setDraft((current) => Array.from(new Set([...current, ...filteredVlans.map((vlan) => vlan.name)])));
  }

  return (
    <div className="field vlan-picker">
      <span>{label}</span>
      <button type="button" className="vlan-picker-trigger" onClick={openPicker}>
        <span>{summary}</span>
        <small>{selected.length}</small>
      </button>
      {selected.length ? (
        <div className="vlan-chip-row">
          {selected.slice(0, 4).map((name) => <span key={name} className="vlan-chip">{name}</span>)}
          {selected.length > 4 ? <span className="vlan-chip">+{selected.length - 4}</span> : null}
        </div>
      ) : null}
      {open ? (
        <div className="vlan-popover">
          <div className="vlan-search">
            <TextInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
            <button type="button" className="icon" onClick={() => setSearch("")}>x</button>
          </div>
          <div className="vlan-picker-head">
            <label className="vlan-check-row">
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleFiltered} />
              <strong>Network Name</strong>
              <strong>VLAN ID</strong>
            </label>
          </div>
          <div className="vlan-picker-list">
            {filteredVlans.map((vlan) => (
              <label key={vlan.name} className="vlan-check-row">
                <input type="checkbox" checked={selectedSet.has(vlan.name)} onChange={() => toggle(vlan.name)} />
                <span>{vlan.name}</span>
                <span>{vlan.vlanId}</span>
              </label>
            ))}
            {filteredVlans.length === 0 ? <div className="empty-state">No VLANs match the search.</div> : null}
          </div>
          <div className="vlan-picker-actions">
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="primary" onClick={() => { onChange(draft.join(",")); setOpen(false); }}>Apply</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HelpTip({ text }) {
  return (
    <span className="help-tip" tabIndex="0">
      ?
      <span className="help-tip-bubble">{text}</span>
    </span>
  );
}

function defaultAccessVlan(configOrVlans) {
  const vlans = Array.isArray(configOrVlans) ? configOrVlans : configOrVlans?.vlans || [];
  return vlans.find((vlan) => vlan.name === "default")?.name || vlans[0]?.name || "default";
}

function newIrb() {
  return {
    unit: "",
    vlan: "",
    address: "",
    previousAddress: "",
    mtu: "",
    description: "",
    dhcpServer: { enabled: false, poolName: "", network: "", rangeLow: "", rangeHigh: "", router: "", dns: "" },
    dhcpRelay: { enabled: false, servers: "" },
    modified: true
  };
}

function physicalInterfaceName(value) {
  return String(value || "").replace(/\.\d+$/, "");
}

function portParts(name) {
  const match = String(name || "").match(/^[a-z]+-(\d+)\/(\d+)\/(\d+)/i);
  return {
    prefix: String(name || "").match(/^([a-z]+)-/i)?.[1]?.toLowerCase() || "",
    fpc: match?.[1] || "0",
    pic: match?.[2] || "0",
    port: match?.[3] || String(name || "")
  };
}

function compareInterfaceNames(a, b) {
  const left = portParts(a);
  const right = portParts(b);
  const prefixOrder = { mge: 0, ge: 1, xe: 2, et: 3, vcp: 4 };
  return Number(left.fpc) - Number(right.fpc)
    || Number(left.pic) - Number(right.pic)
    || Number(left.port) - Number(right.port)
    || (prefixOrder[left.prefix] ?? 99) - (prefixOrder[right.prefix] ?? 99)
    || String(a).localeCompare(String(b), undefined, { numeric: true });
}

function portTileOrder(a, b) {
  const left = Number(a.parts.port);
  const right = Number(b.parts.port);
  if (a.parts.pic === "0" && b.parts.pic === "0" && Number.isFinite(left) && Number.isFinite(right)) {
    return (left % 2) - (right % 2) || left - right;
  }
  return left - right || a.name.localeCompare(b.name, undefined, { numeric: true });
}

function frontPanelPortZone(name, deviceInfo) {
  const model = String(deviceInfo?.model || "").toLowerCase();
  const parts = portParts(name);
  const port = Number(parts.port);
  if (/^(ex4650|qfx5120-48y|qfx5110-48s)/.test(model) && parts.pic === "0" && port >= 48) {
    return "uplink";
  }
  if (/^qfx5120-32c/.test(model)) {
    return "uplink";
  }
  if (/^ex4400-24x/.test(model) && parts.pic === "0" && port >= 24) {
    return "uplink";
  }
  return parts.pic === "0" ? "access" : "uplink";
}

function groupFrontPanelPorts(frontPanelPorts, deviceInfo) {
  const groups = new Map();
  frontPanelPorts.forEach(([name, port]) => {
    const parts = portParts(name);
    const zone = frontPanelPortZone(name, deviceInfo);
    const fpcGroup = groups.get(parts.fpc) || new Map();
    const groupKey = `${parts.pic}:${zone}`;
    const items = fpcGroup.get(groupKey) || [];
    items.push({ name, port, parts, zone });
    fpcGroup.set(groupKey, items);
    groups.set(parts.fpc, fpcGroup);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([fpc, picMap]) => ({
      fpc,
      pics: Array.from(picMap.entries())
        .sort(([a], [b]) => {
          const [leftPic, leftZone] = a.split(":");
          const [rightPic, rightZone] = b.split(":");
          const zoneOrder = { access: 0, uplink: 1 };
          return Number(leftPic) - Number(rightPic) || (zoneOrder[leftZone] ?? 9) - (zoneOrder[rightZone] ?? 9);
        })
        .map(([groupKey, items]) => {
          const [pic, zone] = groupKey.split(":");
          return {
            key: groupKey,
            pic,
            rows: [
              items.sort(portTileOrder).filter((item) => Number(item.parts.port) % 2 === 0),
              items.sort(portTileOrder).filter((item) => Number(item.parts.port) % 2 !== 0)
            ].filter((row) => row.length > 0),
            layout: zone
          };
        })
    }));
}

function isDisplayableFrontPanelPort(name, deviceInfo) {
  const parts = portParts(name);
  if (parts.prefix === "vcp") {
    return false;
  }
  const model = String(deviceInfo?.model || "").toLowerCase();
  if (/^ex4300/.test(model) && parts.pic === "1" && Number(parts.port) > 1) {
    return false;
  }
  return true;
}

function usesSharedOpticalPortNames(model) {
  return /^(ex4650|qfx5120-48y|qfx5120-32c|qfx5110-48s|ex4400-48f|ex4400-24x)/.test(String(model || "").toLowerCase());
}

function physicalPortAliasKey(model, name) {
  const baseName = physicalInterfaceName(name);
  const parts = portParts(baseName);
  if (usesSharedOpticalPortNames(model) && ["ge", "xe", "et"].includes(parts.prefix)) {
    return `${parts.fpc}/${parts.pic}/${parts.port}`;
  }
  return baseName;
}

function preferredPortPrefixes(model, parts) {
  const normalized = String(model || "").toLowerCase();
  const port = Number(parts.port);
  if (/^qfx5120-32c/.test(normalized)) {
    return ["et", "xe", "ge"];
  }
  if (/^(ex4650|qfx5120-48y)/.test(normalized)) {
    return ["et", "xe", "ge"];
  }
  if (/^qfx5110-48s/.test(normalized)) {
    return port >= 48 ? ["et", "xe", "ge"] : ["xe", "ge", "et"];
  }
  if (/^ex4400-24x/.test(normalized)) {
    return port >= 24 ? ["et", "xe", "ge"] : ["xe", "ge", "et"];
  }
  if (/^ex4400-48f/.test(normalized)) {
    return port >= 48 ? ["et", "xe", "ge"] : ["xe", "ge", "et"];
  }
  return ["et", "xe", "ge"];
}

function portCandidateScore(model, candidate) {
  const port = candidate?.port || {};
  const parts = portParts(candidate?.name || port.name);
  const prefixes = preferredPortPrefixes(model, parts);
  const prefixRank = prefixes.includes(parts.prefix) ? prefixes.length - prefixes.indexOf(parts.prefix) : 0;
  const operRank = port.operStatus === "up" ? 60 : port.operStatus === "down" ? 45 : 0;
  return operRank
    + (port.synthetic ? 0 : 30)
    + (port.config ? 20 : 0)
    + prefixRank
    + (candidate?.name === port.name ? 2 : 0);
}

function preferPhysicalPortCandidate(model, current, candidate) {
  if (!current) {
    return candidate;
  }
  const currentScore = portCandidateScore(model, current);
  const candidateScore = portCandidateScore(model, candidate);
  if (candidateScore > currentScore) {
    return candidate;
  }
  if (candidateScore === currentScore && compareInterfaceNames(candidate.name, current.name) < 0) {
    return candidate;
  }
  return current;
}

const VC_PREPROVISION_MODELS = [
  "EX2300",
  "EX2300-C",
  "EX3400",
  "EX4000",
  "EX4100",
  "EX4100-F",
  "EX4300-48T",
  "EX4300-48P",
  "EX4300-48MP",
  "EX4400",
  "EX4400-24X",
  "EX4400-48F",
  "EX4650-48Y",
  "QFX5110",
  "QFX5120-32C",
  "QFX5120-48T",
  "QFX5120-48Y",
  "QFX5120-48YM"
];

function isQfxModel(model = "") {
  return /^qfx/i.test(String(model || "").trim());
}

function virtualChassisModeLabel(snapshot) {
  const mode = String(snapshot?.virtualChassis?.mode || "").toLowerCase();
  if (mode === "hgoe") {
    return "HGoE";
  }
  if (mode === "higig") {
    return "HiGig / Non-HGoE";
  }
  if (mode === "enabled") {
    return "Enabled / Non-HGoE platform";
  }
  return snapshot?.virtualChassis?.raw ? "Unknown from switch output" : "Not detected";
}

function isQfx5120_48YFamily(model = "") {
  return /^qfx5120-48ym?(?:-|$)/.test(String(model || "").toLowerCase());
}

function findChassisPic(deviceSnapshot, fpc, pic) {
  return (deviceSnapshot?.chassisPics || []).find((item) => String(item.fpc) === String(fpc) && String(item.pic) === String(pic)) || null;
}

function normalizedSpeed(value = "") {
  return String(value || "").trim().toLowerCase();
}

function speedPrefix(speed = "") {
  return { "1g": "ge", "10g": "xe", "25g": "et" }[normalizedSpeed(speed)] || "";
}

function speedFromPrefix(prefix = "") {
  return { ge: "1g", xe: "10g", et: "25g" }[String(prefix || "").toLowerCase()] || "";
}

function replaceInterfacePrefix(name, prefix) {
  return String(name || "").replace(/^(ge|xe|et)-/i, `${prefix}-`);
}

function speedSettingKey(item = {}) {
  return `${item.profile || ""}:${item.fpc}:${item.pic}:${item.leadPort}`;
}

function compactSpeedSettings(settings = []) {
  const byKey = new Map();
  settings.forEach((item) => {
    if (!item) {
      return;
    }
    byKey.set(speedSettingKey(item), item);
  });
  return Array.from(byKey.values());
}

function ex4400Em4sAutoDetects(release = "") {
  const parsed = parseJunosRelease(release);
  if (!parsed) {
    return null;
  }
  if (parsed.major > 25) return true;
  if (parsed.major === 25) return parsed.minor > 1 || (parsed.minor === 1 && parsed.revision >= 1);
  if (parsed.major === 24) {
    if (parsed.minor > 4) return true;
    if (parsed.minor === 4) return parsed.revision >= 2;
    if (parsed.minor === 2) return parsed.revision >= 2;
  }
  return false;
}

function classifyEx4400Pic2(pic = {}, release = "") {
  const description = String(pic?.description || "");
  if (/4x25|25G|SFP28|EM-4Y/i.test(description)) {
    return {
      profile: "ex4400-em-4y",
      enabled: true,
      speeds: ["1g", "10g", "25g"],
      defaultSpeed: "25g",
      message: "EX4400-EM-4Y uses one speed mode for all four PIC 2 ports."
    };
  }
  if (/4x10|10G\s*SFP|SFP\+|EM-4S/i.test(description)) {
    const autoDetect = ex4400Em4sAutoDetects(release);
    if (autoDetect === true) {
      return {
        profile: "ex4400-em-4s",
        enabled: false,
        speeds: [],
        defaultSpeed: "10g",
        message: `EX4400-EM-4S is auto-detect on Junos ${release || "this release"}; no speed setting is needed.`
      };
    }
    if (autoDetect === null) {
      return {
        profile: "ex4400-em-4s",
        enabled: false,
        speeds: [],
        defaultSpeed: "10g",
        message: "Junos release is unknown, so EX4400-EM-4S manual speed controls are disabled."
      };
    }
    return {
      profile: "ex4400-em-4s",
      enabled: true,
      speeds: ["1g", "10g"],
      defaultSpeed: "10g",
      message: "EX4400-EM-4S uses one speed mode for all four PIC 2 ports on this Junos release."
    };
  }
  return {
    profile: "auto-detect",
    enabled: false,
    speeds: [],
    defaultSpeed: "",
    message: `PIC 2 ${description || "module"} is treated as optic auto-detect or unsupported for chassis speed mode.`
  };
}

function speedTargets(deviceInfo = {}, deviceSnapshot = {}) {
  const model = String(deviceInfo?.model || "").toLowerCase();
  if (/^ex4650/.test(model) || isQfx5120_48YFamily(model)) {
    const fpcs = Array.from(new Set([
      ...(deviceSnapshot?.chassisPics || []).filter((pic) => String(pic.pic) === "0").map((pic) => String(pic.fpc)),
      ...(deviceSnapshot?.ports || []).map((port) => portParts(port.name).fpc).filter(Boolean)
    ])).sort((a, b) => Number(a) - Number(b));
    const members = fpcs.length ? fpcs : ["0"];
    return members.flatMap((fpc) => Array.from({ length: 12 }, (_unused, index) => {
      const leadPort = index * 4;
      return {
        key: `front-group4:${fpc}:0:${leadPort}`,
        profile: "front-group4",
        fpc,
        pic: "0",
        leadPort,
        ports: Array.from({ length: 4 }, (_item, offset) => leadPort + offset),
        enabled: true,
        speeds: ["1g", "10g", "25g"],
        defaultSpeed: "10g",
        title: `FPC ${fpc} ports ${leadPort}-${leadPort + 3}`,
        label: `FPC ${fpc} PIC 0 ports ${leadPort}-${leadPort + 3}`,
        note: "One chassis speed command on the lead port controls this four-port group."
      };
    }));
  }

  if (/^ex4400/.test(model)) {
    const pics = (deviceSnapshot?.chassisPics || []).filter((pic) => String(pic.pic) === "2");
    if (!pics.length) {
      return [];
    }
    return pics.map((pic) => {
      const profile = classifyEx4400Pic2(pic, deviceInfo?.release || "");
      return {
        key: `${profile.profile}:${pic.fpc}:2:0`,
        profile: profile.profile,
        fpc: String(pic.fpc),
        pic: "2",
        leadPort: 0,
        ports: [0, 1, 2, 3],
        enabled: profile.enabled,
        speeds: profile.speeds,
        defaultSpeed: profile.defaultSpeed,
        title: `FPC ${pic.fpc} PIC 2`,
        label: `FPC ${pic.fpc} PIC 2 ports 0-3`,
        note: profile.message
      };
    });
  }

  return [];
}

function targetForPort(deviceInfo = {}, deviceSnapshot = {}, parts = {}) {
  const port = Number(parts.port);
  return speedTargets(deviceInfo, deviceSnapshot).find((target) => {
    if (String(target.fpc) !== String(parts.fpc) || String(target.pic) !== String(parts.pic)) {
      return false;
    }
    return target.profile === "front-group4"
      ? port >= Number(target.leadPort) && port <= Number(target.leadPort) + 3
      : target.ports.includes(port);
  }) || null;
}

function speedSettingMatchesTarget(item = {}, target = {}) {
  return String(item.fpc) === String(target.fpc)
    && String(item.pic) === String(target.pic)
    && String(item.leadPort) === String(target.leadPort);
}

function speedForTarget(config = {}, target = {}) {
  const settings = compactSpeedSettings(config.speedSettings || []);
  return normalizedSpeed(settings.find((item) => speedSettingMatchesTarget(item, target))?.speed) || target.defaultSpeed || "";
}

function effectiveSpeedForPort(deviceInfo = {}, deviceSnapshot = {}, config = {}, name = "") {
  const parts = portParts(name);
  const target = targetForPort(deviceInfo, deviceSnapshot, parts);
  if (target) {
    return speedForTarget(config, target) || speedFromPrefix(parts.prefix) || target.defaultSpeed || "";
  }
  return speedFromPrefix(parts.prefix);
}

function effectiveInterfaceNameForDisplay(name, deviceInfo, deviceSnapshot, config) {
  const speed = effectiveSpeedForPort(deviceInfo, deviceSnapshot, config, name);
  const prefix = speedPrefix(speed);
  return prefix ? replaceInterfacePrefix(physicalInterfaceName(name), prefix) : physicalInterfaceName(name);
}

function eligibleVcPortsForModel(deviceInfo, deviceSnapshot) {
  const model = String(deviceInfo?.model || "").toLowerCase();
  const ports = (deviceSnapshot?.ports || [])
    .filter((port) => /^(ge|mge|xe|et)-/i.test(port.name || ""))
    .map((port) => {
      const parts = portParts(port.name);
      return {
        key: `${parts.fpc}/${parts.pic}/${parts.port}`,
        name: physicalInterfaceName(port.name),
        fpc: parts.fpc,
        picSlot: parts.pic,
        port: parts.port,
        prefix: parts.prefix
      };
    });
  const unique = Array.from(new Map(ports.map((port) => [port.key, port])).values())
    .sort((a, b) => Number(a.fpc) - Number(b.fpc) || Number(a.picSlot) - Number(b.picSlot) || Number(a.port) - Number(b.port));
  const fpcs = Array.from(new Set([
    ...unique.map((port) => port.fpc).filter(Boolean),
    ...(deviceSnapshot?.virtualChassis?.members || []).map((member) => member.memberId).filter(Boolean)
  ])).sort((a, b) => Number(a) - Number(b));
  const members = fpcs.length ? fpcs : ["0"];
  const makePort = (fpc, picSlot, port, prefix = "et") => {
    const key = `${fpc}/${picSlot}/${port}`;
    const existing = unique.find((item) => item.key === key);
    if (existing) {
      return existing;
    }
    return {
      key,
      name: `${prefix}-${fpc}/${picSlot}/${port}`,
      fpc: String(fpc),
      picSlot: String(picSlot),
      port: String(port),
      prefix
    };
  };
  const fixedRange = (picSlot, start, end, prefix = "et") => members.flatMap((fpc) => (
    Array.from({ length: end - start + 1 }, (_item, offset) => makePort(fpc, picSlot, start + offset, prefix))
  ));

  if (/^ex2300/.test(model)) {
    return fixedRange("1", 0, 1, "xe");
  }
  if (/^ex4000-8p/.test(model)) {
    return fixedRange("1", 2, 3, "xe");
  }
  if (/^ex4000/.test(model)) {
    return fixedRange("1", 0, 1, "xe");
  }
  if (/^ex4650/.test(model) || /^qfx5120-48ym?(?:-|$)/.test(model)) {
    return fixedRange("0", 48, 55, "et");
  }
  if (/^qfx5120-48t/.test(model)) {
    return fixedRange("0", 48, 53, "et");
  }
  if (/^qfx5120-32c/.test(model)) {
    return fixedRange("0", 0, 31, "et");
  }
  if (/^qfx5110/.test(model)) {
    return unique.filter((port) => ["xe", "et"].includes(port.prefix));
  }
  if (/^ex4100|^ex4400/.test(model)) {
    const uplinks = unique.filter((port) => port.picSlot !== "0");
    if (uplinks.length > 0) {
      return uplinks;
    }
    if (/^ex4100/.test(model)) {
      return ["1", "2"].flatMap((picSlot) => ["0", "1", "2", "3"].map((port) => ({
        key: `0/${picSlot}/${port}`,
        name: `uplink-0/${picSlot}/${port}`,
        fpc: "0",
        picSlot,
        port,
        prefix: "xe"
      })));
    }
  }
  return unique.filter((port) => port.picSlot !== "0" && ["xe", "et"].includes(port.prefix));
}

function configLabel(config) {
  if (!config) {
    return "Access default";
  }
  const bundleAe = config.aeBundle || (config.bundleAe ? `ae${config.bundleAe}` : "");
  if (bundleAe) {
    return `Member of ${bundleAe}`;
  }
  if (config.portType === "l3") {
    const unit = config.unit || "0";
    const addresses = config.addresses?.join(", ") || "";
    return `Layer 3 unit ${unit}${config.vlanId ? ` VLAN ${config.vlanId}` : ""}${addresses ? ` ${addresses}` : ""}`;
  }
  const members = config.vlanMembers || [];
  if ((config.mode || "access") === "trunk" && members.length > 3) {
    return `Layer 2 trunk ${members.slice(0, 3).join(", ")} +${members.length - 3}`;
  }
  return `Layer 2 ${config.mode || "access"}${members.length ? ` ${members.join(", ")}` : ""}`;
}

function configFullLabel(config) {
  if (!config) {
    return "Access default";
  }
  const bundleAe = config.aeBundle || (config.bundleAe ? `ae${config.bundleAe}` : "");
  if (bundleAe) {
    return `Member of ${bundleAe}`;
  }
  if (config.portType === "l3") {
    return configLabel(config);
  }
  const members = config.vlanMembers || [];
  return `Layer 2 ${config.mode || "access"}${members.length ? ` ${members.join(", ")}` : ""}`;
}

function opticsLabel(optics) {
  if (!optics) {
    return "Optics: none detected";
  }
  return [
    optics.module ? `Module: ${optics.module}` : "",
    optics.wavelength ? `Wavelength: ${optics.wavelength}` : "",
    optics.txPower ? `TX: ${optics.txPower}` : "",
    optics.rxPower ? `RX: ${optics.rxPower}` : "",
    optics.temperature ? `Temp: ${optics.temperature}` : "",
    optics.voltage ? `Bias/Voltage: ${optics.voltage}` : ""
  ].filter(Boolean).join("\n") || `Optics:\n${(optics.raw || []).slice(0, 8).join("\n")}`;
}

function statusTone(value) {
  const normalized = String(value || "").toLowerCase();
  if (["warning", "absent", "unknown"].includes(normalized)) {
    return "warn";
  }
  if (["alert", "failed", "fail", "down", "offline"].includes(normalized)) {
    return "alert";
  }
  return "";
}

function parseJunosRelease(release = "") {
  const match = String(release || "").match(/(\d+)\.(\d+)R(\d+)/i);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    revision: Number(match[3])
  };
}

function compareJunosRelease(left, right) {
  const a = parseJunosRelease(left);
  const b = parseJunosRelease(right);
  if (!a || !b) {
    return null;
  }
  for (const key of ["major", "minor", "revision"]) {
    if (a[key] > b[key]) return 1;
    if (a[key] < b[key]) return -1;
  }
  return 0;
}

function hgoeRequirementForModel(model = "") {
  const normalized = String(model || "").toLowerCase();
  if (isQfxModel(normalized)) {
    return {
      supported: false,
      minimum: "",
      defaultMode: "HiGig",
      note: "QFX models are treated as non-HGoE platforms in Mini J-Web EX guardrails."
    };
  }
  if (/^ex4100-h/.test(normalized)) {
    return {
      supported: true,
      minimum: "",
      defaultMode: "HGoE",
      note: "EX4100-H uses HGoE as the default Virtual Chassis mode. Verify exact release behavior before changing mode."
    };
  }
  if (/^ex4100(?:-|$)/.test(normalized)) {
    return {
      supported: true,
      minimum: "24.2R1",
      defaultMode: "HiGig",
      note: "EX4100 and EX4100-F require Junos OS 24.2R1 or later for HGoE Virtual Chassis support."
    };
  }
  if (/^ex4400-24x/.test(normalized)) {
    return {
      supported: true,
      minimum: "23.1R1",
      defaultMode: "HGoE",
      note: "EX4400-24X uses HGoE as the default Virtual Chassis mode."
    };
  }
  if (/^ex4400/.test(normalized)) {
    return {
      supported: true,
      minimum: "23.1R1",
      defaultMode: "HiGig",
      note: "EX4400 supports HGoE from Junos OS 23.1R1 when the installed hardware provides HGoE-capable VC/uplink ports; verify the module before changing mode."
    };
  }
  if (/^ex4000|^ex4650/.test(normalized)) {
    return {
      supported: false,
      minimum: "",
      defaultMode: "HiGig",
      note: "This model is treated as HiGig-only for Mini J-Web EX HGoE guardrails."
    };
  }
  return {
    supported: false,
    minimum: "",
    defaultMode: "Unknown",
    note: "Connect to a supported EX4100 or EX4400 model to enable HGoE guidance."
  };
}

function hgoeEligibility(deviceInfo) {
  const requirement = hgoeRequirementForModel(deviceInfo?.model);
  const release = deviceInfo?.release || "";
  const releaseCompare = requirement.minimum ? compareJunosRelease(release, requirement.minimum) : null;
  const releaseMeetsMinimum = !requirement.minimum || (releaseCompare !== null && releaseCompare >= 0);
  return {
    ...requirement,
    release,
    releaseKnown: Boolean(parseJunosRelease(release)),
    releaseMeetsMinimum,
    eligible: Boolean(requirement.supported && releaseMeetsMinimum)
  };
}

function virtualChassisCapability(deviceInfo = {}) {
  const model = String(deviceInfo?.model || "").toLowerCase();
  const release = deviceInfo?.release || "";
  const releaseKnown = Boolean(parseJunosRelease(release));
  const atLeast = (minimum) => {
    const comparison = compareJunosRelease(release, minimum);
    return comparison !== null && comparison >= 0;
  };
  const capability = {
    maxMembers: 10,
    maxMembersLabel: "10",
    warning: "",
    note: "Model supports standard Virtual Chassis member limits.",
    minReleaseForFullScale: ""
  };

  if (/^ex2300/.test(model)) {
    return { ...capability, maxMembers: 4, maxMembersLabel: "4", note: "EX2300 Virtual Chassis supports up to 4 members." };
  }
  if (/^ex4000/.test(model)) {
    return { ...capability, maxMembers: 6, maxMembersLabel: "6", note: "EX4000 Virtual Chassis supports up to 6 members." };
  }
  if (/^ex4650/.test(model)) {
    if (atLeast("20.1R1")) {
      return { ...capability, maxMembers: 4, maxMembersLabel: "4", minReleaseForFullScale: "20.1R1", note: "EX4650-48Y supports up to 4 members on Junos OS 20.1R1 or later." };
    }
    return {
      ...capability,
      maxMembers: 2,
      maxMembersLabel: releaseKnown ? "2" : "2 safe default",
      minReleaseForFullScale: "20.1R1",
      warning: releaseKnown ? "Upgrade to Junos OS 20.1R1 or later before planning more than 2 EX4650 members." : "Release is unknown, so Mini J-Web EX caps EX4650 planning to the safe 2-member limit.",
      note: "EX4650-48Y supports 2 members from Junos OS 19.3R1; 4 members require 20.1R1 or later."
    };
  }
  if (/^qfx5120-48ym/.test(model)) {
    if (atLeast("23.1R1")) {
      return { ...capability, maxMembers: 4, maxMembersLabel: "4", minReleaseForFullScale: "23.1R1", note: "QFX5120-48YM supports up to 4 members on Junos OS 23.1R1 or later. HGoE controls remain hidden for QFX." };
    }
    return {
      ...capability,
      maxMembers: 2,
      maxMembersLabel: releaseKnown ? "2" : "2 safe default",
      minReleaseForFullScale: "23.1R1",
      warning: releaseKnown ? "Upgrade to Junos OS 23.1R1 or later before planning more than 2 QFX5120-48YM members." : "Release is unknown, so Mini J-Web EX caps QFX5120-48YM planning to the safe 2-member limit.",
      note: "QFX5120-48YM four-member support is release gated at Junos OS 23.1R1."
    };
  }
  if (/^qfx5120-(48y|48t|32c)/.test(model)) {
    return { ...capability, maxMembers: 2, maxMembersLabel: "2", note: "QFX5120 Virtual Chassis is capped at 2 members for this model." };
  }
  if (/^qfx5110/.test(model)) {
    return { ...capability, maxMembers: 10, maxMembersLabel: "10", note: "QFX5110 Virtual Chassis supports up to 10 members." };
  }
  if (/^ex3400|^ex4100|^ex4300|^ex4400|^ex4600/.test(model)) {
    return { ...capability, maxMembers: 10, maxMembersLabel: "10", note: "This EX family supports up to 10 Virtual Chassis members." };
  }
  return {
    ...capability,
    maxMembersLabel: "10 default",
    warning: "Model-specific VC limits are unknown. Mini J-Web EX uses the generic 10-member validation ceiling."
  };
}

function parseStorageSize(value = "") {
  const match = String(value || "").trim().match(/^([\d.]+)([KMGTP]?)(?:i?B)?$/i);
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) {
    return null;
  }
  const units = { "": 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4, P: 1024 ** 5 };
  return amount * (units[match[2].toUpperCase()] || 1);
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = value;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current >= 10 || unitIndex === 0 ? current.toFixed(0) : current.toFixed(1)} ${units[unitIndex]}`;
}

function parseStaticRouteRows(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^set\s+(?:routing-instances\s+(\S+)\s+)?routing-options\s+static\s+route\s+(\S+)\s+(?:next-hop|qualified-next-hop)\s+(\S+)/);
      if (!match) {
        return null;
      }
      return {
        instance: match[1] || "default",
        route: match[2],
        nextHop: match[3]
      };
    })
    .filter(Boolean);
}

function interfaceCandidateLabel(item) {
  if (!item) {
    return "No candidate";
  }
  if (item.bundleAe) {
    return `Member of ae${item.bundleAe}`;
  }
  if (item.portType === "l3") {
    return `Layer 3 unit ${item.unit || "0"}${item.ipAddresses || item.ipv6Addresses ? ` ${[item.ipAddresses, item.ipv6Addresses].filter(Boolean).join(", ")}` : ""}`;
  }
  if (item.mode === "trunk") {
    return `Layer 2 trunk${item.trunkVlans ? ` ${selectedVlans(item.trunkVlans).join(", ")}` : ""}`;
  }
  return `Layer 2 access${item.accessVlan ? ` ${item.accessVlan}` : ""}`;
}

function aggregateCandidateLabel(item) {
  const lacp = item?.lacpMode && item.lacpMode !== "none" ? `LACP ${item.lacpMode}` : "No LACP";
  if (!item || item.portType === "none") {
    return `AE shell only, ${lacp}`;
  }
  return `${interfaceCandidateLabel(item)}, ${lacp}`;
}

function newInterface(vlanName = "") {
  return {
    name: "",
    description: "",
    mtu: "",
    portType: "l2",
    unit: "0",
    mode: "access",
    accessVlan: vlanName,
    trunkVlans: "",
    nativeVlan: "",
    l3VlanId: "",
    ipv4Mode: "static",
    ipAddresses: "",
    ipv6Addresses: "",
    stpEdge: false,
    bundleAe: "",
    modified: true,
    voice: { enabled: false, vlan: "", forwardingClass: "assured-forwarding", lldpMed: true }
  };
}

function newAggregate(vlanName = "") {
  return {
    ...newInterface(vlanName),
    number: "",
    name: "",
    portType: "none",
    mode: "",
    accessVlan: "",
    trunkVlans: "",
    lacpMode: "active"
  };
}

function replaceVlanReferences(config, fromName, toName) {
  if (!fromName || !toName || fromName === toName) {
    return config;
  }

  const replaceList = (value) => selectedVlans(value).map((name) => (name === fromName ? toName : name)).join(",");

  return {
    ...config,
    interfaces: config.interfaces.map((item) => ({
      ...item,
      accessVlan: item.accessVlan === fromName ? toName : item.accessVlan,
      trunkVlans: replaceList(item.trunkVlans),
      voice: {
        ...item.voice,
        vlan: item.voice?.vlan === fromName ? toName : item.voice?.vlan
      }
    })),
    irbs: config.irbs.map((irb) => ({
      ...irb,
      vlan: irb.vlan === fromName ? toName : irb.vlan
    })),
    spanningTree: {
      ...config.spanningTree,
      vstpGroups: (config.spanningTree?.vstpGroups || []).map((group) => ({
        ...group,
        vlans: selectedVlans(group.vlans).map((name) => (name === fromName ? toName : name)).join(",")
      }))
    }
  };
}

function vlanUsageWarnings(config) {
  const vlanNames = new Set((config.vlans || []).map((vlan) => vlan.name).filter(Boolean));
  const usage = new Map();
  const addUse = (vlanName, target, role) => {
    if (!vlanName || vlanNames.has(vlanName)) {
      return;
    }
    const entries = usage.get(vlanName) || [];
    entries.push({ target, role });
    usage.set(vlanName, entries);
  };

  (config.interfaces || []).forEach((item) => {
    const name = physicalInterfaceName(item.name);
    if (!name || item.bundleAe) {
      return;
    }
    if (item.portType === "l3") {
      return;
    }
    if (item.mode === "trunk") {
      selectedVlans(item.trunkVlans).forEach((vlan) => addUse(vlan, name, "trunk member"));
    } else {
      addUse(item.accessVlan, name, "access VLAN");
    }
    if (item.voice?.enabled) {
      addUse(item.voice.vlan, name, "voice VLAN");
    }
  });

  (config.aggregate?.interfaces || []).forEach((item) => {
    const name = `ae${item.number || "?"}`;
    if (item.portType === "l3" || item.portType === "none") {
      return;
    }
    if (item.mode === "trunk") {
      selectedVlans(item.trunkVlans).forEach((vlan) => addUse(vlan, name, "trunk member"));
    } else {
      addUse(item.accessVlan, name, "access VLAN");
    }
  });

  (config.irbs || []).forEach((irb) => {
    addUse(irb.vlan, `irb.${irb.unit || "?"}`, "IRB link");
  });

  return Array.from(usage.entries()).map(([vlan, refs]) => ({ vlan, refs }));
}

function Section({ title, icon: Icon, children, actions }) {
  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
        </div>
        <div className="section-actions">
          {Icon ? <Icon size={20} aria-hidden="true" /> : null}
          {actions}
        </div>
      </div>
      {children}
    </section>
  );
}

function DataTable({ columns, children }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function ConnectionPanel({ connection, setConnection, deviceInfo, connectToSwitch, disconnectFromDevice, connectionStatus, connectionBusy }) {
  const connected = Boolean(deviceInfo?.ok);

  return (
    <div className="connection-panel">
      <Field label="Host">
        <TextInput value={connection.host} onChange={(event) => setConnection({ ...connection, host: event.target.value })} placeholder="192.0.2.10" />
      </Field>
      <Field label="NETCONF Port">
        <TextInput value={connection.port} onChange={(event) => setConnection({ ...connection, port: event.target.value })} />
      </Field>
      <Field label="Username">
        <TextInput value={connection.username} onChange={(event) => setConnection({ ...connection, username: event.target.value })} />
      </Field>
      <Field label="Password">
        <TextInput type="password" value={connection.password} onChange={(event) => setConnection({ ...connection, password: event.target.value })} />
      </Field>
      <label className="checkline">
        <input type="checkbox" checked={Boolean(connection.remember)} onChange={(event) => setConnection({ ...connection, remember: event.target.checked })} />
        Remember credentials on this computer
      </label>
      <div className="connection-actions">
        <button className="primary" onClick={() => connectToSwitch(connection)} disabled={connectionBusy}>
          <Lock size={16} />
          {connectionBusy ? "Connecting" : connected ? "Connected" : "Connect"}
        </button>
        <button onClick={disconnectFromDevice} disabled={connectionBusy || !deviceInfo}>
          <LogOut size={16} />
          Disconnect
        </button>
      </div>
      <p className="status-text">{connectionStatus || (connection.remember ? "Credentials will be saved locally on this computer." : "Connect to the switch with NETCONF over SSH. Credentials are not saved.")}</p>
      {deviceInfo ? (
        <div className={deviceInfo.ok ? "device-good" : "device-warn"}>
          <strong>{deviceInfo.model || "Unknown model"}</strong>
          <span>{deviceInfo.release || "Unknown Junos release"}</span>
          {deviceInfo.warnings?.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Dashboard({ config, commands, errors, connectionProps, deviceSnapshot }) {
  const deviceInfo = connectionProps.deviceInfo;
  const connection = connectionProps.connection;
  const environment = deviceInfo?.environment || {};
  const environmentTable = (title, items = []) => (
    <Section title={title} icon={Activity}>
      <div className="environment-table">
        <div className="environment-heading">
          <span>Item</span>
          <span>Status</span>
          <span>Measurement</span>
        </div>
        {items.length ? items.map((item, index) => (
          <div className="environment-row" key={`${title}-${item.item}-${index}`}>
            <strong>{item.item}</strong>
            <span className={`env-status ${statusTone(item.status) || String(item.status).toLowerCase()}`}>{item.status || "-"}</span>
            <small>{item.measurement || "-"}</small>
          </div>
        )) : (
          <div className="environment-empty muted">No {title.toLowerCase()} data loaded.</div>
        )}
      </div>
    </Section>
  );
  return (
    <div className="dashboard-page">
      <section className="device-identity">
        <div className="device-identity-primary">
          <span className={deviceInfo?.ok ? "status-dot up" : "status-dot"} />
          <div>
            <span>{deviceInfo?.ok ? "Connected device" : "Device identity"}</span>
            <strong>{deviceInfo?.model || "Not connected"}</strong>
          </div>
        </div>
        <dl>
          <div><dt>Hostname</dt><dd>{deviceInfo?.hostname || "-"}</dd></div>
          <div><dt>Host</dt><dd>{connection?.host || "-"}</dd></div>
          <div><dt>Junos version</dt><dd>{deviceInfo?.release || "-"}</dd></div>
          <div><dt>Serial number</dt><dd>{deviceInfo?.serialNumber || "-"}</dd></div>
          <div><dt>Uptime</dt><dd>{deviceInfo?.routingEngine?.uptime || "-"}</dd></div>
        </dl>
      </section>
      <Section title="Device Summary" icon={Activity}>
        <div className="summary-grid">
          <div><strong>{config.vlans.length}</strong><span>VLANs</span></div>
          <div><strong>{config.interfaces.length}</strong><span>Interfaces</span></div>
          <div><strong>{config.irbs.length}</strong><span>IRBs</span></div>
          <div><strong>{config.staticRoutes.length}</strong><span>Routes</span></div>
          <div><strong>{deviceSnapshot?.ports?.length || 0}</strong><span>Live Ports</span></div>
          <div><strong>{deviceSnapshot?.vlans?.length || 0}</strong><span>Active VLANs</span></div>
          <div><strong>{deviceInfo?.routingEngine?.cpuPercent ?? "-"}</strong><span>CPU %</span></div>
          <div><strong>{deviceInfo?.release || "-"}</strong><span>Firmware</span></div>
          <div><strong>{(config.spanningTree?.mode || "none").toUpperCase()}</strong><span>STP Mode</span></div>
          <div className={statusTone(environment.fan)}><strong>{environment.fan || "-"}</strong><span>Fan</span></div>
          <div className={statusTone(environment.power)}><strong>{environment.power || "-"}</strong><span>Power</span></div>
          <div className={statusTone(environment.temperature)}><strong>{environment.temperature || "-"}</strong><span>Temperature</span></div>
        </div>
      </Section>
      {environmentTable("Power", environment.powerItems || [])}
      {environmentTable("Fan", environment.fanItems || [])}
      {environmentTable("Temperature", environment.temperatureItems || [])}
      <Section title="Readiness" icon={CheckCircle2}>
        <div className="readiness">
          <div className={errors.length ? "pill warn" : "pill ok"}>{errors.length ? `${errors.length} validation issue(s)` : "Ready for commit-check"}</div>
          <div className="pill">{commands.length} set commands</div>
          <div className="pill">Local candidate only</div>
        </div>
      </Section>
    </div>
  );
}

function DeviceAccess({ connectionProps }) {
  return (
    <Section title="Device Access" icon={CloudCog}>
      <div className="guidance-panel">
        <strong>Switch prerequisite</strong>
        <p>Enable NETCONF over SSH before using Mini J-Web EX.</p>
        <code>set system services netconf ssh</code>
      </div>
      <ConnectionPanel {...connectionProps} />
    </Section>
  );
}

function VirtualChassis({ config, setConfig, deviceInfo, connection, deviceSnapshot }) {
  const hgoe = hgoeEligibility(deviceInfo);
  const vcCapability = virtualChassisCapability(deviceInfo);
  const virtualChassis = config.virtualChassis || defaultConfig.virtualChassis;
  const connected = Boolean(deviceInfo?.ok);
  const statusClass = vcCapability.warning ? "warn" : "ok";
  const versionText = connected ? hgoe.release || "Unknown" : "Connect to a switch";
  const hgoeText = hgoe.supported ? (hgoe.minimum ? `Junos OS ${hgoe.minimum}+` : "Supported") : "Not supported";
  const eligiblePorts = useMemo(() => eligibleVcPortsForModel(deviceInfo, deviceSnapshot), [deviceInfo, deviceSnapshot]);
  const [selectedPortKey, setSelectedPortKey] = useState("");
  const selectedPort = eligiblePorts.find((port) => port.key === selectedPortKey) || eligiblePorts[0] || null;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const canRunHgoeMode = connected && hgoe.eligible && !busy;
  const canRunHigigMode = connected && hgoe.supported && !busy;
  const canRunAnyVcAction = connected && selectedPort && !busy;
  const canRunPerPortVcAction = connected && hgoe.eligible && !busy;
  const liveMemberCount = deviceSnapshot?.virtualChassis?.members?.length || 0;
  const plannedMemberCount = (virtualChassis.members || []).length;
  const intendedMemberCount = virtualChassis.preprovisioned && plannedMemberCount ? plannedMemberCount : liveMemberCount;
  const addMemberDisabled = plannedMemberCount >= vcCapability.maxMembers;
  const overMemberLimit = plannedMemberCount > vcCapability.maxMembers || liveMemberCount > vcCapability.maxMembers;
  const splitDetectionWarning = intendedMemberCount >= 3 && virtualChassis.noSplitDetection;

  async function runVcAction({ action, confirmText, pendingText }) {
    const confirmed = window.confirm(confirmText);
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus(pendingText);
    try {
      const response = await window.miniJweb.runAction({ connection, action });
      setStatus(`${response.command}\n${response.output || "Command completed."}`);
    } catch (error) {
      setStatus(error.message || "Virtual Chassis action failed.");
    } finally {
      setBusy(false);
    }
  }

  function setVirtualChassis(nextVirtualChassis) {
    setConfig({
      ...config,
      virtualChassis: {
        ...virtualChassis,
        ...nextVirtualChassis,
        modified: true
      }
    });
  }

  function updateVcMember(index, patch) {
    const members = (virtualChassis.members || []).map((member, memberIndex) => (
      memberIndex === index ? { ...member, ...patch, modified: true } : member
    ));
    setVirtualChassis({ members });
  }

  function addVcMember() {
    if (addMemberDisabled) {
      setStatus(`Maximum ${vcCapability.maxMembersLabel} Virtual Chassis member rows reached for ${deviceInfo?.model || "this model"}.`);
      return;
    }
    const usedIds = new Set((virtualChassis.members || []).map((member) => String(member.memberId)));
    let nextId = 0;
    while (usedIds.has(String(nextId))) {
      nextId += 1;
    }
    const role = nextId < 2 ? "routing-engine" : "line-card";
    setVirtualChassis({
      preprovisioned: true,
      members: [
        ...(virtualChassis.members || []),
        { memberId: String(nextId), serialNumber: "", model: deviceInfo?.model || "", role, modified: true }
      ]
    });
  }

  function removeVcMember(index) {
    setVirtualChassis({ members: (virtualChassis.members || []).filter((_member, memberIndex) => memberIndex !== index) });
  }

  function importCurrentMembers() {
    let imported = (deviceSnapshot?.virtualChassis?.members || []).map((member) => ({
      memberId: member.memberId,
      serialNumber: member.serialNumber,
      model: member.model,
      role: /master|backup/i.test(member.role || "") ? "routing-engine" : "line-card",
      modified: true
    }));
    if (imported.length === 0 && deviceInfo?.serialNumber) {
      imported.push({
        memberId: "0",
        serialNumber: deviceInfo.serialNumber,
        model: deviceInfo.model || "",
        role: "routing-engine",
        modified: true
      });
    }
    if (imported.length > vcCapability.maxMembers) {
      setStatus(`Imported current members but capped editable rows at ${vcCapability.maxMembersLabel} for ${deviceInfo?.model || "this model"}.`);
      imported = imported.slice(0, vcCapability.maxMembers);
    }
    setVirtualChassis({ preprovisioned: true, members: imported });
  }

  return (
    <div className="vc-layout">
      <Section title="Virtual Chassis Capability" icon={Network}>
        <div className="vc-status-grid">
          <div className="vc-status-card">
            <span>Detected model</span>
            <strong>{deviceInfo?.model || "Not connected"}</strong>
          </div>
          <div className="vc-status-card">
            <span>Detected release</span>
            <strong>{versionText}</strong>
          </div>
          <div className="vc-status-card">
            <span>Member limit</span>
            <strong>{vcCapability.maxMembersLabel}</strong>
          </div>
          <div className={`vc-status-card ${statusClass}`}>
            <span>VC guardrail</span>
            <strong>{vcCapability.warning ? "Attention" : "Ready"}</strong>
          </div>
          <div className="vc-status-card">
            <span>Current VC mode</span>
            <strong>{virtualChassisModeLabel(deviceSnapshot)}</strong>
          </div>
          <div className="vc-status-card">
            <span>HGoE</span>
            <strong>{hgoeText}</strong>
          </div>
        </div>
        <div className={vcCapability.warning || overMemberLimit ? "warning-panel" : "guidance-panel success"}>
          <strong>{overMemberLimit ? "Member count exceeds guardrail" : vcCapability.warning ? "Release-gated VC limit" : "Model-aware VC limit"}</strong>
          <p>{overMemberLimit ? `This snapshot or candidate has more than ${vcCapability.maxMembersLabel} member rows for ${deviceInfo?.model || "this model"}.` : vcCapability.warning || vcCapability.note}</p>
          {vcCapability.minReleaseForFullScale ? <p>Full-scale support requires Junos OS {vcCapability.minReleaseForFullScale} or later.</p> : null}
        </div>
        <div className={hgoe.eligible ? "guidance-panel success" : "warning-panel"}>
          <strong>{hgoe.eligible ? "HGoE can be offered for this EX platform" : "HGoE guardrail"}</strong>
          <p>{hgoe.note}</p>
          {connected && hgoe.supported && !hgoe.releaseMeetsMinimum ? (
            <p>Current release {hgoe.release || "unknown"} is below the minimum. Show a warning and disable HGoE mode-change actions until the switch is upgraded.</p>
          ) : null}
        </div>
      </Section>

      <Section title="Preprovisioning" icon={ClipboardCheck}>
        <div className="guidance-panel">
          <strong>Deterministic Virtual Chassis membership</strong>
          <p>Preprovisioning binds member IDs to serial numbers and roles. Use two routing-engine members for a primary/backup design, then convert the intended VCP links.</p>
          <code>set virtual-chassis preprovisioned</code>
        </div>
        <div className="vc-preprovision-toolbar">
          <label className="checkline">
            <input
              type="checkbox"
              checked={Boolean(virtualChassis.preprovisioned)}
              onChange={(event) => setVirtualChassis({ preprovisioned: event.target.checked })}
            />
            Enable preprovisioned mode
          </label>
          <label className="checkline" title="Recommended for 2-member Virtual Chassis designs. Generates set virtual-chassis no-split-detection.">
            <input
              type="checkbox"
              checked={Boolean(virtualChassis.noSplitDetection)}
              onChange={(event) => setVirtualChassis({ noSplitDetection: event.target.checked })}
            />
            no-split-detection
          </label>
          <button type="button" onClick={importCurrentMembers}>
            <RefreshCw size={16} />Import current members
          </button>
          <button type="button" onClick={addVcMember} disabled={addMemberDisabled} title={addMemberDisabled ? `Maximum ${vcCapability.maxMembersLabel} members for this model` : "Add Virtual Chassis member"}>
            <Plus size={16} />Add member
          </button>
        </div>
        <div className={splitDetectionWarning ? "warning-panel" : intendedMemberCount === 2 ? "guidance-panel success" : "guidance-panel"}>
          <strong>Split detection</strong>
          <p>{splitDetectionWarning
            ? "This candidate has 3 or more members while no-split-detection is enabled. Remove no-split-detection before expanding beyond 2 members unless your design explicitly requires otherwise."
            : "For a 2-member Virtual Chassis, Juniper recommends disabling split detection with set virtual-chassis no-split-detection. For 3 or more members, keep split detection enabled unless your design requires otherwise."}</p>
        </div>
        <div className="table-wrap vc-member-table">
          <table>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(virtualChassis.members || []).map((member, index) => {
                const liveMember = (deviceSnapshot?.virtualChassis?.members || []).find((item) => item.serialNumber === member.serialNumber || item.memberId === member.memberId);
                return (
                  <tr key={`${member.memberId}-${index}`}>
                    <td><TextInput value={member.memberId} onChange={(event) => updateVcMember(index, { memberId: event.target.value })} /></td>
                    <td><TextInput value={member.serialNumber} onChange={(event) => updateVcMember(index, { serialNumber: event.target.value.trim().toUpperCase() })} placeholder="PE3717390443" /></td>
                    <td>
                      <select value={member.model || ""} onChange={(event) => updateVcMember(index, { model: event.target.value })}>
                        <option value="">Select model</option>
                        {VC_PREPROVISION_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={member.role || "line-card"} onChange={(event) => updateVcMember(index, { role: event.target.value })}>
                        <option value="routing-engine">Routing Engine</option>
                        <option value="line-card">Linecard</option>
                      </select>
                    </td>
                    <td>{liveMember ? `${liveMember.status} / ${liveMember.role}` : "Planned"}</td>
                    <td>
                      <button type="button" className="icon" onClick={() => removeVcMember(index)} title="Remove member">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(virtualChassis.members || []).length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No preprovisioned members yet. Import current members or add member rows.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="status-text">These rows generate candidate configuration only. Use Commit Confirm for the safe apply step.</p>
      </Section>

      <Section title="Non-HGoE Port Conversion Note" icon={Cable}>
        <div className="warning-panel">
          <strong>HiGig mode is not flexible per port</strong>
          <p>When the switch is not in HGoE mode, changing VC ports to network-port mode is treated as an all-port mode change for that VCP group. Do not present it as converting one selected port only.</p>
          <p>Before any future VC Port to Network Port action, Mini J-Web EX should warn that all default VCP ports may become network ports and the switch may no longer have usable VCP links until changed back.</p>
        </div>
        <div className="vc-action-grid">
          {hgoe.supported ? (
            <div className="vc-action-card">
              <span>VC Transport Mode</span>
              <strong>HGoE mode toggle</strong>
              <p>Changing between HiGig and HGoE requires a reboot. Use HGoE only on EX platforms and releases that support it.</p>
              <div className="section-actions">
                <button
                  className="primary"
                  disabled={!canRunHgoeMode}
                  onClick={() => runVcAction({
                    action: { type: "virtualChassisMode", mode: "hgoe" },
                    confirmText: "Enable HGoE mode and reboot the switch?\n\nCommand:\nrequest virtual-chassis mode hgoe reboot",
                    pendingText: "Enabling HGoE mode..."
                  })}
                >
                  <Network size={16} />Enable HGoE
                </button>
                <button
                  disabled={!canRunHigigMode}
                  onClick={() => runVcAction({
                    action: { type: "virtualChassisMode", mode: "higig" },
                    confirmText: "Revert to HiGig mode and reboot the switch?\n\nCommand:\nrequest virtual-chassis mode hgoe disable reboot",
                    pendingText: "Reverting to HiGig mode..."
                  })}
                >
                  <RotateCcw size={16} />Revert to HiGig
                </button>
              </div>
              {!hgoe.eligible ? <small>{hgoe.note}</small> : null}
            </div>
          ) : null}

          <div className="vc-action-card">
            <span>HiGig / Non-HGoE</span>
            <strong>All default VCP ports</strong>
            <p>In non-HGoE mode this is not a per-port conversion. All default VCP ports in the group change together and the switch reboots.</p>
            <div className="section-actions">
              <button
                disabled={!canRunPerPortVcAction}
                onClick={() => runVcAction({
                  action: { type: "virtualChassisNetworkPortMode", target: "network" },
                  confirmText: "Convert the default VCP port group to network ports?\n\nThis is an all-port change in non-HGoE mode and requires reboot. The switch may have no usable VCP links until changed back.\n\nCommand:\nrequest virtual-chassis mode network-port reboot",
                  pendingText: "Converting default VCP group to network ports..."
                })}
              >
                <Cable size={16} />All to Network
              </button>
              <button
                disabled={!canRunPerPortVcAction}
                onClick={() => runVcAction({
                  action: { type: "virtualChassisNetworkPortMode", target: "vcp" },
                  confirmText: "Convert the default network-port group back to VCP ports?\n\nThis is an all-port change in non-HGoE mode and requires reboot.\n\nCommand:\nrequest virtual-chassis mode network-port disable reboot",
                  pendingText: "Converting default port group back to VCP..."
                })}
              >
                <GitBranch size={16} />All to VCP
              </button>
            </div>
          </div>

          <div className="vc-action-card">
            <span>Eligible port conversion</span>
            <strong>Selected PIC and port</strong>
            <p>Only ports mapped as valid VCP-capable uplinks for this model are shown. Unsupported ports are hidden even when Junos would accept the command syntax.</p>
            <div className="vc-port-picker">
              <label>
                Eligible port
                <select value={selectedPort?.key || ""} onChange={(event) => setSelectedPortKey(event.target.value)} disabled={eligiblePorts.length === 0}>
                  {eligiblePorts.map((port) => (
                    <option key={port.key} value={port.key}>
                      {port.name} - PIC {port.picSlot} port {port.port}
                    </option>
                  ))}
                  {eligiblePorts.length === 0 ? <option value="">No eligible ports detected</option> : null}
                </select>
              </label>
            </div>
            <div className="section-actions">
              <button
                disabled={!canRunAnyVcAction}
                onClick={() => runVcAction({
                  action: { type: "virtualChassisPort", operation: "set", picSlot: selectedPort.picSlot, port: selectedPort.port },
                  confirmText: `Convert ${selectedPort.name} to VCP?\n\nCommand:\nrequest virtual-chassis vc-port set pic-slot ${selectedPort.picSlot} port ${selectedPort.port}`,
                  pendingText: "Converting selected port to VCP..."
                })}
              >
                <GitBranch size={16} />Port to VCP
              </button>
              <button
                disabled={!canRunAnyVcAction}
                onClick={() => runVcAction({
                  action: { type: "virtualChassisPort", operation: "delete", picSlot: selectedPort.picSlot, port: selectedPort.port },
                  confirmText: `Convert ${selectedPort.name} to network port?\n\nCommand:\nrequest virtual-chassis vc-port delete pic-slot ${selectedPort.picSlot} port ${selectedPort.port}`,
                  pendingText: "Converting selected port to network..."
                })}
              >
                <EthernetPort size={16} />Port to Network
              </button>
            </div>
          </div>
        </div>
        <pre className="config-preview monitor-preview tool-output">{status || "Virtual Chassis action output will appear here."}</pre>
      </Section>
    </div>
  );
}

function Ports({ config, setConfig, deviceInfo, deviceSnapshot, connection, setDeviceSnapshot }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const snapshotByName = new Map((deviceSnapshot?.ports || []).map((port) => [port.name, port]));
  const names = Array.from(new Set([...(deviceSnapshot?.ports || []).map((port) => port.name)]))
    .filter(Boolean)
    .filter((name) => !String(name).endsWith(".16386"))
    .sort(compareInterfaceNames);
  const memberOptions = Array.from(new Set(names
    .filter((name) => /^(ge|mge|xe|et)-/i.test(physicalInterfaceName(name)))
    .map((name) => portParts(physicalInterfaceName(name)).fpc)))
    .sort((a, b) => Number(a) - Number(b));
  const matchesPortFilter = (name) => {
    const baseName = physicalInterfaceName(name);
    const port = snapshotByName.get(name) || snapshotByName.get(baseName);
    const parts = portParts(baseName);
    if (memberFilter !== "all" && parts.fpc !== memberFilter) {
      return false;
    }
    const query = filterText.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const haystack = [
      name,
      baseName,
      `fpc ${parts.fpc}`,
      `pic ${parts.pic}`,
      `port ${parts.port}`,
      port?.adminStatus,
      port?.operStatus,
      port?.proto,
      port?.local,
      port?.vcp ? "vcp" : "",
      port?.vcp?.status,
      port?.vcp?.neighbor,
      configFullLabel(port?.config)
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query);
  };
  const filteredNames = names.filter(matchesPortFilter);
  const frontPanelPorts = Array.from(filteredNames.reduce((grouped, name) => {
    const baseName = physicalInterfaceName(name);
    if (!/^(ge|mge|xe|et)-/i.test(baseName) || !isDisplayableFrontPanelPort(baseName, deviceInfo)) {
      return grouped;
    }
    const key = physicalPortAliasKey(deviceInfo?.model, baseName);
    const candidate = { name: baseName, port: snapshotByName.get(baseName) || snapshotByName.get(name) };
    grouped.set(key, preferPhysicalPortCandidate(deviceInfo?.model, grouped.get(key), candidate));
    return grouped;
  }, new Map()).values())
    .map(({ name, port }) => [name, port])
    .sort(([a], [b]) => compareInterfaceNames(a, b));
  const frontPanelGroups = groupFrontPanelPorts(frontPanelPorts, deviceInfo);
  const tableNames = Array.from(filteredNames.reduce((grouped, name) => {
    const baseName = physicalInterfaceName(name);
    if (/^vcp-/i.test(baseName)) {
      return grouped;
    }
    if (/^(ge|xe|et)-/i.test(baseName) && name === baseName) {
      const key = physicalPortAliasKey(deviceInfo?.model, baseName);
      const candidate = { name, port: snapshotByName.get(name) };
      grouped.set(key, preferPhysicalPortCandidate(deviceInfo?.model, grouped.get(key), candidate));
      return grouped;
    }
    grouped.set(name, { name, port: snapshotByName.get(name) });
    return grouped;
  }, new Map()).values())
    .map(({ name }) => name)
    .sort(compareInterfaceNames);

  async function refresh() {
    setBusy(true);
    setStatus("Refreshing ports and VLANs from switch...");
    try {
      const snapshot = await window.miniJweb.getSnapshot(connection);
      setDeviceSnapshot(snapshot);
      setConfig(configFromSnapshot(snapshot, defaultConfig));
      setStatus("Snapshot refreshed.");
    } catch (error) {
      setStatus(error.message || "Refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ports-layout">
      <Section
        title="Front Panel Ports"
        icon={List}
        actions={<button onClick={refresh} disabled={busy}><RefreshCw size={16} />Refresh</button>}
      >
        <p className="status-text">{status || "Read-only status from show interfaces terse. Edit configuration in the Interfaces section."}</p>
        <div className="port-filter-bar">
          <Field label="Search Ports">
            <TextInput value={filterText} onChange={(event) => setFilterText(event.target.value)} placeholder="Interface, FPC, PIC, link state, VLAN, or VCP" />
          </Field>
          <Field label="Member">
            <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
              <option value="all">All members</option>
              {memberOptions.map((member) => <option key={member} value={member}>FPC {member}</option>)}
            </select>
          </Field>
          <div className="port-filter-count">
            <strong>{tableNames.length}</strong>
            <span>ports shown</span>
          </div>
        </div>
        <div className="front-panel-stack">
          {frontPanelGroups.map((group) => (
            <div key={group.fpc} className="front-panel-row">
              <div className="fpc-label">FPC {group.fpc}</div>
              <div className="pic-stack">
                {group.pics.map((picGroup) => (
                  <div key={`${group.fpc}-${picGroup.key}`} className="pic-row">
                    <div className="pic-label">PIC {picGroup.pic}</div>
                    <div className={`front-panel ${picGroup.layout === "access" ? "access-panel" : "uplink-panel"}`}>
                      {picGroup.rows.map((row, rowIndex) => (
                        <div key={`${group.fpc}-${picGroup.pic}-${rowIndex}`} className="front-panel-line">
                          {row.map(({ name, port, parts }) => {
                            const oper = port?.operStatus || "unknown";
                            const fullConfigSummary = configFullLabel(port?.config);
                            const prefix = portParts(name).prefix;
                            const vcpSummary = port?.vcp ? `VCP: ${[port.vcp.type, port.vcp.status, port.vcp.speed, port.vcp.neighbor].filter(Boolean).join(" ")}` : "";
                            return (
                              <div key={name} className={`front-port ${prefix} ${port?.vcp ? "vcp" : ""} ${oper === "up" ? "up" : oper === "down" ? "down" : oper === "absent" ? "absent" : ""}`} title={`${name}\n${port?.synthetic ? "Port slot from chassis hardware\n" : ""}${vcpSummary ? `${vcpSummary}\n` : ""}${fullConfigSummary}\n${opticsLabel(port?.optics)}`}>
                                <span>{parts.port}</span>
                                {port?.vcp ? <small>VCP</small> : null}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {frontPanelGroups.length === 0 ? <div className="empty-state">No supported front-panel ports match the current filter.</div> : null}
        </div>
        <div className="port-table">
          <table>
            <thead>
              <tr>
                <th>Interface</th>
                <th>Admin</th>
                <th>Link</th>
                <th>Proto</th>
                <th>Local</th>
                <th>Configuration</th>
              </tr>
            </thead>
            <tbody>
              {tableNames.map((name) => {
                const port = snapshotByName.get(name);
                const oper = port?.operStatus || "unknown";
                const configSummary = configLabel(port?.config);
                const fullConfigSummary = configFullLabel(port?.config);
                return (
                  <tr key={name}>
                    <td className="port-cell">
                      <span className={`status-dot ${oper === "up" ? "up" : oper === "down" ? "down" : ""}`} />
                      <span className="port-name">{name}</span>
                      {port?.vcp ? <span className="port-badge">VCP</span> : null}
                      <div className="hover-card">
                        <strong>{name}</strong>
                        {port?.vcp ? <span>VCP: {[port.vcp.type, port.vcp.status, port.vcp.speed, port.vcp.neighbor].filter(Boolean).join(" ") || port.vcp.raw}</span> : null}
                        <span>Admin: {port?.adminStatus || "unknown"}</span>
                        <span>Oper: {port?.operStatus || "unknown"}</span>
                        <span>Speed: {port?.speed || "unknown"}</span>
                        <span>Configured: {fullConfigSummary}</span>
                        <span>Members: {port?.config?.vlanMembers?.join(", ") || "-"}</span>
                        <span>IP: {port?.config?.addresses?.join(", ") || "-"}</span>
                        <span>{opticsLabel(port?.optics).replace(/\n/g, " | ")}</span>
                      </div>
                    </td>
                    <td>{port?.adminStatus || "candidate"}</td>
                    <td>{port?.operStatus || "candidate"}</td>
                    <td>{port?.proto || ""}</td>
                    <td>{port?.local || ""}</td>
                    <td><span className="muted config-summary" title={fullConfigSummary}>{configSummary}</span></td>
                  </tr>
                );
              })}
              {tableNames.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">No ports match the current filter.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Active VLANs" icon={VlanIcon}>
        <DataTable columns={["Name", "VLAN ID"]}>
          {config.vlans.map((vlan, index) => (
            <tr key={`${vlan.name}-${index}`}>
              <td>{vlan.name}</td>
              <td>{vlan.vlanId}</td>
            </tr>
          ))}
        </DataTable>
      </Section>
    </div>
  );
}

function Vlans({ config, setConfig }) {
  const usageWarnings = vlanUsageWarnings(config);
  const update = (index, patch) => {
    const current = config.vlans[index];
    const rename = Object.prototype.hasOwnProperty.call(patch, "name") && current?.name !== patch.name;
    const nextConfig = rename ? replaceVlanReferences(config, current.name, patch.name) : config;
    const vlans = nextConfig.vlans.map((vlan, i) => {
      if (i !== index) {
        return vlan;
      }
      const previousName = rename && !vlan.previousName && config.baseline?.vlans?.includes(current.name) ? current.name : vlan.previousName;
      return { ...vlan, ...patch, previousName, modified: true };
    });
    setConfig({ ...nextConfig, vlans });
  };
  return (
    <Section
        title="VLAN Creation"
        icon={Layers3}
        actions={<button onClick={() => setConfig({ ...config, vlans: [...config.vlans, { name: "", vlanId: "", description: "", modified: true }] })}><Plus size={16} />Add</button>}
      >
        <DataTable columns={["Name", "VLAN ID", "Description", "Original", ""]}>
          {config.vlans.map((vlan, index) => (
            <tr key={index}>
              <td><TextInput value={vlan.name} disabled={vlan.name === "default"} onChange={(event) => update(index, { name: event.target.value })} /></td>
              <td><TextInput value={vlan.vlanId} onChange={(event) => update(index, { vlanId: event.target.value })} /></td>
              <td><TextInput value={vlan.description} onChange={(event) => update(index, { description: event.target.value })} /></td>
              <td><span className="muted">{vlan.previousName && vlan.previousName !== vlan.name ? vlan.previousName : ""}</span></td>
              <td>
                <button
                  className="icon"
                  title={vlan.name === "default" ? "Default VLAN is kept on the switch" : "Delete"}
                  disabled={vlan.name === "default"}
                  onClick={() => setConfig({ ...config, vlans: config.vlans.filter((_, i) => i !== index) })}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
        {usageWarnings.length ? (
          <div className="warning-panel">
            <strong>Deleted VLAN still in use</strong>
            <p>These VLAN references still exist in interface or aggregate configuration. Update those ports before commit.</p>
            <DataTable columns={["Deleted VLAN", "Used By", "Role"]}>
              {usageWarnings.flatMap((item) => item.refs.map((ref, index) => (
                <tr key={`${item.vlan}-${ref.target}-${ref.role}-${index}`}>
                  <td>{item.vlan}</td>
                  <td>{ref.target}</td>
                  <td>{ref.role}</td>
                </tr>
              )))}
            </DataTable>
          </div>
        ) : null}
      </Section>
  );
}

function Interfaces({ config, setConfig, deviceSnapshot, deviceInfo }) {
  const [selectedName, setSelectedName] = useState("");
  const [selectedMember, setSelectedMember] = useState("all");
  const supportedPort = /^(ge|mge|xe|et|vcp)-/i;
  const portByName = useMemo(() => {
    const grouped = new Map();
    (deviceSnapshot?.ports || []).forEach((port) => {
      if (!port.name || String(port.name).endsWith(".16386")) {
        return;
      }
      const baseName = physicalInterfaceName(port.name);
      if (!supportedPort.test(baseName) || /^vcp-/i.test(baseName)) {
        return;
      }
      const displayName = effectiveInterfaceNameForDisplay(baseName, deviceInfo, deviceSnapshot, config);
      const key = physicalPortAliasKey(deviceInfo?.model, displayName);
      const candidate = { name: displayName, port };
      grouped.set(key, preferPhysicalPortCandidate(deviceInfo?.model, grouped.get(key), candidate));
    });
    return new Map(Array.from(grouped.values()).map(({ name, port }) => [name, port]));
  }, [config, deviceInfo, deviceSnapshot]);
  const interfaceByName = useMemo(
    () => new Map(config.interfaces.map((item, index) => [
      effectiveInterfaceNameForDisplay(item.name, deviceInfo, deviceSnapshot, config),
      { item, index }
    ])),
    [config, deviceInfo, deviceSnapshot]
  );
  const portNames = useMemo(
    () => Array.from(new Set([...portByName.keys(), ...interfaceByName.keys()]))
      .filter((name) => supportedPort.test(name) && !/^vcp-/i.test(name))
      .sort(compareInterfaceNames),
    [portByName, interfaceByName]
  );
  const memberOptions = useMemo(() => {
    const members = Array.from(new Set(portNames.map((name) => portParts(name).fpc))).sort((a, b) => Number(a) - Number(b));
    return members;
  }, [portNames]);
  const visiblePortNames = useMemo(
    () => selectedMember === "all" ? portNames : portNames.filter((name) => portParts(name).fpc === selectedMember),
    [portNames, selectedMember]
  );
  const activeName = visiblePortNames.includes(selectedName) ? selectedName : visiblePortNames[0] || "";
  const activeEntry = interfaceByName.get(activeName);
  const activeIndex = activeEntry?.index ?? -1;
  const activePort = portByName.get(activeName);
  const activeConfig = activeEntry?.item || { ...newInterface(defaultAccessVlan(config)), name: activeName, modified: false };

  const updateActive = (patch) => {
    if (!activeName) {
      return;
    }
    if (activeIndex >= 0) {
      const interfaces = config.interfaces.map((item, i) => (i === activeIndex ? { ...item, ...patch, name: activeName, modified: true } : item));
      setConfig({ ...config, interfaces });
      return;
    }
    setConfig({
      ...config,
      interfaces: [
        ...config.interfaces,
        { ...newInterface(defaultAccessVlan(config)), name: activeName, ...patch, modified: true }
      ]
    });
  };

  const clearActive = () => {
    if (activeIndex < 0) {
      return;
    }
    setConfig({ ...config, interfaces: config.interfaces.filter((_, index) => index !== activeIndex) });
  };

  const setMode = (mode) => {
    const item = activeConfig;
    if (mode === "layer3") {
      updateActive({
        portType: "l3",
        mode: "access",
        accessVlan: "",
        trunkVlans: "",
        nativeVlan: item.nativeVlan || "",
        l3VlanId: item.l3VlanId || "",
        ipv4Mode: item.ipv4Mode || "static",
        ipv6Addresses: item.ipv6Addresses || "",
        stpEdge: false,
        voice: { ...item.voice, enabled: false, vlan: "" }
      });
      return;
    }

    updateActive({
      portType: "l2",
      mode,
      unit: "0",
      l3VlanId: "",
      ipAddresses: "",
      ipv6Addresses: "",
      ipv4Mode: "static",
      accessVlan: mode === "access" ? item.accessVlan || defaultAccessVlan(config) : "",
      trunkVlans: mode === "trunk" ? item.trunkVlans : "",
      stpEdge: mode === "access" ? item.stpEdge : false,
      voice: mode === "trunk" ? { ...item.voice, enabled: false, vlan: "" } : item.voice
    });
  };

  return (
    <Section title="Interface Configuration" icon={Cable}>
      <div className="interface-split">
        <div className="interface-picker" aria-label="Interface list">
          <div className="interface-filter">
            <label>Member</label>
            <select value={selectedMember} onChange={(event) => { setSelectedMember(event.target.value); setSelectedName(""); }}>
              <option value="all">All members</option>
              {memberOptions.map((member) => <option key={member} value={member}>FPC {member}</option>)}
            </select>
          </div>
          {visiblePortNames.length ? visiblePortNames.map((name) => {
            const port = portByName.get(name);
            const candidate = interfaceByName.get(name)?.item;
            const oper = port?.operStatus || "unknown";
            return (
              <button
                key={name}
                className={name === activeName ? "interface-pick selected" : "interface-pick"}
                onClick={() => setSelectedName(name)}
              >
                <span className={`status-dot ${oper === "up" ? "up" : oper === "down" ? "down" : ""}`} />
                <span>
                  <strong>{name}</strong>
                  <small>{candidate ? interfaceCandidateLabel(candidate) : configLabel(port?.config)}</small>
                </span>
              </button>
            );
          }) : (
            <div className="empty-state">Connect to a switch or refresh to load the port list.</div>
          )}
        </div>

        <div className="interface-detail">
          {activeName ? (
            <div className="interface-row detail-row">
              <div className="row-title">
                <Field label="Interface">
                  <TextInput value={activeName} readOnly />
                </Field>
                <Field label="Description">
                  <TextInput value={activeConfig.description || ""} disabled={Boolean(activeConfig.bundleAe)} onChange={(event) => updateActive({ description: event.target.value })} />
                </Field>
                <button className="icon danger" title="Clear interface configuration" disabled={activeIndex < 0} onClick={clearActive}><Trash2 size={16} /></button>
              </div>

              <div className="interface-current">
                <span className={`status-dot ${activePort?.operStatus === "up" ? "up" : activePort?.operStatus === "down" ? "down" : ""}`} />
                <span>Admin {activePort?.adminStatus || "unknown"}</span>
                <span>Link {activePort?.operStatus || "unknown"}</span>
                <span>Speed {activePort?.speed || "unknown"}</span>
                <span>{activeIndex >= 0 ? "Candidate loaded" : "No local candidate yet"}</span>
              </div>

              <div className="form-grid compact-grid">
                <Field label={<span className="label-with-help">Bundle to LAG <HelpTip text="Enter the AE/LAG number that already exists. For ae0, enter 0. Use the same number you created in Aggregate Ethernet." /></span>}>
                  <TextInput value={activeConfig.bundleAe || ""} onChange={(event) => updateActive({ bundleAe: event.target.value, stpEdge: false, voice: { ...activeConfig.voice, enabled: false, vlan: "" } })} placeholder="AE/LAG number, for example 0 for ae0" />
                </Field>
                {activeConfig.bundleAe ? <p className="inline-warning">Physical member config will be cleared and replaced with ae{activeConfig.bundleAe} membership.</p> : null}
              </div>

              {!activeConfig.bundleAe ? (
                <>
                  <div className="mode-group" role="group">
                    <button className={activeConfig.portType !== "l3" && activeConfig.mode === "access" ? "selected" : ""} onClick={() => setMode("access")}>Access</button>
                    <button className={activeConfig.portType !== "l3" && activeConfig.mode === "trunk" ? "selected" : ""} onClick={() => setMode("trunk")}>Trunk</button>
                    <button className={activeConfig.portType === "l3" ? "selected" : ""} onClick={() => setMode("layer3")}>Layer3</button>
                  </div>
                  <div className="form-grid">
                    {activeConfig.portType === "l3" ? (
                      <>
                        <Field label={<span className="label-with-help">Interface MTU <HelpTip text="Physical interface MTU. The generated command is set interfaces <port> mtu <value>." /></span>}>
                          <TextInput value={activeConfig.mtu || ""} onChange={(event) => updateActive({ mtu: event.target.value })} placeholder="Optional" />
                        </Field>
                        <Field label="Unit">
                          <TextInput value={activeConfig.unit || "0"} onChange={(event) => updateActive({ unit: event.target.value })} />
                        </Field>
                        {String(activeConfig.unit || "0") !== "0" ? (
                          <Field label="VLAN ID">
                            <TextInput value={activeConfig.l3VlanId || ""} onChange={(event) => updateActive({ l3VlanId: event.target.value })} placeholder="Required for tagged unit" />
                          </Field>
                        ) : null}
                        <Field label="IPv4 Address">
                          <select value={activeConfig.ipv4Mode || "static"} onChange={(event) => updateActive({ ipv4Mode: event.target.value, ipAddresses: event.target.value === "dhcp" ? "" : activeConfig.ipAddresses })}>
                            <option value="static">Static</option>
                            <option value="dhcp">DHCP</option>
                          </select>
                        </Field>
                        {(activeConfig.ipv4Mode || "static") === "static" ? (
                          <Field label="Static IPv4">
                            <TextInput value={activeConfig.ipAddresses || ""} onChange={(event) => updateActive({ ipAddresses: event.target.value })} placeholder="192.168.0.99/24" />
                          </Field>
                        ) : null}
                        <Field label="IPv6 Address">
                          <TextInput value={activeConfig.ipv6Addresses || ""} onChange={(event) => updateActive({ ipv6Addresses: event.target.value })} placeholder="2001:db8::1/64" />
                        </Field>
                        <Field label="Native VLAN ID">
                          <TextInput value={activeConfig.nativeVlan || ""} onChange={(event) => updateActive({ nativeVlan: event.target.value })} placeholder="Optional" />
                        </Field>
                      </>
                    ) : activeConfig.mode === "access" ? (
                      <>
                        <Field label="Access VLAN">
                          <select value={activeConfig.accessVlan || ""} onChange={(event) => updateActive({ accessVlan: event.target.value })}>
                            <option value="">Select VLAN</option>
                            {config.vlans.map((vlan) => <option key={vlan.name} value={vlan.name}>{vlan.name}</option>)}
                          </select>
                        </Field>
                        <Field label={<span className="label-with-help">Interface MTU <HelpTip text="Physical interface MTU. The generated command is set interfaces <port> mtu <value>." /></span>}>
                          <TextInput value={activeConfig.mtu || ""} onChange={(event) => updateActive({ mtu: event.target.value })} placeholder="Optional" />
                        </Field>
                        <Field label="Native VLAN ID">
                          <TextInput value={activeConfig.nativeVlan || ""} onChange={(event) => updateActive({ nativeVlan: event.target.value })} placeholder="Optional" />
                        </Field>
                        <label className="checkline">
                          <input checked={Boolean(activeConfig.stpEdge)} type="checkbox" onChange={(event) => updateActive({ stpEdge: event.target.checked })} />
                          Edge port
                        </label>
                        {activeConfig.stpEdge && config.spanningTree?.mode === "none" ? (
                          <p className="inline-warning">Enable RSTP or VSTP before committing an edge port.</p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <VlanMultiPicker label="Trunk VLANs" vlans={config.vlans} value={activeConfig.trunkVlans} onChange={(trunkVlans) => updateActive({ trunkVlans })} />
                        <Field label={<span className="label-with-help">Interface MTU <HelpTip text="Physical interface MTU. The generated command is set interfaces <port> mtu <value>." /></span>}>
                          <TextInput value={activeConfig.mtu || ""} onChange={(event) => updateActive({ mtu: event.target.value })} placeholder="Optional" />
                        </Field>
                        <Field label="Native VLAN ID">
                          <TextInput value={activeConfig.nativeVlan || ""} onChange={(event) => updateActive({ nativeVlan: event.target.value })} placeholder="Optional" />
                        </Field>
                      </>
                    )}
                    {activeConfig.portType !== "l3" && activeConfig.mode === "access" ? (
                      <>
                        <Field label="Voice VLAN">
                          <select
                            value={activeConfig.voice?.vlan || ""}
                            onChange={(event) => updateActive({ voice: { ...activeConfig.voice, enabled: Boolean(event.target.value), vlan: event.target.value } })}
                          >
                            <option value="">Disabled</option>
                            {config.vlans.map((vlan) => <option key={vlan.name} value={vlan.name}>{vlan.name}</option>)}
                          </select>
                        </Field>
                        <Field label="Voice Forwarding Class">
                          <select value={activeConfig.voice?.forwardingClass || "assured-forwarding"} onChange={(event) => updateActive({ voice: { ...activeConfig.voice, forwardingClass: event.target.value } })}>
                            {forwardingClasses.map((value) => <option key={value || "none"} value={value}>{value || "None"}</option>)}
                          </select>
                        </Field>
                        <label className="checkline">
                          <input checked={Boolean(activeConfig.voice?.lldpMed)} type="checkbox" onChange={(event) => updateActive({ voice: { ...activeConfig.voice, lldpMed: event.target.checked } })} />
                          Enable LLDP-MED for phone policy
                        </label>
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">No interface selected.</div>
          )}
        </div>
      </div>
    </Section>
  );
}

function SpeedSettings({ config, setConfig, deviceInfo, deviceSnapshot }) {
  const targets = useMemo(() => speedTargets(deviceInfo, deviceSnapshot), [deviceInfo, deviceSnapshot]);
  const settings = config.speedSettings || [];
  const findSetting = (target) => settings.find((item) => speedSettingMatchesTarget(item, target));
  const updateSpeed = (target, speed) => {
    const nextItem = {
      ...(findSetting(target) || {}),
      profile: target.profile,
      fpc: String(target.fpc),
      pic: String(target.pic),
      leadPort: Number(target.leadPort),
      speed,
      label: target.label,
      modified: true
    };
    const nextSettings = compactSpeedSettings([
      ...settings.filter((item) => !speedSettingMatchesTarget(item, target)),
      nextItem
    ]);
    setConfig({ ...config, speedSettings: nextSettings });
  };
  const unsupportedMessage = deviceInfo?.ok
    ? /^ex4400/i.test(deviceInfo.model || "")
      ? "No supported EX4400 speed-controlled extension module is detected in PIC 2."
      : "This model is treated as optic auto-detect or per-port capable. No manual chassis speed mode is needed here."
    : "Connect to a switch to load model-aware speed settings.";

  return (
    <Section title="Speed Settings" icon={Cable}>
      <div className="guidance-panel">
        <strong>Chassis speed mode</strong>
        <p>These controls generate chassis-level speed commands only. Use Commit Confirm when applying speed changes because affected ports may flap.</p>
      </div>
      {targets.length ? (
        <DataTable columns={["Scope", "Effective Speed", "Command Target", "Status"]}>
          {targets.map((target) => {
            const setting = findSetting(target);
            const value = speedForTarget(config, target);
            const effectiveValue = value || target.defaultSpeed || "";
            const command = target.profile === "front-group4" && effectiveValue === "10g"
              ? `delete chassis fpc ${target.fpc} pic ${target.pic} port ${target.leadPort} speed`
              : `set chassis fpc ${target.fpc} pic ${target.pic} port ${target.leadPort} speed ${effectiveValue || "-"}`;
            return (
              <tr key={target.key}>
                <td>
                  <strong>{target.title}</strong>
                  <div className="muted">{target.note}</div>
                </td>
                <td>
                  {target.enabled ? (
                    <select value={value} onChange={(event) => updateSpeed(target, event.target.value)}>
                      {target.speeds.map((speed) => (
                        <option key={speed} value={speed}>{speed.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="muted">{value ? value.toUpperCase() : "Auto"}</span>
                  )}
                </td>
                <td><code>{target.enabled ? command : "-"}</code></td>
                <td>
                  <span className={target.enabled ? "env-status good" : "env-status warn"}>
                    {target.enabled ? setting?.modified === false ? "Committed" : setting?.modified ? "Pending" : "Default" : "Auto-detect"}
                  </span>
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <div className="empty-state">{unsupportedMessage}</div>
      )}
    </Section>
  );
}

function AggregateEthernet({ config, setConfig }) {
  const [selectedNumber, setSelectedNumber] = useState("");
  const aggregate = config.aggregate || { deviceCount: "", interfaces: [] };
  const aeItems = aggregate.interfaces || [];
  const nextAeNumber = () => {
    const used = new Set(aeItems.map((item) => String(item.number)).filter(Boolean));
    let number = 0;
    while (used.has(String(number))) {
      number += 1;
    }
    return String(number);
  };
  const updateAggregate = (patch) => setConfig({ ...config, aggregate: { ...aggregate, ...patch, modified: true } });
  const update = (index, patch) => {
    const interfaces = aeItems.map((item, i) => (i === index ? { ...item, ...patch, modified: true } : item));
    updateAggregate({ interfaces });
  };
  const setMode = (index, mode) => {
    const item = aeItems[index];
    if (mode === "layer3") {
      update(index, { portType: "l3", mode: "access", accessVlan: "", trunkVlans: "", l3VlanId: item.l3VlanId || "", ipv4Mode: item.ipv4Mode || "static", ipv6Addresses: item.ipv6Addresses || "" });
      return;
    }
    update(index, {
      portType: "l2",
      mode,
      unit: "0",
      l3VlanId: "",
      ipAddresses: "",
      ipv6Addresses: "",
      ipv4Mode: "static",
      accessVlan: mode === "access" ? item.accessVlan || defaultAccessVlan(config) : "",
      trunkVlans: mode === "trunk" ? item.trunkVlans : ""
    });
  };
  const addAe = () => {
    const number = nextAeNumber();
    updateAggregate({ interfaces: [...aeItems, { ...newAggregate(defaultAccessVlan(config)), number }] });
    setSelectedNumber(number);
  };
  const activeNumber = aeItems.some((item) => String(item.number) === String(selectedNumber)) ? selectedNumber : aeItems[0]?.number || "";
  const activeIndex = aeItems.findIndex((item) => String(item.number) === String(activeNumber));
  const activeAe = activeIndex >= 0 ? aeItems[activeIndex] : null;
  const deleteActive = () => {
    if (activeIndex < 0) {
      return;
    }
    const interfaces = aeItems.filter((_, index) => index !== activeIndex);
    updateAggregate({ interfaces });
    setSelectedNumber(interfaces[activeIndex]?.number || interfaces[activeIndex - 1]?.number || "");
  };

  return (
    <Section
      title="Aggregate Ethernet"
      icon={AggregateIcon}
      actions={<button onClick={addAe}><Plus size={16} />Add AE</button>}
    >
      <div className="form-grid ae-device-count">
        <Field label="AE Device Count">
          <TextInput value={aggregate.deviceCount || ""} onChange={(event) => updateAggregate({ deviceCount: event.target.value })} placeholder="Example: 4" />
        </Field>
        <div className="field field-action">
          <span>Aggregate Interfaces</span>
          <button type="button" className="primary" onClick={addAe}>
            <Plus size={16} />Add AE
          </button>
        </div>
      </div>
      <div className="interface-split">
        <div className="interface-picker" aria-label="Aggregate Ethernet list">
          {aeItems.length ? aeItems.map((item) => (
            <button
              key={`${item.number}-${item.name}`}
              className={String(item.number) === String(activeNumber) ? "interface-pick selected" : "interface-pick"}
              onClick={() => setSelectedNumber(item.number)}
            >
              <span className="status-dot up" />
              <span>
                <strong>ae{item.number || "?"}</strong>
                <small>{aggregateCandidateLabel(item)}</small>
              </span>
            </button>
          )) : (
            <div className="empty-state">Add an AE to configure LAG, LACP, and Layer 2 or Layer 3 settings.</div>
          )}
        </div>

        <div className="interface-detail">
          {activeAe ? (
            <div className="interface-row detail-row">
              <div className="row-title">
                <Field label="AE Number">
                  <TextInput value={activeAe.number} onChange={(event) => update(activeIndex, { number: event.target.value })} placeholder="0" />
                </Field>
                <Field label="Description">
                  <TextInput value={activeAe.description} onChange={(event) => update(activeIndex, { description: event.target.value })} />
                </Field>
                <button className="icon danger" title="Delete AE" onClick={deleteActive}><Trash2 size={16} /></button>
              </div>

              <div className="interface-current">
                <span>Selected ae{activeAe.number || "?"}</span>
                <span>{activeAe.modified === false ? "Loaded from switch" : "Candidate change"}</span>
                <span>{activeAe.lacpMode && activeAe.lacpMode !== "none" ? `LACP ${activeAe.lacpMode}` : "No LACP"}</span>
              </div>

              <div className="form-grid compact-grid">
                <Field label="Aggregate Mode">
                  <select value={activeAe.lacpMode || "active"} onChange={(event) => update(activeIndex, { lacpMode: event.target.value })}>
                    <option value="none">None</option>
                    <option value="active">LACP active</option>
                    <option value="passive">LACP passive</option>
                  </select>
                </Field>
              </div>
              <div className="mode-group" role="group">
                <button className={activeAe.portType !== "l3" && activeAe.mode === "access" ? "selected" : ""} onClick={() => setMode(activeIndex, "access")}>Access</button>
                <button className={activeAe.portType !== "l3" && activeAe.mode === "trunk" ? "selected" : ""} onClick={() => setMode(activeIndex, "trunk")}>Trunk</button>
                <button className={activeAe.portType === "l3" ? "selected" : ""} onClick={() => setMode(activeIndex, "layer3")}>Layer3</button>
              </div>
              <div className="form-grid">
                <Field label={<span className="label-with-help">Interface MTU <HelpTip text="AE interface MTU. The generated command is set interfaces aeX mtu <value>." /></span>}>
                  <TextInput value={activeAe.mtu || ""} onChange={(event) => update(activeIndex, { mtu: event.target.value })} placeholder="Optional" />
                </Field>
                {(activeAe.portType || "none") === "none" ? (
                  <p className="inline-note">No logical interface family selected. The AE can be committed first, then physical ports can be bundled to it.</p>
                ) : activeAe.portType === "l3" ? (
                  <>
                    <Field label="Unit">
                      <TextInput value={activeAe.unit} onChange={(event) => update(activeIndex, { unit: event.target.value })} />
                    </Field>
                    {String(activeAe.unit || "0") !== "0" ? (
                      <Field label="VLAN ID">
                        <TextInput value={activeAe.l3VlanId || ""} onChange={(event) => update(activeIndex, { l3VlanId: event.target.value })} placeholder="Required for tagged unit" />
                      </Field>
                    ) : null}
                    <Field label="IPv4 Address">
                      <select value={activeAe.ipv4Mode || "static"} onChange={(event) => update(activeIndex, { ipv4Mode: event.target.value, ipAddresses: event.target.value === "dhcp" ? "" : activeAe.ipAddresses })}>
                        <option value="static">Static</option>
                        <option value="dhcp">DHCP</option>
                      </select>
                    </Field>
                    {(activeAe.ipv4Mode || "static") === "static" ? (
                      <Field label="Static IPv4">
                        <TextInput value={activeAe.ipAddresses} onChange={(event) => update(activeIndex, { ipAddresses: event.target.value })} placeholder="192.168.0.99/24" />
                      </Field>
                    ) : null}
                    <Field label="IPv6 Address">
                      <TextInput value={activeAe.ipv6Addresses || ""} onChange={(event) => update(activeIndex, { ipv6Addresses: event.target.value })} placeholder="2001:db8::1/64" />
                    </Field>
                    <Field label="Native VLAN ID">
                      <TextInput value={activeAe.nativeVlan} onChange={(event) => update(activeIndex, { nativeVlan: event.target.value })} placeholder="Optional" />
                    </Field>
                  </>
                ) : activeAe.mode === "access" ? (
                  <>
                    <Field label="Access VLAN">
                      <select value={activeAe.accessVlan} onChange={(event) => update(activeIndex, { accessVlan: event.target.value })}>
                        <option value="">Select VLAN</option>
                        {config.vlans.map((vlan) => <option key={vlan.name} value={vlan.name}>{vlan.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Native VLAN ID">
                      <TextInput value={activeAe.nativeVlan} onChange={(event) => update(activeIndex, { nativeVlan: event.target.value })} placeholder="Optional" />
                    </Field>
                  </>
                ) : (
                  <>
                    <VlanMultiPicker label="Trunk VLANs" vlans={config.vlans} value={activeAe.trunkVlans} onChange={(trunkVlans) => update(activeIndex, { trunkVlans })} />
                    <Field label="Native VLAN ID">
                      <TextInput value={activeAe.nativeVlan} onChange={(event) => update(activeIndex, { nativeVlan: event.target.value })} placeholder="Optional" />
                    </Field>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">No AE selected.</div>
          )}
        </div>
      </div>
    </Section>
  );
}

function SpanningTree({ config, setConfig }) {
  const spanningTree = config.spanningTree || { mode: "none", rstpPriority: "32768", bpduBlockOnEdge: false, vstpGroups: [] };
  const edgeInterfaces = config.interfaces.filter((item) => item.stpEdge && item.portType !== "l3" && item.mode === "access");
  const update = (patch) => setConfig({ ...config, spanningTree: { ...spanningTree, ...patch, modified: true } });
  const updateGroup = (index, patch) => {
    const vstpGroups = (spanningTree.vstpGroups || []).map((group, i) => (i === index ? { ...group, ...patch } : group));
    update({ vstpGroups });
  };

  return (
    <div className="stp-layout">
      <Section title="Spanning Tree" icon={GitBranch}>
        <div className="mode-group" role="group">
          {["none", "rstp", "vstp"].map((mode) => (
            <button key={mode} className={spanningTree.mode === mode ? "selected" : ""} onClick={() => update({ mode })}>
              {mode === "none" ? "None" : mode.toUpperCase()}
            </button>
          ))}
        </div>

        {spanningTree.mode === "rstp" ? (
          <div className="form-grid">
            <Field label="Bridge Priority">
              <select value={spanningTree.rstpPriority} onChange={(event) => update({ rstpPriority: event.target.value })}>
                {bridgePriorities.map((priority) => <option key={priority} value={priority}>{priority === "0" ? "0" : `${Number(priority) / 1024}k (${priority})`}</option>)}
              </select>
            </Field>
            <label className="checkline">
              <input type="checkbox" checked={spanningTree.bpduBlockOnEdge} onChange={(event) => update({ bpduBlockOnEdge: event.target.checked })} />
              BPDU block on edge
            </label>
          </div>
        ) : null}

        {spanningTree.mode === "vstp" ? (
          <div className="vstp-list">
            <label className="checkline">
              <input type="checkbox" checked={spanningTree.bpduBlockOnEdge} onChange={(event) => update({ bpduBlockOnEdge: event.target.checked })} />
              BPDU block on edge
            </label>
            {(spanningTree.vstpGroups || []).map((group, index) => (
              <div className="vstp-group" key={index}>
                <VlanMultiPicker label="VLANs" vlans={config.vlans} value={group.vlans} onChange={(vlans) => updateGroup(index, { vlans })} />
                <Field label="Bridge Priority">
                  <select value={group.priority} onChange={(event) => updateGroup(index, { priority: event.target.value })}>
                    {bridgePriorities.map((priority) => <option key={priority} value={priority}>{priority === "0" ? "0" : `${Number(priority) / 1024}k (${priority})`}</option>)}
                  </select>
                </Field>
                <button className="icon danger" title="Delete" onClick={() => update({ vstpGroups: spanningTree.vstpGroups.filter((_, i) => i !== index) })}><Trash2 size={16} /></button>
              </div>
            ))}
            <button onClick={() => update({ vstpGroups: [...(spanningTree.vstpGroups || []), { vlans: "", priority: "32768" }] })}><Plus size={16} />Add VLAN group</button>
          </div>
        ) : null}
      </Section>

      <Section title="Edge Ports" icon={EthernetPort}>
        <DataTable columns={["Interface", "Access VLAN", "STP Mode"]}>
          {edgeInterfaces.length ? edgeInterfaces.map((item) => (
            <tr key={item.name}>
              <td>{item.name}</td>
              <td>{item.accessVlan || "-"}</td>
              <td>{spanningTree.mode.toUpperCase()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3"><span className="muted">No access interfaces are marked as edge ports.</span></td>
            </tr>
          )}
        </DataTable>
      </Section>
    </div>
  );
}

function Irb({ config, setConfig }) {
  const update = (index, patch) => {
    const irbs = config.irbs.map((irb, i) => (i === index ? { ...irb, ...patch, modified: true } : irb));
    setConfig({ ...config, irbs });
  };
  const updateNested = (index, key, patch) => {
    const current = config.irbs[index]?.[key] || {};
    update(index, { [key]: { ...current, ...patch } });
  };
  return (
    <Section title="IRB Interfaces" icon={Network} actions={<button onClick={() => setConfig({ ...config, irbs: [...config.irbs, newIrb()] })}><Plus size={16} />Add</button>}>
      <DataTable columns={["Unit", "Linked VLAN", "IP Address", "MTU", "Description", ""]}>
        {config.irbs.map((irb, index) => (
          <tr key={index}>
            <td><TextInput value={irb.unit} onChange={(event) => update(index, { unit: event.target.value })} /></td>
            <td>
              <select value={irb.vlan} onChange={(event) => update(index, { vlan: event.target.value })}>
                <option value="">None</option>
                {config.vlans.map((vlan) => <option key={vlan.name} value={vlan.name}>{vlan.name} ({vlan.vlanId})</option>)}
              </select>
            </td>
            <td><TextInput value={irb.address} onChange={(event) => update(index, { address: event.target.value })} /></td>
            <td><TextInput value={irb.mtu || ""} onChange={(event) => update(index, { mtu: event.target.value })} placeholder="Optional" /></td>
            <td><TextInput value={irb.description} onChange={(event) => update(index, { description: event.target.value })} /></td>
            <td><button className="icon" title="Delete" onClick={() => setConfig({ ...config, irbs: config.irbs.filter((_, i) => i !== index) })}><Trash2 size={16} /></button></td>
          </tr>
        ))}
      </DataTable>
      <div className="irb-services">
        {config.irbs.map((irb, index) => (
          <div className="irb-service-card" key={`dhcp-${index}`}>
            <div className="irb-service-head">
              <strong>irb.{irb.unit || index}</strong>
              <span className="muted">DHCP services require this IRB interface.</span>
            </div>
            <div className="form-grid">
              <label className="checkline wide">
                <input type="checkbox" checked={Boolean(irb.dhcpServer?.enabled)} onChange={(event) => updateNested(index, "dhcpServer", { enabled: event.target.checked })} />
                Enable DHCP Server
              </label>
              <label className="checkline wide">
                <input type="checkbox" checked={Boolean(irb.dhcpRelay?.enabled)} onChange={(event) => updateNested(index, "dhcpRelay", { enabled: event.target.checked })} />
                Enable DHCP Relay
              </label>
              {irb.dhcpServer?.enabled ? (
                <>
                  <Field label="Pool Name">
                    <TextInput value={irb.dhcpServer?.poolName || ""} onChange={(event) => updateNested(index, "dhcpServer", { poolName: event.target.value })} placeholder={`IRB_${irb.unit || "X"}_POOL`} />
                  </Field>
                  <Field label="Network">
                    <TextInput value={irb.dhcpServer?.network || ""} onChange={(event) => updateNested(index, "dhcpServer", { network: event.target.value })} placeholder="192.168.10.0/24" />
                  </Field>
                  <Field label="Range Low">
                    <TextInput value={irb.dhcpServer?.rangeLow || ""} onChange={(event) => updateNested(index, "dhcpServer", { rangeLow: event.target.value })} placeholder="192.168.10.10" />
                  </Field>
                  <Field label="Range High">
                    <TextInput value={irb.dhcpServer?.rangeHigh || ""} onChange={(event) => updateNested(index, "dhcpServer", { rangeHigh: event.target.value })} placeholder="192.168.10.200" />
                  </Field>
                  <Field label="Default Gateway">
                    <TextInput value={irb.dhcpServer?.router || ""} onChange={(event) => updateNested(index, "dhcpServer", { router: event.target.value })} placeholder="192.168.10.1" />
                  </Field>
                  <Field label="DNS Servers">
                    <TextInput value={irb.dhcpServer?.dns || ""} onChange={(event) => updateNested(index, "dhcpServer", { dns: event.target.value })} placeholder="8.8.8.8,1.1.1.1" />
                  </Field>
                </>
              ) : null}
              {irb.dhcpRelay?.enabled ? (
                <Field label="Relay Servers">
                  <TextInput value={irb.dhcpRelay?.servers || ""} onChange={(event) => updateNested(index, "dhcpRelay", { servers: event.target.value })} placeholder="192.0.2.10,192.0.2.11" />
                </Field>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Routing({ config, setConfig, deviceSnapshot }) {
  const update = (index, patch) => {
    const staticRoutes = config.staticRoutes.map((route, i) => (i === index ? { ...route, ...patch, modified: true } : route));
    setConfig({ ...config, staticRoutes });
  };
  const activeStaticRoutes = parseStaticRouteRows(deviceSnapshot?.staticRoutesText);
  return (
    <div className="stp-layout">
      <Section title="Active Static Route Configuration" icon={Route}>
        <DataTable columns={["Route", "Next-Hop", "Instance"]}>
          {activeStaticRoutes.length ? activeStaticRoutes.map((route, index) => (
            <tr key={`${route.instance}-${route.route}-${index}`}>
              <td>{route.route}</td>
              <td>{route.nextHop}</td>
              <td>{route.instance}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3"><span className="muted">No active static routes loaded. Use Refresh after connecting.</span></td>
            </tr>
          )}
        </DataTable>
      </Section>
      <Section title="Static Routes" icon={Route} actions={<button onClick={() => setConfig({ ...config, staticRoutes: [...config.staticRoutes, { prefix: "", nextHop: "", qualifiedNextHop: "", qualifiedPreference: "10", routingInstance: "", modified: true }] })}><Plus size={16} />Add</button>}>
        <DataTable columns={["Prefix", "Next Hop", "Qualified Next-Hop", "Routing Instance", ""]}>
          {config.staticRoutes.map((route, index) => (
            <tr key={index}>
              <td><TextInput value={route.prefix} onChange={(event) => update(index, { prefix: event.target.value })} placeholder="0.0.0.0/0" /></td>
              <td><TextInput value={route.nextHop} onChange={(event) => update(index, { nextHop: event.target.value })} /></td>
              <td><TextInput value={route.qualifiedNextHop || ""} onChange={(event) => update(index, { qualifiedNextHop: event.target.value, qualifiedPreference: "10" })} placeholder="Optional, preference 10" /></td>
              <td>
                <select value={route.routingInstance || ""} onChange={(event) => update(index, { routingInstance: event.target.value })}>
                  <option value="">default</option>
                  <option value="mgmt_junos">mgmt_junos</option>
                </select>
              </td>
              <td><button className="icon" title="Delete" onClick={() => setConfig({ ...config, staticRoutes: config.staticRoutes.filter((_, i) => i !== index) })}><Trash2 size={16} /></button></td>
            </tr>
          ))}
        </DataTable>
      </Section>
    </div>
  );
}

function Monitoring({ connection }) {
  const tabs = [
    { id: "vlan", label: "VLAN", command: "show vlan" },
    { id: "route", label: "Route", command: "show route" },
    { id: "arp", label: "ARP", command: "show arp" },
    { id: "dhcpBinding", label: "DHCP Bindings", command: "show dhcp server binding" },
    { id: "lacp", label: "LACP", command: "show lacp interfaces" },
    { id: "spanningTree", label: "Spanning Tree", command: "show spanning-tree bridge" },
    { id: "virtualChassis", label: "Virtual Chassis", command: "show virtual-chassis status" },
    { id: "lldpNeighbors", label: "LLDP Neighbors", command: "show lldp neighbors" }
  ];
  const [activeTab, setActiveTab] = useState("vlan");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  async function refresh(tab = activeTab) {
    setBusy(true);
    setStatus(`Running ${tabs.find((item) => item.id === tab)?.command || "monitor command"}...`);
    try {
      const response = await window.miniJweb.getMonitor({ connection, view: tab });
      setOutput(response.output || "No output returned.");
      setStatus(`${response.command} completed.`);
    } catch (error) {
      setOutput("");
      setStatus(error.message || "Monitoring refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (connection.host && connection.username && connection.password) {
      refresh(activeTab);
    }
  }, [activeTab]);

  return (
    <Section
      title="Monitoring"
      icon={Activity}
      actions={<button onClick={() => refresh(activeTab)} disabled={busy}><RefreshCw size={16} />Refresh</button>}
    >
      <div className="monitor-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "selected" : ""} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <p className="status-text">{status || `Ready to run ${current.command}.`}</p>
      <pre className="config-preview monitor-preview">{output || "Connect to a switch, then press Refresh."}</pre>
    </Section>
  );
}

function FirmwareUpgrade({ connection }) {
  const [file, setFile] = useState(null);
  const [precheck, setPrecheck] = useState(null);
  const [status, setStatus] = useState("");
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [noValidate, setNoValidate] = useState(false);
  const [remoteFile, setRemoteFile] = useState(null);
  const [overwriteRemote, setOverwriteRemote] = useState(false);
  const [upgradeComplete, setUpgradeComplete] = useState(false);

  useEffect(() => {
    if (!window.miniJweb?.onFirmwareUploadProgress) {
      return undefined;
    }
    return window.miniJweb.onFirmwareUploadProgress((progress) => {
      setUploadProgress(progress);
    });
  }, []);

  const appendLog = (text) => {
    setLog((current) => [current, text].filter(Boolean).join("\n\n"));
  };
  const varTmp = precheck?.storage?.varTmp;
  const freeBytes = parseStorageSize(varTmp?.available);
  const requiredBytes = file?.size ? Math.round(file.size * 1.2) : null;
  const storageLow = Boolean(file?.size && freeBytes !== null && freeBytes < requiredBytes);

  async function chooseFile() {
    setStatus("Selecting firmware package...");
    try {
      const selected = await window.miniJweb.chooseFirmwareFile();
      if (selected?.canceled) {
        setStatus("File selection cancelled.");
        return;
      }
      setFile(selected);
      setUploadProgress(null);
      setRemoteFile(null);
      setOverwriteRemote(false);
      setUpgradeComplete(false);
      setStatus(`Selected ${selected.name}.`);
    } catch (error) {
      setStatus(error.message || "Failed to select firmware package.");
    }
  }

  async function runPrecheck() {
    setBusy(true);
    setStatus("Running firmware pre-check...");
    try {
      const response = await window.miniJweb.runAction({ connection, action: { type: "firmwarePrecheck" } });
      setPrecheck(response);
      setStatus(response.sftpEnabled ? "Pre-check completed. SFTP is enabled." : "Pre-check completed. Enable SFTP before upload.");
      appendLog([
        "Pre-check completed.",
        `SFTP server: ${response.sftpEnabled ? "enabled" : "disabled"}`,
        response.storage?.varTmp ? `/var/tmp available: ${response.storage.varTmp.available}` : "Unable to identify /var/tmp free space."
      ].join("\n"));
    } catch (error) {
      setStatus(error.message || "Firmware pre-check failed.");
    } finally {
      setBusy(false);
    }
  }

  async function setSftp(enabled) {
    const command = enabled ? "set system services ssh sftp-server" : "delete system services ssh sftp-server";
    const confirmed = window.confirm(`${enabled ? "Enable" : "Disable"} SFTP server?\n\nThis will commit:\n${command}`);
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus(enabled ? "Enabling SFTP server..." : "Disabling SFTP server...");
    try {
      const response = await window.miniJweb.commit({ connection, setCommands: [command] });
      appendLog(`${command}\n${response.message || "Commit completed."}`);
      await runPrecheck();
    } catch (error) {
      setStatus(error.message || "SFTP configuration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function cleanStorage() {
    const confirmed = window.confirm("Clean storage on the switch?\n\nThis runs request system storage cleanup no-confirm. Junos removes temporary files and old storage cleanup candidates.");
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus("Cleaning switch storage...");
    try {
      const response = await window.miniJweb.runAction({ connection, action: { type: "firmwareCleanStorage" } });
      appendLog(`${response.command}\n${response.output}`);
      await runPrecheck();
    } catch (error) {
      setStatus(error.message || "Storage cleanup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile() {
    if (!file) {
      setStatus("Select a firmware package first.");
      return;
    }
    setBusy(true);
    if (!overwriteRemote) {
      try {
        const existing = await window.miniJweb.checkFirmwareRemoteFile({ connection, fileName: file.name });
        setRemoteFile(existing);
        if (existing.exists) {
          setStatus("Package already exists in /var/tmp. Start upgrade with the existing file, or enable overwrite before uploading.");
          return;
        }
      } catch (error) {
        setStatus(error.message || "Remote file check failed.");
        return;
      } finally {
        setBusy(false);
      }
      setBusy(true);
    }
    setStatus(`${overwriteRemote ? "Overwriting" : "Uploading"} ${file.name} in /var/tmp...`);
    setUploadProgress({ fileName: file.name, transferred: 0, total: file.size, percent: 0 });
    try {
      const response = await window.miniJweb.uploadFirmware({ connection, filePath: file.path, overwrite: overwriteRemote });
      appendLog(`Uploaded ${response.fileName} to ${response.remotePath}.`);
      setRemoteFile({ ok: true, exists: true, fileName: response.fileName, remotePath: response.remotePath, size: response.size });
      setStatus("Upload completed.");
    } catch (error) {
      setStatus(error.message || "Firmware upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function checkRemoteFile() {
    if (!file) {
      setStatus("Select a firmware package first.");
      return;
    }
    setBusy(true);
    setStatus(`Checking /var/tmp/${file.name}...`);
    try {
      const response = await window.miniJweb.checkFirmwareRemoteFile({ connection, fileName: file.name });
      setRemoteFile(response);
      setStatus(response.exists ? "Package already exists on the switch." : "Package is not present in /var/tmp yet.");
    } catch (error) {
      setStatus(error.message || "Remote file check failed.");
    } finally {
      setBusy(false);
    }
  }

  async function installFirmware() {
    if (!file) {
      setStatus("Select and upload a firmware package first.");
      return;
    }
    const command = `request system software add ${noValidate ? "no-validate " : ""}/var/tmp/${file.name}`;
    const confirmed = window.confirm(`Start Junos software install?\n\nThis may take several minutes.\n\n${command}`);
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus("Running Junos software install. Keep the app open while output is collected...");
    try {
      const response = await window.miniJweb.runAction({ connection, action: { type: "firmwareInstall", fileName: file.name, noValidate } });
      appendLog(`${response.command}\n${response.output}`);
      const output = String(response.output || "");
      const complete = /pending.*activated at next reboot|reboot.*required|install command completed|software install command completed/i.test(output);
      setUpgradeComplete(complete);
      setStatus(complete ? "Upgrade Complete - Reboot Required." : "Install command completed. Review the log before reboot.");
    } catch (error) {
      setStatus(error.message || "Firmware install failed.");
    } finally {
      setBusy(false);
    }
  }

  async function rebootAfterInstall() {
    const confirmed = window.confirm("Reboot this switch in 1 minute after firmware install?");
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus("Requesting reboot...");
    try {
      const response = await window.miniJweb.runAction({ connection, action: { type: "reboot" } });
      appendLog(`${response.command}\n${response.output}`);
      setStatus("Reboot request sent. Reconnect after the switch returns.");
    } catch (error) {
      setStatus(error.message || "Reboot request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function snapshotAlternate() {
    const confirmed = window.confirm("Run snapshot to alternate slice?\n\nRun this only after the switch has booted successfully into the new Junos version.");
    if (!confirmed) {
      return;
    }
    setBusy(true);
    setStatus("Running alternate slice snapshot...");
    try {
      const response = await window.miniJweb.runAction({ connection, action: { type: "snapshotAlternate" } });
      appendLog(`${response.command}\n${response.output}`);
      setStatus("Snapshot command completed.");
    } catch (error) {
      setStatus(error.message || "Snapshot command failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="firmware-layout">
      <div className="guidance-panel">
        <strong>Firmware Upgrade</strong>
        <p>Select a local Junos package, upload it to /var/tmp with SFTP, then run the Junos software add workflow. Reboot and snapshot are separate operator-confirmed steps.</p>
      </div>
      {upgradeComplete ? (
        <div className="guidance-panel success">
          <strong>Upgrade Complete - Reboot Required</strong>
          <p>Junos accepted the install command and the pending software set should activate on the next reboot. Use Reboot Switch when you are ready for the maintenance window, then reconnect and run Snapshot Alternate Slice after the new version boots correctly.</p>
        </div>
      ) : null}

      <div className="firmware-steps">
        <div className="firmware-step">
          <span>1</span>
          <strong>Select Image</strong>
          <p>{file ? `${file.name} (${formatBytes(file.size)})` : "No package selected."}</p>
          <button onClick={chooseFile} disabled={busy}><Upload size={16} />Choose File</button>
        </div>

        <div className="firmware-step">
          <span>2</span>
          <strong>Pre-check</strong>
          <p>SFTP: {precheck ? (precheck.sftpEnabled ? "Enabled" : "Disabled") : "Not checked"} | /var/tmp: {varTmp?.available || "Not checked"}</p>
          <div className="section-actions">
            <button onClick={runPrecheck} disabled={busy}>Run Pre-check</button>
            <button onClick={() => setSftp(true)} disabled={busy || precheck?.sftpEnabled}>Enable SFTP</button>
            <button onClick={cleanStorage} disabled={busy}>Clean Storage</button>
          </div>
          {storageLow ? <p className="inline-warning">Available /var/tmp storage is below package size plus 20% safety buffer.</p> : null}
        </div>

        <div className="firmware-step">
          <span>3</span>
          <strong>Upload</strong>
          <p>
            Target: {file?.remotePath || "/var/tmp/<package>"}
            {remoteFile ? ` | Remote file: ${remoteFile.exists ? `exists${remoteFile.size ? ` (${formatBytes(remoteFile.size)})` : ""}` : "not found"}` : ""}
          </p>
          <div className="firmware-install-actions">
            <button onClick={checkRemoteFile} disabled={busy || !file || !precheck?.sftpEnabled}>Check /var/tmp</button>
            {remoteFile?.exists ? (
              <label className="checkline">
                <input type="checkbox" checked={overwriteRemote} onChange={(event) => setOverwriteRemote(event.target.checked)} />
                Overwrite existing file
              </label>
            ) : null}
            <button className="primary" onClick={uploadFile} disabled={busy || !file || !precheck?.sftpEnabled || storageLow || (remoteFile?.exists && !overwriteRemote)}><Upload size={16} />Upload to /var/tmp</button>
          </div>
          {remoteFile?.exists && !overwriteRemote ? <p className="inline-warning">This package already exists in /var/tmp. You can skip upload and start upgrade, or choose overwrite to replace it.</p> : null}
          {uploadProgress ? (
            <div className="progress-wrap">
              <div className="progress-bar"><span style={{ width: `${uploadProgress.percent || 0}%` }} /></div>
              <small>{uploadProgress.percent || 0}% ({formatBytes(uploadProgress.transferred)} / {formatBytes(uploadProgress.total)})</small>
            </div>
          ) : null}
        </div>

        <div className="firmware-step">
          <span>4</span>
          <strong>Install</strong>
          <p>{file ? `request system software add ${noValidate ? "no-validate " : ""}/var/tmp/${file.name}` : "Select a package to preview the install command."}</p>
          <div className="firmware-install-actions">
            <label className="checkline">
              <input type="checkbox" checked={noValidate} onChange={(event) => setNoValidate(event.target.checked)} />
              Use no-validate
            </label>
            {noValidate ? <p className="inline-warning">Use only when Junos validation fails and explicitly recommends no-validate.</p> : null}
            <button className="primary" onClick={installFirmware} disabled={busy || !file}>Start Upgrade</button>
          </div>
        </div>

        <div className="firmware-step">
          <span>5</span>
          <strong>Reboot and Snapshot</strong>
          <p>After the switch boots into the new version, run snapshot to copy it to the alternate slice.</p>
          <div className="section-actions">
            <button className={upgradeComplete ? "primary" : "danger"} onClick={rebootAfterInstall} disabled={busy}><Power size={16} />Reboot Switch</button>
            <button onClick={snapshotAlternate} disabled={busy}>Snapshot Alternate Slice</button>
            <button onClick={() => setSftp(false)} disabled={busy || precheck?.sftpEnabled === false}>Disable SFTP</button>
          </div>
        </div>
      </div>

      <p className="status-text">{status || "Run pre-check before uploading firmware."}</p>
      <pre className="config-preview monitor-preview tool-output">{log || "Firmware upgrade log will appear here."}</pre>
    </div>
  );
}

function Management({ config, setConfig, connection, deviceSnapshot }) {
  const mgmt = config.management;
  const [activeTab, setActiveTab] = useState("oob");
  const [toolState, setToolState] = useState({ source: "", destination: "", routingInstance: "" });
  const [toolOutput, setToolOutput] = useState("");
  const [toolStatus, setToolStatus] = useState("");
  const [toolBusy, setToolBusy] = useState(false);
  const routingInstances = useMemo(() => {
    const names = new Set(["", ...(deviceSnapshot?.routingInstances || [])]);
    return Array.from(names);
  }, [deviceSnapshot]);
  const update = (patch) => setConfig({ ...config, management: { ...mgmt, ...patch, modified: true } });
  const updateLocalManagement = (patch) => setConfig({ ...config, management: { ...mgmt, ...patch } });
  const updateSystem = (patch) => updateLocalManagement({ system: { ...(mgmt.system || {}), ...patch, modified: true } });
  const updateTool = (patch) => setToolState((current) => ({ ...current, ...patch }));
  const tabs = [
    { id: "oob", label: "OOB" },
    { id: "system", label: "System" },
    { id: "reboot", label: "Reboot" },
    { id: "ping", label: "Ping Test" },
    { id: "traceroute", label: "Trace Route" },
    { id: "firmware", label: "Firmware Upgrade" },
    { id: "users", label: "Create User" },
    { id: "revertTimer", label: "Revert Timer" }
  ];

  async function runTool(type) {
    setToolBusy(true);
    setToolStatus(type === "ping" ? "Running ping..." : "Running traceroute...");
    setToolOutput("");
    try {
      const response = await window.miniJweb.runAction({
        connection,
        action: { type, ...toolState }
      });
      setToolOutput(response.output || "No output returned.");
      setToolStatus(`${response.command} completed.`);
    } catch (error) {
      setToolStatus(error.message || "Testing command failed.");
    } finally {
      setToolBusy(false);
    }
  }

  async function rebootDevice() {
    const confirmed = window.confirm("Reboot this switch in 1 minute? Unsaved candidate changes should be committed or reverted first.");
    if (!confirmed) {
      return;
    }
    setToolBusy(true);
    setToolStatus("Requesting system reboot...");
    setToolOutput("");
    try {
      const response = await window.miniJweb.runAction({
        connection,
        action: { type: "reboot" }
      });
      setToolOutput(response.output || "Reboot requested.");
      setToolStatus("Reboot request sent.");
    } catch (error) {
      setToolStatus(error.message || "Reboot request failed.");
    } finally {
      setToolBusy(false);
    }
  }

  function updateUser(index, patch) {
    const users = mgmt.users || [];
    updateLocalManagement({
      users: users.map((user, itemIndex) => itemIndex === index ? { ...user, ...patch, modified: true } : user)
    });
  }

  function addUser() {
    updateLocalManagement({
      users: [...(mgmt.users || []), { username: "", password: "", privilege: "read-only", modified: true }]
    });
  }

  function deleteUser(index) {
    updateLocalManagement({ users: (mgmt.users || []).filter((_, itemIndex) => itemIndex !== index) });
  }

  const system = mgmt.system || { hostName: "", nameServers: "", activeNameServers: [], ntpServers: "", timeZone: "Asia/Bangkok" };
  const ntpUsesFqdn = selectedVlans(system.ntpServers).some((server) => !/^(\d{1,3}\.){3}\d{1,3}$/.test(server));
  const needsDnsFirst = ntpUsesFqdn && !(system.activeNameServers || []).length;

  return (
    <Section title="Management" icon={ShieldCheck}>
      <div className="monitor-tabs management-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "selected" : ""} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "oob" ? (
        <div className="form-grid">
          <label className="checkline wide">
            <input type="checkbox" checked={mgmt.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
            Enable dedicated Junos management instance mgmt_junos
          </label>
          <Field label="Management Interface">
            <select value={mgmt.interfaceName} onChange={(event) => update({ interfaceName: event.target.value })}>
              <option value="me0">me0</option>
              <option value="vme">vme</option>
            </select>
          </Field>
          <Field label="IPv4 Address">
            <select value={mgmt.ipv4Mode || "static"} onChange={(event) => update({ ipv4Mode: event.target.value, address: event.target.value === "dhcp" ? "" : mgmt.address })}>
              <option value="static">Static</option>
              <option value="dhcp">DHCP</option>
            </select>
          </Field>
          {(mgmt.ipv4Mode || "static") === "static" ? (
            <Field label="Address">
              <TextInput value={mgmt.address} onChange={(event) => update({ address: event.target.value })} placeholder="x.x.x.x/24" />
            </Field>
          ) : null}
          <Field label="Default Gateway">
            <TextInput value={mgmt.gateway} onChange={(event) => update({ gateway: event.target.value })} placeholder="x.x.x.x" />
          </Field>
        </div>
      ) : null}
      {activeTab === "system" ? (
        <div className="tool-panel">
          <div className="form-grid">
            <Field label="System Hostname">
              <TextInput value={system.hostName || ""} onChange={(event) => updateSystem({ hostName: event.target.value })} placeholder="ex4100-access-01" />
            </Field>
            <Field label="Name Server">
              <TextInput value={system.nameServers || ""} onChange={(event) => updateSystem({ nameServers: event.target.value })} placeholder="8.8.8.8,1.1.1.1" />
            </Field>
            <Field label="NTP Server">
              <TextInput value={system.ntpServers || ""} onChange={(event) => updateSystem({ ntpServers: event.target.value })} placeholder="time.google.com or 8.8.8.8" />
            </Field>
            <Field label="Time Zone">
              <TextInput value={system.timeZone || "Asia/Bangkok"} onChange={(event) => updateSystem({ timeZone: event.target.value })} placeholder="Asia/Bangkok" />
            </Field>
          </div>
          {needsDnsFirst ? (
            <p className="inline-warning">NTP FQDN needs name-server committed first. Commit name-server, refresh, then add the NTP FQDN.</p>
          ) : (
            <p className="status-text">Hostname, DNS, NTP, and time zone are staged as candidate configuration.</p>
          )}
        </div>
      ) : null}
      {activeTab === "reboot" ? (
        <div className="tool-panel">
          <p className="status-text">Send an operational reboot request to the connected switch. The app will ask for confirmation before sending.</p>
          <button className="danger" onClick={rebootDevice} disabled={toolBusy}><Power size={16} />Reboot Device</button>
          <p className="status-text">{toolStatus}</p>
          {toolOutput ? <pre className="config-preview monitor-preview tool-output">{toolOutput}</pre> : null}
        </div>
      ) : null}
      {activeTab === "ping" || activeTab === "traceroute" ? (
        <div className="tool-panel">
          <div className="form-grid">
            <Field label="Destination">
              <TextInput value={toolState.destination} onChange={(event) => updateTool({ destination: event.target.value })} placeholder="8.8.8.8 or host.example.com" />
            </Field>
            <Field label="Source">
              <TextInput value={toolState.source} onChange={(event) => updateTool({ source: event.target.value })} placeholder="Optional source address" />
            </Field>
            <Field label="Routing Instance">
              <select value={toolState.routingInstance} onChange={(event) => updateTool({ routingInstance: event.target.value })}>
                {routingInstances.map((name) => (
                  <option key={name || "default"} value={name}>{name || "default"}</option>
                ))}
              </select>
            </Field>
          </div>
          <button className="primary" onClick={() => runTool(activeTab)} disabled={toolBusy || !toolState.destination}>
            <Terminal size={16} />
            {activeTab === "ping" ? "Run Ping" : "Run Traceroute"}
          </button>
          <p className="status-text">{toolStatus || (activeTab === "ping" ? "Ping will run with count 5." : "Traceroute uses no-resolve.")}</p>
          <pre className="config-preview monitor-preview tool-output">{toolOutput || "Output will appear here."}</pre>
        </div>
      ) : null}
      {activeTab === "firmware" ? (
        <FirmwareUpgrade connection={connection} />
      ) : null}
      {activeTab === "users" ? (
        <div className="stp-layout">
          <div className="section-actions">
            <button onClick={addUser}><Plus size={16} />Add User</button>
          </div>
          <DataTable columns={["Username", "Password", "Privilege", ""]}>
            {(mgmt.users || []).map((user, index) => (
              <tr key={index}>
                <td><TextInput value={user.username} onChange={(event) => updateUser(index, { username: event.target.value })} placeholder="operator1" /></td>
                <td><input type="password" value={user.password} onChange={(event) => updateUser(index, { password: event.target.value })} placeholder="Password" /></td>
                <td>
                  <select value={user.privilege || "read-only"} onChange={(event) => updateUser(index, { privilege: event.target.value })}>
                    <option value="read-only">read-only</option>
                    <option value="super-user">superuser</option>
                  </select>
                </td>
                <td><button className="icon danger" title="Delete" onClick={() => deleteUser(index)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {(mgmt.users || []).length === 0 ? (
              <tr>
                <td colSpan="4"><span className="muted">No new local users staged.</span></td>
              </tr>
            ) : null}
          </DataTable>
          <p className="status-text">New users are staged as candidate configuration. Use Check and Commit on the top bar when ready.</p>
        </div>
      ) : null}
      {activeTab === "revertTimer" ? (
        <div className="tool-panel">
          <div className="form-grid">
            <Field label="Commit Confirm Timer">
              <TextInput value={mgmt.revertTimer || "10"} onChange={(event) => updateLocalManagement({ revertTimer: event.target.value })} placeholder="10" />
            </Field>
          </div>
          <p className="status-text">This timer is used by the top Commit Confirm button. You must commit again before the timer expires to keep the change.</p>
        </div>
      ) : null}
    </Section>
  );
}

function Lldp({ config, setConfig }) {
  const update = (patch) => setConfig({ ...config, lldp: { ...config.lldp, ...patch, modified: true } });
  return (
    <Section title="LLDP" icon={LldpIcon}>
      <div className="form-grid">
        <label className="checkline wide">
          <input type="checkbox" checked={config.lldp.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
          Enable LLDP
        </label>
        <label className="checkline wide">
          <input type="checkbox" checked={config.lldp.med} onChange={(event) => update({ med: event.target.checked })} />
          Enable LLDP-MED
        </label>
        <Field label="Interfaces">
          <TextInput value={config.lldp.interfaces} onChange={(event) => update({ interfaces: event.target.value })} placeholder="all or ge-0/0/1,ge-0/0/2" />
        </Field>
      </div>
    </Section>
  );
}

function Commit({ commands, errors, connection, onCommitted }) {
  const [result, setResult] = useState("");
  const [activeConfig, setActiveConfig] = useState("");
  const [busy, setBusy] = useState(false);

  const payload = { connection, setCommands: commands };

  async function run(action) {
    setBusy(true);
    setResult(action === "check" ? "Running commit-check..." : "Committing candidate...");
    try {
      const response = action === "check" ? await window.miniJweb.commitCheck(payload) : await window.miniJweb.commit(payload);
      setResult(response.message);
      if (action === "commit" && response.ok && onCommitted) {
        await onCommitted("Commit completed. Snapshot refreshed.");
      }
    } catch (error) {
      setResult(error.message || "NETCONF action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function loadActiveConfig() {
    setBusy(true);
    setResult("Loading active configuration...");
    try {
      const response = await window.miniJweb.getActiveConfig(connection);
      setActiveConfig(response || "No active configuration returned.");
      setResult("Active configuration loaded.");
    } catch (error) {
      setResult(error.message || "Failed to load active configuration.");
    } finally {
      setBusy(false);
    }
  }

  function downloadSetFile() {
    const blob = new Blob([commands.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mini-jweb-ex.set";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="commit-page">
      <div className="commit-layout">
      <Section title="Candidate Preview" icon={FileCode2}>
        {errors.length ? (
          <div className="error-list">
            {errors.map((error) => <p key={error}>{error}</p>)}
          </div>
        ) : null}
        <pre className="config-preview">{commands.join("\n")}</pre>
      </Section>
      <Section title="Commit Actions" icon={Save}>
        <div className="commit-actions">
          <button onClick={downloadSetFile}><Download size={16} />Export set file</button>
          <button onClick={loadActiveConfig} disabled={busy}><FileCode2 size={16} />Active Configuration</button>
          <button onClick={() => run("check")} disabled={busy || errors.length > 0}><ClipboardCheck size={16} />Commit check</button>
          <button className="primary" onClick={() => run("commit")} disabled={busy || errors.length > 0}><Save size={16} />Commit</button>
        </div>
        <p className="status-text">{result || "Commit-check and commit use NETCONF candidate configuration on the switch."}</p>
      </Section>
      </div>
      {activeConfig ? (
        <Section title="Active Configuration" icon={FileCode2}>
          <pre className="config-preview active-preview">{activeConfig}</pre>
        </Section>
      ) : null}
    </div>
  );
}

function App() {
  const [active, setActive] = useState("deviceAccess");
  const [config, setConfigState] = useState(defaultConfig);
  const [dirty, setDirty] = useState(false);
  const [connection, setConnection] = useState(initialConnection);
  const [deviceProfiles, setDeviceProfiles] = useState(loadDeviceProfiles);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [deviceSnapshot, setDeviceSnapshot] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [topCommitStatus, setTopCommitStatus] = useState("");
  const [topCommitBusy, setTopCommitBusy] = useState(false);
  const [topRefreshBusy, setTopRefreshBusy] = useState(false);
  const [navigationCollapsed, setNavigationCollapsed] = useState(() => localStorage.getItem(navigationCollapsedStorageKey) === "true");
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const commands = useMemo(() => buildSetCommands(config), [config]);
  const errors = useMemo(() => validateConfig(config), [config]);
  const topCommitTone = actionStatusTone(topCommitStatus);

  useEffect(() => {
    if (!topCommitStatus || topCommitTone !== "success") {
      return undefined;
    }
    const timer = window.setTimeout(() => setTopCommitStatus(""), 5000);
    return () => window.clearTimeout(timer);
  }, [topCommitStatus, topCommitTone]);

  const setCandidateConfig = (nextConfig) => {
    setDirty(true);
    setConfigState(nextConfig);
  };

  const setCleanConfig = (nextConfig) => {
    setDirty(false);
    setConfigState(nextConfig);
  };

  function rememberProfile(nextConnection) {
    if (nextConnection.remember) {
      const nextProfiles = upsertDeviceProfile(deviceProfiles, nextConnection);
      setDeviceProfiles(nextProfiles);
      saveDeviceProfiles(nextProfiles);
      localStorage.setItem(credentialsStorageKey, JSON.stringify(normalizeConnectionProfile({ ...nextConnection, remember: true })));
    } else {
      localStorage.removeItem(credentialsStorageKey);
    }
  }

  async function connectToSwitch(nextConnection = connection, options = {}) {
    const normalized = normalizeConnectionProfile(nextConnection);
    setConnection(normalized);
    setConnectionBusy(true);
    setConnectionStatus("Connecting with NETCONF...");
    setTopCommitStatus("");
    try {
      const result = await window.miniJweb.inspectDevice(normalized);
      setDeviceInfo(result);
      if (!result.ok) {
        setConnectionStatus("Connected, but device verification found warnings.");
        return;
      }
      rememberProfile(normalized);
      setConnectionStatus("Connected. Loading current interfaces and VLANs...");
      const snapshot = await window.miniJweb.getSnapshot(normalized);
      setDeviceSnapshot(snapshot);
      setCleanConfig(configFromSnapshot(snapshot, defaultConfig));
      setConnectionStatus("Connected. Current interfaces and VLANs loaded from the switch.");
      if (options.navigate !== false) {
        setActive("dashboard");
      }
    } catch (error) {
      setDeviceInfo(null);
      setDeviceSnapshot(null);
      setConnectionStatus(error.message || "Connection failed.");
    } finally {
      setConnectionBusy(false);
    }
  }

  function disconnectFromDevice() {
    if (dirty && !window.confirm("Disconnect and discard local pending changes?")) {
      return;
    }
    setDeviceInfo(null);
    setDeviceSnapshot(null);
    setCleanConfig(defaultConfig);
    setConnectionStatus("Disconnected. Select a profile or enter switch details when ready.");
    setActive("deviceAccess");
  }

  function selectDeviceProfile(key) {
    const profile = deviceProfiles.find((item) => profileKey(item) === key);
    if (!profile) {
      return;
    }
    if (dirty && !window.confirm("Switch profile and discard local pending changes?")) {
      return;
    }
    setConnection(profile);
    setDeviceInfo(null);
    setDeviceSnapshot(null);
    setCleanConfig(defaultConfig);
    setConnectionStatus(`Profile selected: ${profileLabel(profile)}.`);
  }

  function deleteDeviceProfile(key) {
    const profile = deviceProfiles.find((item) => profileKey(item) === key);
    if (!profile) {
      return;
    }
    const confirmed = window.confirm(`Delete saved profile?\n\n${profileLabel(profile)}`);
    if (!confirmed) {
      return;
    }
    const nextProfiles = deviceProfiles.filter((item) => profileKey(item) !== key);
    setDeviceProfiles(nextProfiles);
    saveDeviceProfiles(nextProfiles);
    try {
      const remembered = normalizeConnectionProfile(JSON.parse(localStorage.getItem(credentialsStorageKey) || "{}"));
      if (profileKey(remembered) === key) {
        localStorage.removeItem(credentialsStorageKey);
      }
    } catch (_error) {
      localStorage.removeItem(credentialsStorageKey);
    }
    setConnectionStatus(`Deleted saved profile: ${profileLabel(profile)}.`);
  }

  async function loadSwitchSnapshot(successMessage = "Refresh completed.", targetConnection = connection) {
    const result = await window.miniJweb.inspectDevice(targetConnection);
    setDeviceInfo(result);
    const snapshot = await window.miniJweb.getSnapshot(targetConnection);
    setDeviceSnapshot(snapshot);
    setCleanConfig(configFromSnapshot(snapshot, defaultConfig));
    setTopCommitStatus(successMessage);
  }

  async function refreshFromSwitch() {
    setTopRefreshBusy(true);
    setTopCommitStatus("Refreshing from switch...");
    try {
      await loadSwitchSnapshot("Refresh completed.");
    } catch (error) {
      setTopCommitStatus(error.message || "Refresh failed.");
    } finally {
      setTopRefreshBusy(false);
    }
  }

  async function revertCandidate() {
    setTopCommitBusy(true);
    setTopCommitStatus("Reverting candidate...");
    try {
      const response = await window.miniJweb.revertCandidate(connection);
      await loadSwitchSnapshot(response.message || "Candidate reverted.");
    } catch (error) {
      setTopCommitStatus(error.message || "Revert failed.");
    } finally {
      setTopCommitBusy(false);
    }
  }

  async function runTopCommit(action) {
    setTopCommitBusy(true);
    setTopCommitStatus(action === "check" ? "Commit-check running..." : action === "confirm" ? "Commit confirmed running..." : "Commit running...");
    try {
      const timer = config.management?.revertTimer || "10";
      if (action === "confirm") {
        const accepted = window.confirm(`Commit confirmed will automatically roll back unless you press Commit within ${timer} minute(s). Continue?`);
        if (!accepted) {
          setTopCommitStatus("Commit confirmed cancelled.");
          return;
        }
      }
      const payload = { connection, setCommands: commands, confirmed: action === "confirm", confirmTimeout: timer };
      const response = action === "check" ? await window.miniJweb.commitCheck(payload) : await window.miniJweb.commit(payload);
      setTopCommitStatus(response.message);
      if (action === "commit" && response.ok) {
        await loadSwitchSnapshot("Commit completed. Snapshot refreshed.");
      }
    } catch (error) {
      setTopCommitStatus(error.message || "NETCONF action failed.");
    } finally {
      setTopCommitBusy(false);
    }
  }

  const screen = {
    dashboard: <Dashboard config={config} commands={commands} errors={errors} deviceSnapshot={deviceSnapshot} connectionProps={{ connection, setConnection, deviceInfo, connectToSwitch, disconnectFromDevice, connectionStatus, connectionBusy }} />,
    deviceAccess: <DeviceAccess connectionProps={{ connection, setConnection, deviceInfo, connectToSwitch, disconnectFromDevice, connectionStatus, connectionBusy }} />,
    ports: <Ports config={config} setConfig={setCleanConfig} deviceInfo={deviceInfo} deviceSnapshot={deviceSnapshot} connection={connection} setDeviceSnapshot={setDeviceSnapshot} />,
    virtualChassis: <VirtualChassis config={config} setConfig={setCandidateConfig} deviceInfo={deviceInfo} connection={connection} deviceSnapshot={deviceSnapshot} />,
    monitoring: <Monitoring connection={connection} />,
    vlans: <Vlans config={config} setConfig={setCandidateConfig} />,
    interfaces: <Interfaces config={config} setConfig={setCandidateConfig} deviceSnapshot={deviceSnapshot} deviceInfo={deviceInfo} />,
    speedSettings: <SpeedSettings config={config} setConfig={setCandidateConfig} deviceInfo={deviceInfo} deviceSnapshot={deviceSnapshot} />,
    aggregate: <AggregateEthernet config={config} setConfig={setCandidateConfig} />,
    spanningTree: <SpanningTree config={config} setConfig={setCandidateConfig} />,
    irb: <Irb config={config} setConfig={setCandidateConfig} />,
    routing: <Routing config={config} setConfig={setCandidateConfig} deviceSnapshot={deviceSnapshot} />,
    management: <Management config={config} setConfig={setCandidateConfig} connection={connection} deviceSnapshot={deviceSnapshot} />,
    lldp: <Lldp config={config} setConfig={setCandidateConfig} />,
    commit: <Commit commands={commands} errors={errors} connection={connection} onCommitted={loadSwitchSnapshot} />
  }[active];
  const firstValidationError = errors[0] || "";
  const commitBlockedReason = firstValidationError || (commands.length === 0 ? "No pending configuration commands." : "");
  const activeLabel = nav.find((item) => item.id === active)?.label || "Dashboard";

  function toggleNavigation() {
    const next = !navigationCollapsed;
    localStorage.setItem(navigationCollapsedStorageKey, String(next));
    setNavigationCollapsed(next);
  }

  return (
    <div className={`app-shell ${navigationCollapsed ? "navigation-collapsed" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">J</span>
          <div>
            <strong>Mini J-Web EX</strong>
            <span>Network configuration</span>
          </div>
        </div>
        <div className="session-controls">
          <span className={deviceInfo?.ok ? "connection-pill connected" : "connection-pill disconnected"}>
            <span className="status-dot" />
            <span className="status-label">{deviceInfo?.ok ? "Connected" : "Disconnected"}</span>
          </span>
          <span className="top-device">
            <strong>{deviceInfo?.hostname || connection.host || "No device"}</strong>
            <small>{deviceInfo?.model || (connection.host ? connection.host : "Select a saved profile")}</small>
          </span>
          <select
            className="top-profile-select"
            value={deviceProfiles.some((profile) => profileKey(profile) === profileKey(connection)) ? profileKey(connection) : ""}
            onChange={(event) => selectDeviceProfile(event.target.value)}
            disabled={connectionBusy || deviceProfiles.length === 0}
            title="Saved device profiles"
          >
            <option value="">{deviceProfiles.length ? "Select profile" : "No saved profiles"}</option>
            {deviceProfiles.map((profile) => (
              <option key={profileKey(profile)} value={profileKey(profile)}>{profileLabel(profile)}</option>
            ))}
          </select>
          <div className="profile-manager">
            <button
              className="icon header-secondary"
              onClick={() => setProfileManagerOpen((current) => !current)}
              aria-label="Manage saved profiles"
              aria-expanded={profileManagerOpen}
              title="Manage saved profiles"
            >
              <Settings size={15} />
            </button>
            {profileManagerOpen ? (
              <div className="profile-popover" role="dialog" aria-label="Saved profiles">
                <div className="profile-popover-head">
                  <strong>Saved Profiles</strong>
                  <button className="icon" onClick={() => setProfileManagerOpen(false)} aria-label="Close saved profiles">
                    <X size={14} />
                  </button>
                </div>
                {deviceProfiles.length ? (
                  <div className="profile-list">
                    {deviceProfiles.map((profile) => {
                      const key = profileKey(profile);
                      return (
                        <div className="profile-row" key={key}>
                          <button className="profile-select" onClick={() => { selectDeviceProfile(key); setProfileManagerOpen(false); }}>
                            <strong>{profile.host || "No host"}</strong>
                            <span>NETCONF {profile.port || "830"}{profile.username ? ` | ${profile.username}` : ""}</span>
                          </button>
                          <button className="icon danger" onClick={() => deleteDeviceProfile(key)} aria-label={`Delete ${profileLabel(profile)}`} title="Delete saved profile">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="profile-empty">No saved profiles.</div>
                )}
              </div>
            ) : null}
          </div>
          <button onClick={() => connectToSwitch(connection, { navigate: false })} disabled={connectionBusy || !connection.host}>
            <Lock size={15} />
            <span className="action-label">Connect</span>
          </button>
          <button onClick={disconnectFromDevice} disabled={connectionBusy || !deviceInfo}>
            <LogOut size={15} />
            <span className="action-label">Disconnect</span>
          </button>
        </div>
        <div className="configuration-controls">
          <span className={`candidate-state ${dirty ? "pending" : ""}`}>{dirty ? "Pending changes" : "Committed"}</span>
          {firstValidationError ? <span className="top-error" title={errors.join("\n")}>{firstValidationError}</span> : null}
          {topCommitStatus ? <span className="top-action-status" title={topCommitStatus}>{topCommitStatus}</span> : null}
          <button className="header-secondary" onClick={refreshFromSwitch} disabled={topRefreshBusy} title="Refresh from switch">
            <RefreshCw size={15} />
            <span className="action-label">Refresh</span>
          </button>
          <button className="header-secondary" onClick={revertCandidate} disabled={topCommitBusy} title="Revert candidate">
            <RotateCcw size={15} />
            <span className="action-label">Revert</span>
          </button>
          <button onClick={() => runTopCommit("confirm")} disabled={topCommitBusy || commands.length === 0 || errors.length > 0} title={commitBlockedReason}>
            <ClipboardCheck size={15} />
            <span className="action-label">Commit Confirm</span>
          </button>
          <button className={dirty ? "primary dirty" : "primary"} onClick={() => runTopCommit("commit")} disabled={topCommitBusy || commands.length === 0 || errors.length > 0} title={commitBlockedReason}>
            <Save size={15} />
            <span className="action-label">Commit</span>
          </button>
        </div>
      </header>
      <div className="body">
        <aside>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? "active" : ""}
                onClick={() => setActive(item.id)}
                title={navigationCollapsed ? item.label : undefined}
                aria-label={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            className="navigation-toggle"
            onClick={toggleNavigation}
            title={navigationCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-label={navigationCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!navigationCollapsed}
          >
            {navigationCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{navigationCollapsed ? "Expand" : "Collapse"}</span>
          </button>
        </aside>
        <main>
          <div className="page-heading">
            <div>
              <span>Mini J-Web EX</span>
              <h1>{activeLabel}</h1>
            </div>
            <span className={`page-state ${dirty ? "pending" : ""}`}>{dirty ? `${commands.length} pending command${commands.length === 1 ? "" : "s"}` : "Configuration synchronized"}</span>
          </div>
          {(firstValidationError || topCommitStatus) ? (
            <div className={`page-status ${firstValidationError ? "error" : topCommitTone}`} role={firstValidationError || topCommitTone === "error" ? "alert" : "status"}>
              <div>
                <strong>{firstValidationError ? "Validation issue" : topCommitTone === "success" ? "Action completed" : topCommitTone === "error" ? "Action failed" : "Action status"}</strong>
                <span>{firstValidationError || topCommitStatus}</span>
              </div>
              {topCommitStatus ? (
                <button className="icon" onClick={() => setTopCommitStatus("")} aria-label="Dismiss status message">
                  <X size={14} />
                </button>
              ) : null}
            </div>
          ) : null}
          {screen}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
