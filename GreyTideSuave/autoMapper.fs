namespace GreyTideSuave
module MapperConfiguration = 
    open AutoMapper
    open System
    let RegisterAutoMapperPreStart() = 
        
        Mapper.CreateMap<GreyTide.Models.V2.Model, GreyTide.Models.V1.Model>().AfterMap(fun V2 V1 ->
            V1.States |> Option.ofObj |> Option.iter (Seq.iter (fun (s) -> s.Id <- Guid.NewGuid(); s.SetModel(V1)))
            V1.Items  |> Option.ofObj |> Option.iter (Seq.iter (fun (s) -> s.Id <- Guid.NewGuid(); s.SetParent(V1)))
        )  |> ignore
        Mapper.CreateMap<GreyTide.Models.V2.ModelItem, GreyTide.Models.V1.Model>().AfterMap(fun V2 V1 ->
            V1.States |> Option.ofObj |> Option.iter (Seq.iter (fun (s) -> s.Id <- Guid.NewGuid(); s.SetModel(V1)))
        ) |> ignore
        Mapper.CreateMap<GreyTide.Models.V2.ModelState, GreyTide.Models.V1.ModelState>() |> ignore
        Mapper.CreateMap<GreyTide.Models.V2.State, GreyTide.Models.V1.State>() |> ignore
        Mapper.CreateMap<string, GreyTide.Models.V1.FromState>().ConstructUsing(fun str -> GreyTide.Models.V1.FromState(Name = str)) |> ignore

        Mapper.CreateMap<GreyTide.Models.V2.StateCollection, GreyTide.Models.V1.StateCollection>().AfterMap(fun V2 V1 ->
            V1.Events |> Option.ofObj |> Option.iter (Seq.iter (fun (s) -> s.Id <- Guid.NewGuid()
                                                                           s.SetStateCollection(V1)
                                                                           s.From |> Seq.iter (fun f -> f.Id <- Guid.NewGuid(); f.SetState(s))))
        ) |> ignore
