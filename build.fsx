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
    !! "./**/*.csproj"
    ++ "./**/*.fsproj"
        |> MSBuildRelease buildDir "Build"
        |> Log "HostBuild-Output: "
)

//Target "TypeScript" (fun _ ->
//    !! "GreyTide/**/*.ts"
//        |> TypeScriptCompiler (fun p -> { p with OutputPath = deployDir </> "app" }) 
//)

Target "Deploy" (fun _ ->
    [!! (buildDir </> "./**/*")
    -- (buildDir </> "_PublishedWebSites")
    ++ (buildDir </> "_PublishedWebSites" </> "GreyTide")]
        |> CopyWithSubfoldersTo deployDir
)


Target "Kudu" (fun _ ->
    trace "Hello World from FAKE"
)

Target "Default" (fun _ ->
    trace "Default"
)



// Dependencies
"Clean"
  ==> "BuildApp"
  ==> "Default"
  ==> "Deploy"
  ==> "Kudu"

// start build
RunTargetOrDefault "Default"