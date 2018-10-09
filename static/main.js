var current_curr = 0
var current_keyword = ""

function fetchPapers(keyword, max,start) {
    var url = new URL("https://sotaresearch.pythonanywhere.com"),
    params = {keyword:keyword, max:max, start:start}
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    fetch(url).then(function (res) {
        return res.json()
    }).then(function (data) {
        current_keyword = keyword
        current_curr = start + max
        renderPapers(data)
    })
}

function renderPapers (papers) {
    document.getElementById("results").innerHTML = tmpl("tmpl-results", papers)
}

function searchArxiv () {
    var keyword = document.getElementById("search").value
    current_curr = 0
    current_keyword = keyword
    fetchPapers(keyword, 5, 0)
}

function prev () {
    if (current_curr - 5 < 0) {
        return;
    } else {
        fetchPapers(current_keyword, 5, current_curr - 10)
    }
}

function next () {
    fetchPapers(current_keyword, 5, current_curr)
}
