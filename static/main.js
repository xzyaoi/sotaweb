var current_curr = 0
var current_keyword = ""
var auth
/**
 * Query Papers
 * @param {*} keyword 
 * @param {*} max 
 * @param {*} start 
 */

function fetchPapers(keyword, max, start) {
    var url = new URL("https://sotaresearch.pythonanywhere.com"),
        params = { keyword: keyword, max: max, start: start }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    fetch(url).then(function (res) {
        return res.json()
    }).then(function (data) {
        hideHint()
        current_keyword = keyword
        current_curr = start + max
        for(var i=0; i<data.length; i++) {
            data[i].pure_id = data[i].id.replace("http://arxiv.org/abs/", "")
        }
        renderPapers(data)
    })
}

function renderPapers(papers) {
    document.getElementById("results").innerHTML = tmpl("tmpl-results", papers)
    scrollTo(0,0)
}

function searchArxiv(self) {
    var keyword = self.value
    current_curr = 0
    current_keyword = keyword
    fetchPapers(keyword, 5, 0)
}

function prev() {
    if (current_curr - 5 < 0) {
        return;
    } else {
        fetchPapers(current_keyword, 5, current_curr - 10)
    }
}

function next() {
    fetchPapers(current_keyword, 5, current_curr)
}

/** Control Page DOMs */
function hideHint() {
    document.getElementById('hint').style.display = "none"
}

function triggerSideNav() {
    var instance = M.Sidenav.getInstance('sidenav-trigger')
    console.log(instance)
}

/** User Management */
function initAuth() {
    var authData = {
        ClientId : '3i7m8ru22h815pc88nco16dse5', // Your client id here
        AppWebDomain : 'autoai.auth.us-east-1.amazoncognito.com', // Exclude the "https://" part. 
        TokenScopesArray : ['profile', 'email'], // like ['openid','email','phone']...
        RedirectUriSignIn : 'https://arxiv.autoai.org/callback.html',
        RedirectUriSignOut : 'https://arxiv.autoai.org/callback.html',
        IdentityProvider : '', 
        UserPoolId : 'us-east-1_IYJ3FvCKZ', 
        AdvancedSecurityDataCollectionFlag : false
    }
    auth = new AmazonCognitoIdentity.CognitoAuth(authData)
		// You can also set state parameter 
		// auth.setState(<state parameter>);  
	auth.userhandler = {
			onSuccess: function(result) {
				alert("Sign in success");
			},
			onFailure: function(err) {

            }
		}
		// The default response_type is "token", uncomment the next line will make it be "code".
		// auth.useCodeGrantFlow()
	return auth
}

function triggerAuth() {
    var state = document.getElementById('AuthButton').innerHTML
    if (state === "Sign Out") {
        document.getElementById("AuthButton").innerHTML = "Sign In"
        auth.signOut()
        showSignedOut()
    } else {
        auth.getSession()
    }
}

function showSignedOut() {
    document.getElementById("AuthButton").innerHTML = "Sign Out"
}

function generateEmailAvatar() {
    var email = document.getElementById('arxiv-user-email').innerHTML
    var hash = md5(email)
    var avatar = 'https://www.gravatar.com/avatar/' + hash
    document.getElementById('arxiv-user-avatar').src = avatar
}