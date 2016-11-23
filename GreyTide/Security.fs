namespace GreyTide
module Security =
    open Suave.OAuth
    open Suave.Operators
    open Suave
    open InitData
    let oauthConfigs = 
        lazy (
            defineProviderConfigs (function
                | "google" -> fun c ->
                    {c with
                        client_id = getSetting "OAuthGId"
                        client_secret = getSetting "OAuthGS"}
                | "facebook" -> fun c ->
                    {c with
                        client_id = getSetting "OAuthFId"
                        client_secret = getSetting "OAuthFS"}
                | _ -> id   // we do not provide secret keys for other oauth providers
            ))
    
    let authorizeRedirectUri = "http://greytide.azurewebsites.net/oalogin"
        
    let secure setState loginRedirectPage protectedArea =
        [
            warbler(fun ctx ->
                printfn "Redirect url: %s" authorizeRedirectUri
                authorize authorizeRedirectUri oauthConfigs.Value
                    (fun loginData ->
                        printf "%s (name: %s)" loginData.Id loginData.Name
                        setState loginData.Id >=> Redirection.FOUND "/"
                    )
                    (fun () ->
                        setState "" >=> Redirection.FOUND "/"
                    )
                    (fun error -> Successful.OK <| sprintf "Authorization failed because of `%s`" error.Message)
            )
            loginRedirectPage
            OAuth.protectedPart protectedArea
                (RequestErrors.FORBIDDEN "You do not have access to that application part")
        ]
