// include Fake lib
#r "packages/FAKE/tools/FakeLib.dll"
open Fake
open TypeScript

// Properties
let buildDir = "./build/"
let deployDir = "./site/wwwroot/"
// Targets
Target "Clean" (fun _ ->
    CleanDirs [buildDir;deployDir]
)

Target "BuildApp" (fun _ ->
    !! "GreyTide/*.csproj"
    ++ "GreyTideSuave/*.fsproj"
        |> MSBuildRelease buildDir "Build"
        |> Log "AppBuild-Output: "
)

Target "TypeScript" (fun _ ->
    !! "GreyTide/**/*.ts"
        |> TypeScriptCompiler (fun p -> { p with OutputPath = deployDir  @@ "./app/" }) 
)

Target "app" (fun _ ->
    !! "GreyTide/app/**/*.html" 
        |> Copy (deployDir @@ "./app/")
    
    !! "GreyTide/**/*.gif" 
    ++ "GreyTide/**/*.png" 
    ++ "GreyTide/**/*.css" 
    ++ "GreyTide/**/*.jpg" 
    ++ "GreyTide/**/*.ico" 
        |> Copy (deployDir @@ "./content/")

    !! "GreyTide/**/*.eot" 
    ++ "GreyTide/**/*.svg" 
    ++ "GreyTide/**/*.ttf" 
    ++ "GreyTide/**/*.woff" 
    ++ "GreyTide/**/*.woff2" 
    ++ "GreyTide/**/*.otf" 
        |> Copy (deployDir @@ "./fonts/")
)


Target "Kudu" (fun _ ->
    trace "Hello World from FAKE"
)

// Dependencies
"Clean"
  ==> "BuildApp"
  ==> "TypeScript"
  ==> "app"
  ==> "Kudu"

// start build
RunTargetOrDefault "Default"