const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

const fs = require("fs");
const path = require("path");

router.get("/load-courses", function (req, res) {
  console.log("Session data:", req.session.data);

  // 🔧 Labels and Mappings
  const levelLabels = {
    "entry": "Entry level",
    "level-1": "Level 1",
    "level-2": "Level 2",
    "level-3": "Level 3",
    "level-4": "Level 4",
    "level-5": "Level 5",
    "level-6": "Level 6",
    "level-7": "Level 7"
  };

  const qualificationMap = {
    "entry": ["Functional Skills"],
    "level-1": ["BTEC", "Apprenticeship"],
    "level-2": ["BTEC", "Apprenticeship"],
    "level-3": ["A Level", "BTEC", "T Level", "Apprenticeship"],
    "level-4": ["Diploma"],
    "level-5": ["Diploma"],
    "level-6": ["Degree"],
    "level-7": ["Degree"]
  };

  const validAges = ["under-18", "18-21", "over-24"];

  // 📥 Load course data
  let coursesData = [];
  try {
    coursesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../data/courses.json"), "utf8")
    );
  } catch (error) {
    console.error("Error loading course data:", error.message);
    return res.status(500).send("Error loading course data.");
  }

  // 🧱 Slug generator
  const generateSlug = (course) => {
    return (
      (course.name || "") + "-" + (course.provider || "")
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // 🧠 Load inputs
  const age = req.session.data["age"] || req.query["age"];
  const nextStep = req.session.data["next-step"] || req.query["next-step"];
  const learningStyle = req.session.data["learning-style"];

  // ✅ Get selected levels
  const getArray = (input) =>
    Array.isArray(input) ? input : input ? [input] : [];
  
  let selectedLevels = getArray(
    req.query["qualification-level"] || req.session.data["qualification-level"]
  );

  // 🧹 Normalise & fallback from legacy grouped levels
  selectedLevels = selectedLevels
    .flatMap(level => {
      if (level === "level-1-2") return ["level-1", "level-2"];
      if (level === "level-4-7") return ["level-4", "level-5", "level-6", "level-7"];
      return [level];
    })
    .filter(level => level && level !== "_unchecked");

  // 🧭 Read query params EARLY
  const travelDistance =
    (req.query["travel-location"] || req.session.data["travel-location"] || "").trim();

  // Accepts "distance" | "relevance" | "" (no sort)
  const sort = (req.query.sort || "").toLowerCase();

  // Helpers
  const milesValue = (val) => {
    if (val == null) return Number.POSITIVE_INFINITY;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  };
  const relValue = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : -1; // missing relevance => end when sorting by relevance
  };

  // ✅ Qualification filters
  let qualificationFilters = getArray(req.query.filter || req.session.data["filter"]);
  if (!Array.isArray(qualificationFilters)) {
    qualificationFilters = [qualificationFilters];
  }

  // 🌟 Fallbacks
  if (
    selectedLevels.length === 0 &&
    qualificationFilters.length === 0 &&
    !req.query["option-select-filter-location"] &&
    !req.query["subject-filter"]
  ) {
    if (nextStep === "university" && validAges.includes(age)) {
      selectedLevels = ["level-4", "level-5", "level-6", "level-7"];
    }
  }

  if (
    qualificationFilters.length === 0 &&
    selectedLevels.length === 0 &&
    !req.query["option-select-filter-location"] &&
    !req.query["subject-filter"]
  ) {
    if (learningStyle === "I prefer academic courses") {
      qualificationFilters = ["A Level", "Degree"];
    } else if (learningStyle === "I prefer practical courses") {
      qualificationFilters = ["Apprenticeship", "T Level", "Diploma", "BTEC"];
    } else if (learningStyle === "I'd like to see both academic and practical courses") {
      qualificationFilters = ["A Level", "Degree", "Apprenticeship", "T Level", "Diploma", "BTEC"];
    }
  }

  // ✅ Map levels to qualification types and merge filters
  const levelMappedQualifications = selectedLevels.flatMap(
    level => qualificationMap[level] || []
  );

  qualificationFilters = [...qualificationFilters, ...levelMappedQualifications]
    .map(f => f && String(f).trim().toLowerCase())
    .filter(f => f && f !== "_unchecked");

  // ✅ Other filters
  const locationFilter =
    req.query["option-select-filter-location"] ||
    req.session.data["location"] ||
    "";

  const subjectFilter =
    req.query["subject-filter"] ||
    req.session.data["interest-1"] ||
    req.session.data["job-1"] ||
    "";

  const locationFilterLower = locationFilter.trim().toLowerCase();
  const subjectFilterLower = subjectFilter.trim().toLowerCase();

  // 🔍 Apply filtering (declare first, then mutate!)
  let filteredCourses = coursesData;

  if (qualificationFilters.length > 0) {
    filteredCourses = filteredCourses.filter(course =>
      qualificationFilters.includes((course.type || "").toLowerCase())
    );
  }

  if (locationFilterLower !== "") {
    filteredCourses = filteredCourses.filter(course =>
      (course.location || "").toLowerCase().includes(locationFilterLower)
    );
  }

  if (subjectFilterLower !== "") {
    filteredCourses = filteredCourses.filter(course =>
      (course.name || "").toLowerCase().includes(subjectFilterLower) ||
      (course.overview || "").toLowerCase().includes(subjectFilterLower)
    );
  }

  // ⛔ Filter by max travel distance (if selected, e.g. "10 miles")
  if (travelDistance !== "") {
    const maxMiles = milesValue(travelDistance);
    filteredCourses = filteredCourses.filter(c => milesValue(c.distance) <= maxMiles);
  }

  // 🔢 Sorting (two options)
  if (sort === "distance") {
    // Nearest first, tie-break by relevance desc
    filteredCourses.sort((a, b) => {
      const am = milesValue(a.distance);
      const bm = milesValue(b.distance);
      if (am === bm) {
        const ar = relValue(a.relevance);
        const br = relValue(b.relevance);
        return br - ar; // higher relevance first
      }
      if (am === Number.POSITIVE_INFINITY) return 1;   // a missing/invalid => end
      if (bm === Number.POSITIVE_INFINITY) return -1;  // b missing/invalid => end
      return am - bm;
    });
  } else if (sort === "relevance") {
    // Highest relevance first, tie-break by distance asc
    filteredCourses.sort((a, b) => {
      const ar = relValue(a.relevance);
      const br = relValue(b.relevance);
      if (br !== ar) return br - ar; // relevance desc (99 → 1)
      const am = milesValue(a.distance);
      const bm = milesValue(b.distance);
      if (am === bm) return 0;
      if (am === Number.POSITIVE_INFINITY) return 1;
      if (bm === Number.POSITIVE_INFINITY) return -1;
      return am - bm;
    });
  }

  // 📄 Pagination
  const page = parseInt(req.query.page) || 1;
  const perPage = 10;
  const totalResults = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const paginatedCourses = filteredCourses.slice(start, end).map(course => ({
    ...course,
    slug: generateSlug(course),
  }));

  // 🖥️ Render page
  res.render("09/courses", {
    courses: paginatedCourses,
    currentPage: page,
    totalPages,
    totalResults,
    selectedQualifications: Array.from(new Set([
      ...qualificationFilters,
      ...levelMappedQualifications
    ])).map(q => q.charAt(0).toUpperCase() + q.slice(1)),
    selectedLocation: locationFilter,
    selectedSubject: subjectFilter,
    selectedLevels: selectedLevels,
    selectedLevelTags: selectedLevels.map(level => levelLabels[level] || level),
    travelDistance, // keep select sticky
    sort,           // "distance" | "relevance" | ""
  });

  // 🧪 Debug
  console.log("🔍 Slugs from paginatedCourses:");
  paginatedCourses.forEach(c => console.log(c.slug));
});






