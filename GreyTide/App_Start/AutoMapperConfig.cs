using AutoMapper;
using AutoMapper.QueryableExtensions;
[assembly: WebActivator.PreApplicationStartMethod(
    typeof(GreyTideDataService.App_Start.AutoMapperConfig), "RegisterAutoMapperPreStart")]
namespace GreyTideDataService.App_Start
{
    
    //http://blogs.msdn.com/b/davidebb/archive/2010/10/11/light-up-your-nupacks-with-startup-code-and-webactivator.aspx
    public static class AutoMapperConfig
    {

        public static void RegisterAutoMapperPreStart()
        {
            Mapper.CreateMap<Models.V2.FromState, Models.V1.FromState>();
            Mapper.CreateMap<Models.V2.Model, Models.V1.Model>();
            Mapper.CreateMap<Models.V2.ModelState, Models.V1.ModelState>();
            Mapper.CreateMap<Models.V2.State, Models.V1.State>();
            Mapper.CreateMap<Models.V2.StateCollection, Models.V1.StateCollection>();
        }
    }
}