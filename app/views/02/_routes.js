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

module.exports = router