router.get('/course/:slug', function (req, res) {
    console.log("✅ Reached /09/course/:slug");
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
  
    res.render("09/course-detail", { course });
  });
  
  
  router.get('/clear-session-and-go', function (req, res) {
    req.session.data = {} // Clear all session data
    res.redirect('location') // Replace with your desired page
  })

  router.post("/levels", (req, res) => {
    // Pull the submitted values (can be string or array depending on selection count)
    const raw = req.session.data["qualification-level"] || [];
    const selected = Array.isArray(raw) ? raw : [raw];
  
    // If 'none' OR 'level-1-2' selected => go to 'age'
    if (selected.includes("none") || selected.includes("level-1-2")) {
      return res.redirect("age");
    }
  
    // Otherwise => go to 'check-answers'
    return res.redirect("check-answers");
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

router.post('/job-subject-adult', function(request, response) {

    var searchAdult = request.session.data['search-adult']
    if (searchAdult == "By a course name, subject, job or career"){
        response.redirect("subjects-18-24")
    }
    else if (searchAdult == "See all options in my location"){
        response.redirect("location-adults")
    }
    else {
        response.redirect("location-adults-2")
    }
})

router.post('/job-subject-adult-2', function(request, response) {

  var searchAdult2 = request.session.data['search-adult']
  if (searchAdult2 == "By a course name, subject, job or career"){
      response.redirect("subjects-18-24")
  }
  else if (searchAdult2 == "See all options in my location"){
      response.redirect("location-adults")
  }
  else {
      response.redirect("location-adults-2")
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
        return res.redirect('what-adults-2');
    }

     // Rule 4: page-d
    if (age === 'over-24') {
        return res.redirect('what-adults');
    }
    
    // Default/fallback route
    return res.redirect(`/${age}/${nextStep}`);
  });

  
  router.post('/levels-or-not', function (req, res) {
    req.session.data['age'] = req.body['age'];
    req.session.data['next-step'] = req.body['next-step'];
    res.redirect('check-answers');
  });
  
  router.post('/level-or-not-2', function (req, res) {
    req.session.data['search-adult'] = req.body['search-adult'];
  
    // Check logic here
    if (
      req.session.data['age'] === 'over-24' &&
      req.session.data['next-step'] === 'university' &&
      req.session.data['search-adult'] === 'Answer a couple of questions to get more personalised results'
    ) {
      return res.redirect('check-answers');
    }

    else {
      res.redirect("levels-adult")
  }
  
    // Fallback or default routing
    res.redirect('/default-page');
  });


  router.get('/level-or-check', function (req, res) {
    const a = req.session.data['age'];
    const b = req.session.data['next-step'];
    const c = req.session.data['search-adult'];
  
    if (a === 'over-24' && b === 'university' && c === 'Answer a couple of questions to get more personalised results') {
      return res.redirect('check-answers');
    }
  
    return res.redirect('level-adult');
  });
  



module.exports = router
