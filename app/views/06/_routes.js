const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line


router.post('/age-results', function(request, response) {

    var ageRange = request.session.data['age']
    if (ageRange == "under-18"){
        response.redirect("location")
    }
    else {
        response.redirect("age-next-steps")
    }
})

router.post('/job-subject-all', function(request, response) {

    var searchInterest = request.session.data['all-or-nothing']
    if (searchInterest == "Search for all courses near an institution"){
        response.redirect("search-results")
    }
    else {
        response.redirect("school-subjects-question")
    }
})

router.post('/subjects-question', function(request, response) {

    var subjectQuestion = request.session.data['school-subjects-radios']
    if (subjectQuestion == "Yes"){
        response.redirect("subjects")
    }
    else {
        response.redirect("jobs-and-careers-question")
    }
})

router.post('/jobs-question', function(request, response) {

    var subjectQuestion = request.session.data['jobs-careers-radios']
    if (subjectQuestion == "Yes"){
        response.redirect("jobs")
    }
    else {
        response.redirect("learning-method")
    }
})

router.post('/results-type', function(request, response) {

    var publishDate = request.session.data['subject-1']
    var jobOrCareer = request.session.data['job-1'];
    var jobRadios = request.session.data['jobs-careers-radios'];
    var subjectRadios = request.session.data['school-subjects-radios'];

    if (publishDate == "Business"){
        response.redirect("search-results-business")
    } 
    else if (publishDate == "business"){
        response.redirect("search-results-business")
    } 
    else if (publishDate == "business studies"){
        response.redirect("search-results-business")
    }
    else if (publishDate == "Business Studies"){
        response.redirect("search-results-business")
    }
    else if (publishDate == "Business studies"){
        response.redirect("search-results-business")
    }
    else if (publishDate == "Biology"){
        response.redirect("search-results-biology")
    } 
    else if (publishDate == "biology"){
        response.redirect("search-results-biology")
    }
    else if (jobOrCareer == "Business"){
        response.redirect("search-results-business")
    } 
    else if (jobOrCareer == "business"){
        response.redirect("search-results-business")
    } 
    else if (jobOrCareer == "business studies"){
        response.redirect("search-results-business")
    }
    else if (jobOrCareer == "Business Studies"){
        response.redirect("search-results-business")
    }
    else if (jobOrCareer == "Business studies"){
        response.redirect("search-results-business")
    }
    else if (jobOrCareer == "Biology"){
        response.redirect("search-results-biology")
    } 
    else if (jobOrCareer == "biology"){
        response.redirect("search-results-biology")
    }
    else if (jobRadios == "No"){
        response.redirect("search-results-all")
    }
    else if (subjectRadios == "No"){
        response.redirect("search-results-all")
    }
    else {
        response.redirect("not-built-yet")
    }
})




module.exports = router
