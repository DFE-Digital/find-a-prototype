const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line


router.post('/all-nearby-or-nothing', function(request, response) {

    var searchType = request.session.data['all-or-nothing']
    if (searchType == "Search for all courses near an institution"){
        response.redirect("location-institution")
    } else if (searchType == "Answer some questions to get personalised results"){
        response.redirect("location")
    }
    else {
        response.redirect("index")
    }
})

router.post('/subjects-question', function(request, response) {

    var subjectQuestion = request.session.data['school-subjects-radios']
    if (subjectQuestion == "Yes"){
        response.redirect("school-subjects")
    }
    else {
        response.redirect("learning-method")
    }
})

router.post('/jobs-question', function(request, response) {

    var subjectQuestion = request.session.data['jobs-careers-radios']
    if (subjectQuestion == "Yes"){
        response.redirect("jobs-and-careers")
    }
    else {
        response.redirect("school-subjects-question")
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
