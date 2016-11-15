// include Fake lib
#r "packages/FAKE/tools/FakeLib.dll"
open Fake
open TypeScript
open System.IO
// Properties
let buildDir = "./build"
let packages = "./packages"
let assets = "./assets"
let deployDir = "../wwwroot"

let foldDir dir () = 
    let parentDirs = Directory.EnumerateDirectories(dir) |> Seq.toList
    parentDirs 
    |> Seq.collect (Directory.EnumerateDirectories)
    |> Seq.collect(fun subDir -> Directory.EnumerateDirectories(subDir, "content"))
    |> Seq.iter (fun content -> 
        printfn "From %s to %s" content dir
        Fake.FileUtils.cp_r content dir)
    FileHelper.DeleteDirs parentDirs
Target "Clean" (fun _ ->
    CleanDirs [buildDir;deployDir;assets]
)


Target "BuildApp" (fun _ ->
    !! "./**/*.fsproj"
        |> MSBuildRelease buildDir "Build"
        |> Log "HostBuild-Output: "
)
Target "CopyAssets" (fun _ ->
    [!! (packages @@ "/**/*")
     -- (packages </> "**/admin/**")
     -- (packages </> "**/dashboard/**")]
        |> FileHelper.CopyWithSubfoldersTo assets
    //foldDir @"C:\Users\diese\Source\Repos\GreyTide\assets" ()
    foldDir assets ()
    FileHelper.DeleteDir (assets @@ "App_Start")
    [(!! "./GreyTideAssets/**/*.html"
    ++ "./GreyTideAssets/**/*.ts").SetBaseDirectory("./GreyTideAssets/")]
        |> FileHelper.CopyWithSubfoldersTo assets
)

Target "CompileTypeScript" (fun _ ->
    (!! (assets </> "**/*.ts")).SetBaseDirectory(assets)
        |> TypeScriptCompiler (fun p -> { p with  ECMAScript = ES5 }) //OutputPath = "./out";
)

Target "Deploy" (fun _ ->
    Fake.FileHelper.CopyDir deployDir buildDir (fun f -> 
        (f.IndexOf("_PublishedWebsites", System.StringComparison.InvariantCultureIgnoreCase)  < 0))
    Fake.FileHelper.CopyDir deployDir (buildDir </> "_PublishedWebsites" </> "GreyTide") (fun f -> 
        (f.IndexOf("Web.config", System.StringComparison.InvariantCultureIgnoreCase)  < 0))
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
  ==> "CopyAssets"
  ==> "CompileTypeScript" 
  ==> "Default"
  ==> "Deploy"
  ==> "Kudu"

// start build
RunTargetOrDefault "Default"