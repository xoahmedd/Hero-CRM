using System;

namespace Application.Common
{
    public static class CairoTimeHelper
    {
        private static readonly TimeZoneInfo CairoTimeZone = ResolveCairoTimeZone();

        private static TimeZoneInfo ResolveCairoTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo");
            }
            catch
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
                }
                catch
                {
                    return TimeZoneInfo.CreateCustomTimeZone("Cairo_Time", TimeSpan.FromHours(3), "Cairo Time", "Cairo Time");
                }
            }
        }

        public static DateTime UtcToCairo(DateTime dateTime)
        {
            var utc = dateTime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
                : dateTime.ToUniversalTime();

            return TimeZoneInfo.ConvertTimeFromUtc(utc, CairoTimeZone);
        }

        public static DateTime Now => UtcToCairo(DateTime.UtcNow);

        public static string Format(DateTime dateTime)
        {
            var cairo = UtcToCairo(dateTime);
            return cairo.ToString("yyyy-MM-dd hh:mm tt") + " (Cairo Time)";
        }
    }
}

