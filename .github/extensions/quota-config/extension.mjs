// Extension: quota-config
// Interactive configuration for the quota-statusline plugin.
// Provides tools to show, set, and reset settings stored in the plugin config file.

import { joinSession } from "@github/copilot-sdk/extension";
import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Map friendly color names to ANSI escape codes
const COLOR_NAMES = {
    black: "30", red: "31", green: "32", yellow: "33",
    blue: "34", magenta: "35", purple: "35", cyan: "36", white: "37",
    bright_black: "90", bright_red: "91", bright_green: "92", bright_yellow: "93",
    bright_blue: "94", bright_magenta: "95", bright_cyan: "96", bright_white: "97",
};

const ANSI_LABELS = {
    "30": "black", "31": "red", "32": "green", "33": "yellow",
    "34": "blue", "35": "magenta", "36": "cyan", "37": "white",
    "90": "bright_black", "91": "bright_red", "92": "bright_green", "93": "bright_yellow",
    "94": "bright_blue", "95": "bright_magenta", "96": "bright_cyan", "97": "bright_white",
};

const DEFAULTS = {
    filledChar:    "█",
    unfilledChar:  "░",
    barWidth:      12,
    quotaBarColor: "35",
    monthBarColor: "34",
    quotaLabel:    "Q",
    monthLabel:    "M",
    aheadIcon:     "🟢",
    onPaceIcon:    "🟡",
    behindIcon:    "🔴",
    aheadText:     "ahead",
    onPaceText:    "on pace",
    behindText:    "behind",
    aheadColor:    "32",
    onPaceColor:   "33",
    behindColor:   "31",
};

const DESCRIPTIONS = {
    filledChar:    "Filled bar character   e.g. █  #  🟩  ▓",
    unfilledChar:  "Unfilled bar character e.g. ░  .  ⬜  ─",
    barWidth:      "Bar width in chars (reduce when using wide emoji, e.g. 6 for emoji bars)",
    quotaBarColor: "Quota bar color",
    monthBarColor: "Month bar color",
    quotaLabel:    "Quota bar label  e.g. Q  'Quota Used'",
    monthLabel:    "Month bar label  e.g. M  'Monthly Progress'",
    aheadIcon:     "Pace icon when ahead   e.g. 🟢  OK  ✅  😎",
    onPaceIcon:    "Pace icon when on pace e.g. 🟡  ~~  ⚡  👌",
    behindIcon:    "Pace icon when behind  e.g. 🔴  !!  🚨  ⚠️",
    aheadText:     "Pacing text when ahead   e.g. 'ahead'  'under budget'",
    onPaceText:    "Pacing text when on pace e.g. 'on pace'  'on track'",
    behindText:    "Pacing text when behind  e.g. 'behind'  'over budget'",
    aheadColor:    "Ahead indicator color",
    onPaceColor:   "On-pace indicator color",
    behindColor:   "Behind indicator color",
};

function getPluginDir() {
    return process.env.CLAUDE_PLUGIN_DATA
        || join(homedir(), ".copilot", "plugins", "quota-statusline");
}

function readConfig() {
    const p = join(getPluginDir(), "config.json");
    if (!existsSync(p)) return {};
    try { return JSON.parse(readFileSync(p, "utf8")); } catch { return {}; }
}

function writeConfig(cfg) {
    const dir = getPluginDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "config.json"), JSON.stringify(cfg, null, 2), "utf8");
}

function resolveColor(value) {
    const lower = String(value).toLowerCase().replace(/[\s-]/g, "_");
    if (COLOR_NAMES[lower]) return COLOR_NAMES[lower];
    if (/^\d{2}$/.test(value) && (
        (parseInt(value) >= 30 && parseInt(value) <= 37) ||
        (parseInt(value) >= 90 && parseInt(value) <= 97)
    )) return value;
    return null;
}

function colorLabel(code) {
    return ANSI_LABELS[code] ? `${code} (${ANSI_LABELS[code]})` : code;
}

function isColorKey(key) {
    return key.toLowerCase().includes("color");
}

