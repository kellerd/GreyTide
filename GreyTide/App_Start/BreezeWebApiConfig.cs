using System.Web.Http;

[assembly: WebActivator.PreApplicationStartMethod(
    typeof(GreyTideDataService.App_Start.BreezeWebApiConfig), "RegisterBreezePreStart")]
namespace GreyTideDataService.App_Start {
  ///<summary>
  /// Inserts the Breeze Web API controller route at the front of all Web API routes
  ///</summary>
  ///<remarks>
  /// This class is discovered and run during startup; see
  /// http://blogs.msdn.com/b/davidebb/archive/2010/10/11/light-up-your-nupacks-with-startup-code-and-webactivator.aspx
  ///</remarks>
  public static class BreezeWebApiConfig {

    public static void RegisterBreezePreStart() {
      GlobalConfiguration.Configuration.Routes.MapHttpRoute(
          name: "BreezeApi",
          routeTemplate: "tide/{action}",
          defaults: new { controller = "v1" }
      );
      GlobalConfiguration.Configuration.Routes.MapHttpRoute(
          name: "BreezeApiVersioning",
          routeTemplate: "tide/v1/{action}",
          defaults: new { controller = "v1" }
      );
        }
  }
}