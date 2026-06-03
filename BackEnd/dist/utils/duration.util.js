"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDurationToMs = void 0;
const DURATION_MULTIPLIERS = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};
const parseDurationToMs = (value, fallback) => {
    if (value === undefined || value === null) {
        return fallback;
    }
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }
    const normalizedValue = String(value).trim().toLowerCase();
    if (!normalizedValue) {
        return fallback;
    }
    const match = normalizedValue.match(/^(\d+)(ms|s|m|h|d)?$/);
    if (!match) {
        return fallback;
    }
    const [, rawAmount, rawUnit] = match;
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return fallback;
    }
    // Backward-compatible default:
    // plain numbers like "7" are interpreted as days for refresh/session config.
    const unit = rawUnit ?? "d";
    return amount * DURATION_MULTIPLIERS[unit];
};
exports.parseDurationToMs = parseDurationToMs;