await joinSession({
    tools: [
        {
            name: "quota_config_show",
            description: "Show the current quota-statusline display settings — bar characters, colors, pace icons, labels, and bar width. Shows which values are custom vs default, and includes hints for emoji options.",
            parameters: { type: "object", properties: {} },
            skipPermission: true,
            handler: async () => {
                const saved = readConfig();
                const lines = ["**quota-statusline configuration** (changes take effect within 30s)\n"];

                for (const [key, def] of Object.entries(DEFAULTS)) {
                    const val = saved[key] !== undefined ? saved[key] : def;
                    const tag = saved[key] !== undefined ? "custom" : "default";
                    const display = isColorKey(key) ? colorLabel(String(val)) : JSON.stringify(val);
                    lines.push(`• \`${key.padEnd(14)}\` ${display.padEnd(20)} *(${tag})* — ${DESCRIPTIONS[key]}`);
                }

                lines.push("\nUse `quota_config_set` to change a value, or `quota_config_reset` to restore defaults.");
                lines.push("\n**Color names:** red, green, yellow, blue, magenta, cyan, white (prefix with bright_ for brighter variants)");
                return lines.join("\n");
            },
        },
        {
            name: "quota_config_set",
            description: "Set a quota-statusline configuration value. For color settings, accepts color names (red, green, blue, yellow, magenta, cyan, white, bright_red, etc.) or ANSI codes (30-37, 90-97). For icon settings, accepts any text or emoji. For barWidth, accepts a number. Changes take effect on the next status line refresh (within 30 seconds).",
            parameters: {
                type: "object",
                properties: {
                    key: {
                        type: "string",
                        description: "The setting to change",
                        enum: Object.keys(DEFAULTS),
                    },
                    value: {
                        type: "string",
                        description: "The new value. Colors: use a name like 'green' or ANSI code like '32'. Icons: any text or emoji. barWidth: a number (use smaller values with wide emoji chars).",
                    },
                },
                required: ["key", "value"],
            },
            skipPermission: true,
            handler: async ({ key, value }) => {
                if (!(key in DEFAULTS)) {
                    return { textResultForLlm: `Unknown key: "${key}". Valid keys: ${Object.keys(DEFAULTS).join(", ")}`, resultType: "failure" };
                }

                let resolved = value;

                if (isColorKey(key)) {
                    const code = resolveColor(value);
                    if (!code) {
                        return {
                            textResultForLlm: `Invalid color: "${value}". Use a name (red, green, blue, yellow, magenta, cyan, white, bright_red, etc.) or an ANSI code (30-37, 90-97).`,
                            resultType: "failure",
                        };
                    }
                    resolved = code;
                }

                if (key === "barWidth") {
                    const n = parseInt(value, 10);
                    if (isNaN(n) || n < 1 || n > 50) {
                        return { textResultForLlm: `Invalid barWidth: "${value}". Must be a number between 1 and 50.`, resultType: "failure" };
                    }
                    resolved = n;
                }

                const cfg = readConfig();
                cfg[key] = resolved;
                writeConfig(cfg);

                const displayVal = isColorKey(key) ? colorLabel(String(resolved)) : JSON.stringify(resolved);
                return `Set **${key}** → \`${displayVal}\`. Changes will appear on the next status line refresh (within 30 seconds).`;
            },
        },
        {
            name: "quota_config_reset",
            description: "Reset one or all quota-statusline settings back to their defaults.",
            parameters: {
                type: "object",
                properties: {
                    key: {
                        type: "string",
                        description: "The specific setting to reset. Omit to reset ALL settings to defaults.",
                        enum: Object.keys(DEFAULTS),
                    },
                },
            },
            skipPermission: true,
            handler: async (args) => {
                const key = args?.key;
                if (key) {
                    if (!(key in DEFAULTS)) {
                        return { textResultForLlm: `Unknown key: "${key}"`, resultType: "failure" };
                    }
                    const cfg = readConfig();
                    delete cfg[key];
                    writeConfig(cfg);
                    const displayDef = isColorKey(key) ? colorLabel(String(DEFAULTS[key])) : JSON.stringify(DEFAULTS[key]);
                    return `Reset **${key}** to default: \`${displayDef}\`.`;
                }

                writeConfig({});
                return "All quota-statusline settings reset to defaults.";
            },
        },
    ],
});
