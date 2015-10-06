using System;

namespace GreyTide.data
{
    public class HardDriveAzureConnectionStr
    {
        private static Lazy<string> _ConnectionKey = new Lazy<string>(() => System.IO.File.ReadAllText("C:\azdocdb.txt"), true);
        public static string ConnectionKey
        {
            get {
                return _ConnectionKey.Value;
            }
        }

        private static Lazy<Uri> _ConnectionUri = new Lazy<Uri>(() => new Uri(System.IO.File.ReadAllText("C:\azdocdburi.txt")), true);
        public static Uri ConnectionUri
        {
            get
            {
                return _ConnectionUri.Value;
            }
        }
    }
}