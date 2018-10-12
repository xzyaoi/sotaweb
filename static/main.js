var current_curr = 0
var current_keyword = ""
var auth
var current_papers = []
/**
 * Search Trigger
 * @param {*} e 
 * @param {*} self 
 */

function triggerSearch(e, self) {
    var event = e || window.event;
    var key = event.which || event.keyCode || event.charCode;
    if (key == 13) {
        self.blur()
        searchArxiv(self)
    }
}
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
        current_papers=data
        console.log(data)
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
        RedirectUriSignOut : 'https://arxiv.autoai.org/logout.html',
        IdentityProvider : '', 
        UserPoolId : 'us-east-1_IYJ3FvCKZ', 
        AdvancedSecurityDataCollectionFlag : false
    }
    auth = new AmazonCognitoIdentity.CognitoAuth(authData)
		// You can also set state parameter 
		// auth.setState(<state parameter>);  
	auth.userhandler = {
			onSuccess: function(result) {
                // console.log(result)
                // getUserInfo(result.accessToken.jwtToken)
                showSignedOut()
			},
			onFailure: function(err) {
                console.log(err)
            }
		}
		// The default response_type is "token", uncomment the next line will make it be "code".
		// auth.useCodeGrantFlow()
	return auth
}

function triggerAuth() {
    var state = document.getElementById('AuthButton').innerHTML
    console.log(state)
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
    var email = document.getElementById('arxiv-username').innerHTML
    var hash = md5(email)
    var avatar = 'https://www.gravatar.com/avatar/' + hash
    document.getElementById('arxiv-user-avatar').src = avatar
}

function check_auth() {
    var curUrl = localStorage.getItem('url')
    if (curUrl === '' || curUrl === null) {

    } else {
        auth.parseCognitoWebResponse(curUrl)
        renderUser(isAnonymous=false)
    }
    var isLogout = localStorage.getItem('logout')
    if (isLogout === 'true') {
        renderUser(isAnonymous=true)
    }
}

function getUserInfo(accessToken) {
    var url = 'https://autoai.auth.us-east-1.amazoncognito.com/oauth2/userInfo'
    fetch(url, {
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }).then(function(res) {
        return res.json()
    }).then(function(data) {
        console.log(data)
    })
}

function renderUser(isAnonymous) {
    if (!isAnonymous) {
        document.getElementById('arxiv-username').innerHTML = auth.getCurrentUser()
    } else {
        document.getElementById("AuthButton").innerHTML = "Sign In"
        document.getElementById('arxiv-username').innerHTML = 'Anonymous'
    }
}

/** Record Store */
var PaperObject = AV.Object.extend('Paper')
function initStorage() {
    var APP_ID = 'd5YGw5SsW1leEnyi2sVtj2Cf-gzGzoHsz'
    var APP_KEY = '4ToLOh0XtJy5M6JufpDsWTF8'
    
    AV.init({
      appId: APP_ID,
      appKey: APP_KEY
    })
}

function addToReadList(paper_id) {
    var user = document.getElementById('arxiv-username').innerHTML
    if (user === 'Anonymous') {
        var toastHTML = '<span>Please Login First</span><a class="btn-flat toast-action" href="javascript:triggerAuth()">Login</a>'
        M.toast({html: toastHTML})
    } else {
        var paper = new PaperObject()
        paper.set('title', current_papers[paper_id].title)
        paper.set('reader', user)
        paper.set('author', current_papers[paper_id].author)
        paper.set('summary', current_papers[paper_id].summary)
        paper.set('pdf_url', current_papers[paper_id].pdf_url)
        paper.set('pure_id', current_papers[paper_id].pure_id)
        paper.set('updated_parsed', current_papers[paper_id].updated_parsed)
        paper.set('has_read', false)
        paper.save().then(function (res) {
            var toastHTML = '<span>Success</span>'
            M.toast({html: toastHTML})
        }, function(err) {
            console.log(err)
        })
    }
}

function queryReadList() {
    var user = document.getElementById('arxiv-username').innerHTML
    if (user === 'Anonymous') {
        var toastHTML = '<span>Please Login First</span><a class="btn-flat toast-action" href="javascript:triggerAuth()">Login</a>'
        M.toast({html: toastHTML})
    } else {
        var query = new AV.Query('Paper')
        query.equalTo('reader', user)
        query.equalTo('has_read', false)
        var toReadPapers = []
        query.find().then(function (results) {
            for (var i=0;i<results.length;i++) {
                toReadPapers.push(results[i].attributes)
            }
            console.log(toReadPapers)
            triggerSideNav()
            renderPapers(toReadPapers)
        }, function(error) {
            console.log(error)
        })
    }
}
/** Bootstraper */

function onLoad() {
    M.AutoInit()
    initAuth()
    initStorage()
    check_auth()
    generateEmailAvatar()
}