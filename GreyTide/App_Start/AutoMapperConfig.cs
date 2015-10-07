using AutoMapper;
using System.Linq;
using System;
using GreyTide.Models.V2;

[assembly: WebActivator.PreApplicationStartMethod(
    typeof(GreyTideDataService.App_Start.AutoMapperConfig), "RegisterAutoMapperPreStart")]
namespace GreyTideDataService.App_Start
{
    
    //http://blogs.msdn.com/b/davidebb/archive/2010/10/11/light-up-your-nupacks-with-startup-code-and-webactivator.aspx
    public static class AutoMapperConfig
    {

        public static void RegisterAutoMapperPreStart()
        {
            Mapper.CreateMap<Model, GreyTide.Models.V1.Model>().AfterMap((V2,V1) =>
            {
                if (V1.States != null && V1.States.Any())
                {
                    V1.States.ForEach((s) =>
                    {
                        s.Id = Guid.NewGuid();
                        s.SetModel(V1);
                    });
                }
                if (V1.Items != null && V1.Items.Any())
                {
                    V1.Items.ForEach((s) =>
                    {
                        s.Id = Guid.NewGuid();
                        s.SetParent(V1);
                    });
                }
            });
            Mapper.CreateMap<ModelItem, GreyTide.Models.V1.Model>().AfterMap((V2, V1) =>
            {
                V1.Id = Guid.NewGuid();
                if (V1.States != null && V1.States.Any())
                {
                    V1.States.ForEach((s) =>
                    {
                        s.Id = Guid.NewGuid();
                        s.SetModel(V1);
                    });
                }
            });
            Mapper.CreateMap<ModelState, GreyTide.Models.V1.ModelState>();
            Mapper.CreateMap<State, GreyTide.Models.V1.State>();
            Mapper.CreateMap<string, GreyTide.Models.V1.FromState>().ConstructUsing(Str => new GreyTide.Models.V1.FromState { Name = Str });

            Mapper.CreateMap<StateCollection, GreyTide.Models.V1.StateCollection>().AfterMap((V2,V1) =>
            {
                if (V1.Events != null && V1.Events.Any())
                    V1.Events.ForEach(s =>
                    {
                        s.Id = Guid.NewGuid();
                        s.SetStateCollection(V1);
                        s.From.ForEach(f =>
                        {
                            f.Id = Guid.NewGuid();
                            f.SetState(s);
                        });
                    });
            });
        }
    }
}