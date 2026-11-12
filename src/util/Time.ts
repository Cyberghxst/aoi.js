const compare = (first: { order: number }, second: { order: number }) => {
    if (first.order < second.order) {
        return -1;
    }
    if (first.order > second.order) {
        return 1;
    }
    return 0;
};

/**
 * Milliseconds in one month: the mean Gregorian month, 365.2425 days
 * per year / 12 = 30.436875 days. parse() and format() share this one
 * value, so a parsed month formats back to exactly one month.
 */
export const MS_PER_MONTH = 2629746000;

const pluralize = (num: number, txt: string, suffix = "s") =>
    `${num} ${txt}${num !== 1 ? suffix : ""}`;

/**
 * Parses a duration into milliseconds and a human-readable string.
 *
 * Accepts either a millisecond count or a string of space-separated parts
 * such as `"1h 30min"`. Each unit may appear at most once: repeated units
 * overwrite each other because they share one map entry.
 * @param time - Milliseconds, or a string like `"2d 3h"`.
 * @returns The total milliseconds and the formatted duration.
 */
export function parse(time: string | number) {
    if (!["string", "number"].includes(typeof time))
        throw TypeError("'time' must be a string or number");
    if (typeof time === "number")
        return {
            ms: time,
            format: format(time).toString(),
        };
    else {
        const timeUnits = new Map();

        time.split(" ").forEach((part) => {
            if (part.endsWith("y"))
                timeUnits.set("y", {
                    format: pluralize(Number(part.split("y")[0]), "year"),
                    ms: Number(part.split("y")[0]) * 31536000000,
                    order: 1,
                });
            if (part.endsWith("mon") || part.endsWith("M"))
                timeUnits.set("mon", {
                    format: pluralize(
                        Number(part.split("mon")[0].split("M")[0]),
                        "month",
                    ),
                    ms: Number(part.split("mon")[0].split("M")[0]) * MS_PER_MONTH,
                    order: 2,
                });
            if (part.endsWith("w"))
                timeUnits.set("w", {
                    format: pluralize(Number(part.split("w")[0]), "week"),
                    ms: Number(part.split("w")[0]) * 604800000,
                    order: 3,
                });
            if (part.endsWith("d"))
                timeUnits.set("d", {
                    format: pluralize(Number(part.split("d")[0]), "day"),
                    ms: Number(part.split("d")[0]) * 86400000,
                    order: 4,
                });
            if (part.endsWith("h") || part.endsWith("hr"))
                timeUnits.set("h", {
                    format: pluralize(
                        Number(part.split("h")[0].split("hr")[0]),
                        "hour",
                    ),
                    ms: Number(part.split("hr")[0].split("h")[0]) * 3600000,
                    order: 5,
                });
            if (part.endsWith("min") || part.endsWith("m"))
                timeUnits.set("min", {
                    format: pluralize(
                        Number(part.split("min")[0].split("m")[0]),
                        "minute",
                    ),
                    ms: Number(part.split("min")[0].split("m")[0]) * 60000,
                    order: 6,
                });
            if (part.endsWith("s") && !part.endsWith("ms"))
                timeUnits.set("s", {
                    format: pluralize(Number(part.split("s")[0]), "second"),
                    ms: Number(part.split("s")[0]) * 1000,
                    order: 7,
                });
            if (part.endsWith("ms"))
                timeUnits.set("ms", {
                    ms: Number(part.split("ms")[0]),
                    order: 8,
                });
        });
        const sortedUnits = [...timeUnits.values()].sort(compare);

        const ms = sortedUnits.map((unit) => unit.ms).reduce((total, value) => total + value, 0);
        const formatted = sortedUnits
            .filter((unit) => unit.format)
            .map((unit) => unit.format)
            .join(", ");

        return {
            ms,
            format: formatted,
        };
    }
}

/**
 * Breaks a millisecond count into years/months/weeks/days/hours/minutes/
 * seconds/ms, with helpers to render it as a short string (`"1h 30min"`)
 * or a human-readable one (`"1 hour, 30 minutes"`).
 */
export function format(time: number) {
    const takeUnit = (ms: number) => {
        const value = Math.trunc(Math.abs(time) / ms);
        time -= value * ms;
        return value;
    };
    const duration: {
        object: {
            years: number;
            months: number;
            weeks: number;
            days: number;
            hours: number;
            minutes: number;
            seconds: number;
            ms: number;
        };
        humanize: () => string;
        toString: () => string;
    } = {
        object: {
            years: takeUnit(31536000000),
            months: takeUnit(MS_PER_MONTH),
            weeks: takeUnit(604800000),
            days: takeUnit(86400000),
            hours: takeUnit(3600000),
            minutes: takeUnit(60000),
            seconds: takeUnit(1000),
            ms: takeUnit(1),
        },
        humanize: () => {
            const string: string[] = [];
            Object.entries(duration.object)
                .slice(0, -1)
                .forEach((entry) => {
                    if (entry[1]) {
                        if (["months", "ms"].includes(entry[0])) {
                            string.push(`${entry[1]}${entry[0].slice(0, 3)}`);
                        } else {
                            string.push(`${entry[1]}${entry[0].slice(0, 1)}`);
                        }
                    }
                });
            return string.join(" ");
        },
        toString: () => parse(duration.humanize()).format,
    };
    return duration;
}
