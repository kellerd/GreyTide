using System;

namespace GreyTide.data
{
    public class HardDriveAzureConnectionStr
    {
        private static Lazy<string> _ConnectionKey = new Lazy<string>(() => System.IO.File.ReadAllText("C:/azdocdb.txt"), true);
        public static string ConnectionKey
        {
            get {
                return _ConnectionKey.Value;
            }
        }

        private static Lazy<Uri> _ConnectionUri = new Lazy<Uri>(() => new Uri(System.IO.File.ReadAllText("C:/azdocdburi.txt")), true);
        public static Uri ConnectionUri
        {
            get
            {
                return _ConnectionUri.Value;
            }
        }
        public static string DatabaseId
        {
            get { return "greytide"; }
        }
        public static Guid UserToken
        {
            get
            {
                return Guid.Parse("{F00F47F7-5A52-4FBA-9218-3718534BC7CE}");
            }
        }
    }
}