using System.Globalization;
using System.Text.RegularExpressions;

namespace NutriScan.Api.Helpers;

public static class ExpiryDetector
{
    public sealed class Result
    {
        public bool Detected { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? DaysRemaining { get; set; }
    }

    // Keywords that strongly suggest the following date is an expiry / best-before.
    // MFG / MANUFACTURED / PKD are explicitly excluded so we don't mistake them for expiry.
    private static readonly string[] ExpiryKeywords =
    {
        "EXPIRY", "EXPIRES", "EXPIRE", "EXP DATE", "EXP.DATE", "EXP",
        "BEST BEFORE", "BEST BY", "USE BY", "USE BEFORE",
        "CONSUME BEFORE", "VALID UPTO", "VALID UNTIL", "VALID TILL"
    };

    // Ordered date patterns (first match wins per chunk). Capture groups are named (d,m,y).
    // Accepts separators: / - . and optional whitespace around them.
    private static readonly (Regex Pattern, string Kind)[] DatePatterns =
    {
        // YYYY-MM-DD
        (new Regex(@"(?<y>20\d{2})[\-\/\.\s](?<m>0?[1-9]|1[0-2])[\-\/\.\s](?<d>0?[1-9]|[12]\d|3[01])",
            RegexOptions.Compiled | RegexOptions.IgnoreCase), "ymd"),
        // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        (new Regex(@"(?<d>0?[1-9]|[12]\d|3[01])[\-\/\.\s](?<m>0?[1-9]|1[0-2])[\-\/\.\s](?<y>20\d{2})",
            RegexOptions.Compiled | RegexOptions.IgnoreCase), "dmy"),
        // DD/MM/YY
        (new Regex(@"(?<d>0?[1-9]|[12]\d|3[01])[\-\/\.\s](?<m>0?[1-9]|1[0-2])[\-\/\.\s](?<y>\d{2})\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase), "dmyy"),
        // MM/YYYY or MM-YYYY or MM.YYYY (no day — assume last day of month)
        (new Regex(@"\b(?<m>0?[1-9]|1[0-2])[\-\/\.\s](?<y>20\d{2})\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase), "my"),
        // MM/YY
        (new Regex(@"\b(?<m>0?[1-9]|1[0-2])[\-\/\.\s](?<y>\d{2})\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase), "myy"),
    };

    public static Result Detect(string? text, DateTime? today = null)
    {
        var result = new Result { Detected = false };
        if (string.IsNullOrWhiteSpace(text)) return result;

        var now = (today ?? DateTime.UtcNow).Date;
        var upper = text.ToUpperInvariant();

        // 1) Prefer dates that appear immediately after an expiry-style keyword.
        foreach (var keyword in ExpiryKeywords)
        {
            var idx = upper.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
            if (idx < 0) continue;

            // Look ahead up to 30 chars after the keyword for the first date.
            var tailStart = idx + keyword.Length;
            var tail = upper.Substring(tailStart, Math.Min(30, upper.Length - tailStart));

            var parsed = TryParseFirstDate(tail);
            if (parsed is not null)
            {
                return Build(parsed.Value, now);
            }
        }

        // 2) Fallback: no keyword matched — pick the LATEST plausible future date in the whole text.
        //    This covers labels where OCR only captured the date part (e.g. \"BB 05/2026\").
        DateTime? latestFuture = null;
        foreach (var (pattern, kind) in DatePatterns)
        {
            foreach (Match m in pattern.Matches(upper))
            {
                var dt = BuildDate(m, kind);
                if (dt is null) continue;
                if (dt.Value.Date < now) continue; // ignore past dates here
                if (latestFuture is null || dt > latestFuture) latestFuture = dt;
            }
        }

        if (latestFuture is not null) return Build(latestFuture.Value, now);

        return result;
    }

    private static DateTime? TryParseFirstDate(string chunk)
    {
        foreach (var (pattern, kind) in DatePatterns)
        {
            var m = pattern.Match(chunk);
            if (m.Success)
            {
                var dt = BuildDate(m, kind);
                if (dt is not null) return dt;
            }
        }
        return null;
    }

    private static DateTime? BuildDate(Match m, string kind)
    {
        try
        {
            int day, month, year;
            switch (kind)
            {
                case "ymd":
                    year = int.Parse(m.Groups["y"].Value, CultureInfo.InvariantCulture);
                    month = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
                    day = int.Parse(m.Groups["d"].Value, CultureInfo.InvariantCulture);
                    break;
                case "dmy":
                    day = int.Parse(m.Groups["d"].Value, CultureInfo.InvariantCulture);
                    month = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
                    year = int.Parse(m.Groups["y"].Value, CultureInfo.InvariantCulture);
                    break;
                case "dmyy":
                    day = int.Parse(m.Groups["d"].Value, CultureInfo.InvariantCulture);
                    month = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
                    year = 2000 + int.Parse(m.Groups["y"].Value, CultureInfo.InvariantCulture);
                    break;
                case "my":
                    month = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
                    year = int.Parse(m.Groups["y"].Value, CultureInfo.InvariantCulture);
                    day = DateTime.DaysInMonth(year, month); // end of month
                    break;
                case "myy":
                    month = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
                    year = 2000 + int.Parse(m.Groups["y"].Value, CultureInfo.InvariantCulture);
                    day = DateTime.DaysInMonth(year, month);
                    break;
                default:
                    return null;
            }
            if (year is < 2000 or > 2099) return null;
            if (month is < 1 or > 12) return null;
            var maxDay = DateTime.DaysInMonth(year, month);
            if (day < 1 || day > maxDay) return null;
            return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
        }
        catch
        {
            return null;
        }
    }

    private static Result Build(DateTime expiry, DateTime today) => new()
    {
        Detected = true,
        ExpiryDate = expiry,
        DaysRemaining = (int)(expiry.Date - today.Date).TotalDays
    };
}