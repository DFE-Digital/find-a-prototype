const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

const fs = require("fs");
const path = require("path");

router.get("/load-courses", function (req, res) {

  // Load course data
  let coursesData = [];
  try {
    coursesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../data/courses.json"), "utf8")
    );
  } catch (error) {
    console.error("Error loading course data:", error.message);
    return res.status(500).send("Error loading course data.");
  }

  // Helper to generate unique slugs for course links
  const generateSlug = (course) => {
    return (
      (course.name || "") + "-" + (course.provider || "")
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Get qualification filters from query or learning-style
  let qualificationFilters = [];

  if (req.query.filter) {
    qualificationFilters = Array.isArray(req.query.filter)
      ? req.query.filter
      : [req.query.filter];
  } else {
    const style = req.session.data["learning-style"];

    if (style === "I prefer academic courses") {
      qualificationFilters = ["A Level", "Degree"];
    } else if (style === "I prefer practical courses") {
      qualificationFilters = ["BTEC", "Apprenticeship", "Diploma", "T Level"];
    } else if (style === "I'd like to see both academic and practical courses") {
      qualificationFilters = [
        "A Level",
        "Degree",
        "BTEC",
        "Apprenticeship",
        "Diploma",
        "T Level",
      ];
    }
  }

  qualificationFilters = qualificationFilters
    .map((f) => f.trim().toLowerCase())
    .filter((f) => f && f !== "_unchecked");

  const locationFilter =
    req.query["option-select-filter-location"] ||
    req.session.data["location"] ||
    "";

  const subjectFilter =
    req.query["subject-filter"] ||
    req.session.data["subject-1"] ||
    req.session.data["job-1"] ||
    "";

  const locationFilterLower = locationFilter.trim().toLowerCase();
  const subjectFilterLower = subjectFilter.trim().toLowerCase();

  // Filter the full course list
  let filteredCourses = coursesData;

  if (qualificationFilters.length > 0) {
    filteredCourses = filteredCourses.filter((course) =>
      qualificationFilters.includes((course.type || "").toLowerCase())
    );
  }

  if (locationFilterLower !== "") {
    filteredCourses = filteredCourses.filter((course) =>
      (course.location || "").toLowerCase().includes(locationFilterLower)
    );
  }

  if (subjectFilterLower !== "") {
    filteredCourses = filteredCourses.filter(
      (course) =>
        (course.name || "").toLowerCase().includes(subjectFilterLower) ||
        (course.overview || "").toLowerCase().includes(subjectFilterLower)
    );
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const totalResults = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const start = (page - 1) * perPage;
  const end = start + perPage;

  // Slice and attach slugs
  const paginatedCourses = filteredCourses.slice(start, end).map((course) => ({
    ...course,
    slug: generateSlug(course),
  }));

  res.render("06/courses", {
    courses: paginatedCourses,
    currentPage: page,
    totalPages: totalPages,
    totalResults: totalResults,
    selectedQualifications: qualificationFilters.map(
      (q) => q.charAt(0).toUpperCase() + q.slice(1)
    ),
    selectedLocation: locationFilter,
    selectedSubject: subjectFilter,
  });

  console.log("🔍 Slugs from paginatedCourses:");
  paginatedCourses.forEach(c => console.log(c.slug));

});



router.get('/course/:slug', function (req, res) {
    console.log("✅ Reached /06/course/:slug");
    const slug = req.params.slug;
  
    let coursesData = [];
    try {
      coursesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../../data/courses.json"), "utf8")
      );
    } catch (err) {
      console.error("Failed to load courses:", err.message);
      return res.status(500).send("Error loading courses");
    }
  
    const generateSlug = (course) => {
      return (
        (course.name || "") + "-" + (course.provider || "")
      )
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    };
  
    const course = coursesData.find((c) => generateSlug(c) === slug);
  
    if (!course) {
      console.log("❌ No course found for slug:", slug);
      return res.status(404).send("Course not found");
    }
  
    res.render("06/course-detail", { course });
  });
  
  
  



router.post('/age-results', function(request, response) {

    var ageRange = request.session.data['age']
    if (ageRange == "under-18"){
        response.redirect("location")
    }
    else {
        response.redirect("age-next-steps")
    }
})

router.post('/18-all-or-subject', function(request, response) {

    var searchInterest = request.session.data['all-or-nothing']
    if (searchInterest == "Find all courses nearby"){
        response.redirect("check-answers")
    }
    else {
        response.redirect("subjects")
    }
})

router.post('/job-subject-all', function(request, response) {

    var searchInterest = request.session.data['all-or-nothing']
    if (searchInterest == "Find all courses nearby"){
        response.redirect("check-answers")
    }
    else {
        response.redirect("subjects")
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


router.post('/next-steps', (req, res) => {
    const { age, 'next-step': nextStep } = req.body;
  
    // Guard clause if values are missing
    if (!age || !nextStep) {
      return res.redirect('/error-page'); // or render an error template
    }
  
    // Specific condition for /page-a
    if (
      (age === 'under-18' || age === '18-21') &&
      nextStep === 'university'
    ) {
      return res.redirect('subjects-18-24');
    }

    // Route to /page-b
    if (
        age === 'under-18' &&
        (nextStep === 'gcses' || nextStep === 'return')
    ) {
        return res.redirect('location');
    }

      // Rule 3: Route to /page-c
    if (
        age === '18-21' &&
        (nextStep === 'gcses' || nextStep === 'return')
    ) {
        return res.redirect('what-adults');
    }

     // Rule 4: page-d
    if (age === 'over-24') {
        return res.redirect('what-adults');
    }
    
    // Default/fallback route
    return res.redirect(`/${age}/${nextStep}`);
  });
  




module.exports = router
