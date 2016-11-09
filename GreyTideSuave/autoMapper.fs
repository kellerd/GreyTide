namespace GreyTideSuave
module MapperConfiguration = 
    open AutoMapper
    open System
    open GreyTide.Models
    let remap (xs:ResizeArray<'a>) f = 
        let xs' = xs |> Option.ofObj |> defaultArg <| ResizeArray<'a>()
        xs.Clear()
        xs.AddRange(Seq.map f xs')
    let RegisterAutoMapperPreStart() = 

        Mapper.CreateMap<V2.Model, V1.Model>().AfterMap(fun V2 V1 ->
            remap V1.States (fun (s:V1.ModelState) -> {s with Id = Guid.NewGuid(); Model = V1})
            remap V1.Items (fun (s:V1.Model) -> {s with Id = Guid.NewGuid(); Parent = V1})
        )  |> ignore
        Mapper.CreateMap<V2.ModelItem, V1.Model>().AfterMap(fun V2 V1 ->
            remap V1.States (fun (s:V1.ModelState) -> {s with Id = Guid.NewGuid(); Model = V1})
        ) |> ignore
        Mapper.CreateMap<V2.ModelState, V1.ModelState>() |> ignore
        Mapper.CreateMap<V2.State, V1.State>() |> ignore
        let toFromState : string -> V1.FromState = fun str -> {Name=str;Id=Guid.NewGuid(); State=None}
        Mapper.CreateMap<string, V1.FromState>().ConstructUsing(toFromState) |> ignore
        Mapper.CreateMap<V2.StateCollection, V1.StateCollection>().AfterMap(fun V2 V1 ->
            remap V1.Events (fun (s) -> remap s.From (fun f -> {f with State = Some s});
                                        { s with Id = Guid.NewGuid(); StateCollection = V1} )) |> ignore
