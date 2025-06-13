const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line


router.post('/subject-answer', function(request, response) {
    var subjects = request.session.data['subject'];
    
    if (subjects.includes("Agriculture, Horticulture and Animal Care") && subjects.includes("Health, Public Services and Care")) {
        response.redirect("browse-courses-extra-questions");
    } else if (subjects.includes("Health, Public Services and Care")) {
        response.redirect("browse-courses-health");
    } else if (subjects.includes("Agriculture, Horticulture and Animal Care")) {
        response.redirect("browse-courses-agriculture");
    } else {
        response.redirect("/search-results-browse");
    }
});

  router.post('/results-type', function(request, response) {

    var publishDate = request.session.data['person']
    if (publishDate == "Science"){
        response.redirect("guided-journey/bad-search-results/search-results-few-results")
    } else if (publishDate == "Football"){
        response.redirect("guided-journey/bad-search-results/search-results-no-results")
    }
    else {
        response.redirect("index")
    }
})

router.post('/results-type1', function(request, response) {

    var publishDate = request.session.data['person-1']
    if (publishDate == "Social care"){
        response.redirect("/03/guided-journey/search-results-social-care")
    } 
    else if (publishDate == "social care"){
        response.redirect("/03/guided-journey/search-results-social-care")
    } 
    else if (publishDate == "Football"){
        response.redirect("/03/guided-journey/bad-search-results/search-results-no-results")
    }
    else if (publishDate == "Sociology"){
        response.redirect("/03/guided-journey/search-results-sociology")
    } 
    else if (publishDate == "sociology"){
        response.redirect("/03/guided-journey/search-results-sociology")
    } 
    else {
        response.redirect("/03/guided-journey/not-built-yet")
    }
})

router.post('/psychology-skip', function(request, response) {

    var noResults = request.session.data['person-1']
    if (noResults == "Sociology"){
        response.redirect("/03/guided-journey/check-answers")
    } 
    
    else if (noResults == "sociology"){
        response.redirect("/03/guided-journey/check-answers")
    }
    
    else {
        response.redirect("/03/guided-journey/example-1")
    }
})

router.post('/address-type', function(request, response) {

    var studyLocation = request.session.data['study-location']
    if (studyLocation == "School or college"){
        response.redirect("/03/guided-journey/learning-method")
    } 
    else {
        response.redirect("/03/guided-journey/how-far")
    }
})

module.exports = router
