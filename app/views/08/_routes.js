const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

const fs = require("fs");
const path = require("path");

router.get("/load-courses", function (req, res) {
  // ---------- helpers
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const HOURS_ALIASES = {
    "full time": "full time",
    "full-time": "full time",
    ft: "full time",
    "part time": "part time",
    "part-time": "part time",
    pt: "part time",
    flexible: "flexible",
    flexi: "flexible",
    flex: "flexible",
  };
  const METHOD_ALIASES = {
    online: "online",
    "classroom based": "classroom based",
    "classroom-based": "classroom based",
    "work based": "work based",
    "work-based": "work based",
    hybrid: "hybrid",
  };
  const TIME_ALIASES = {
    daytime: "daytime",
    evening: "evening",
    weekend: "weekend",
  };

  const mapWith = (aliases, s) => (s == null ? "" : aliases[norm(s)] || norm(s));
  const getArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const cleanArray = (arr) =>
    getArray(arr).map(String).map((s) => s.trim()).filter((s) => s && norm(s) !== "_unchecked");

  const milesValue = (val) => {
    if (val == null) return Number.POSITIVE_INFINITY;
    const m = String(val).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : Number.POSITIVE_INFINITY;
  };
  const intersects = (arr, set) => arr.some((v) => set.has(v));

  // ---------- load data
  const dataFile = path.join(__dirname, "../../data/courses.json");
  let coursesData = [];
  try {
    coursesData = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (e) {
    console.error("❌ Error loading course data:", e.message);
    return res.status(500).send("Error loading course data.");
  }

  // ---------- dataset distincts (normalised)
  const typesSet  = new Set(coursesData.map((c) => norm(c.type)).filter(Boolean));
  const hoursSet  = new Set(coursesData.map((c) => mapWith(HOURS_ALIASES, c.courseHours)).filter(Boolean));
  const methodSet = new Set(coursesData.map((c) => mapWith(METHOD_ALIASES, c.deliveryMethod)).filter(Boolean));
  const timeSet   = new Set(coursesData.map((c) => mapWith(TIME_ALIASES, c.studyTime)).filter(Boolean));

  // ---------- parse inputs
  const q  = req.query || {};
  const sd = req.session?.data || {};

  // Types
  let qualificationFilters = cleanArray(q["filter"]);
  if (qualificationFilters.length === 0) qualificationFilters = cleanArray(sd["filter"]);

  // Levels → expand legacy groups
  let selectedLevels = cleanArray(q["qualification-level"]);
  if (selectedLevels.length === 0) selectedLevels = cleanArray(sd["qualification-level"]);
  selectedLevels = selectedLevels.flatMap((lvl) =>
    lvl === "level-1-2" ? ["level-1", "level-2"] :
    lvl === "level-4-7" ? ["level-4", "level-5", "level-6", "level-7"] :
    [lvl]
  );

  // Level → type mapping
  const qualificationMap = {
    entry: ["Functional Skills"],
    "level-1": ["BTEC", "Apprenticeship"],
    "level-2": ["BTEC", "Apprenticeship"],
    "level-3": ["A Level", "BTEC", "T Level", "Apprenticeship"],
    "level-4": ["Diploma"],
    "level-5": ["Diploma"],
    "level-6": ["Degree"],
    "level-7": ["Degree"],
  };
  const levelMappedQualifications = selectedLevels.flatMap((lvl) => qualificationMap[lvl] || []);

  // New facets (normalised)
  const selectedLearningMethods = (cleanArray(q["learning-method"]).length
      ? cleanArray(q["learning-method"])
      : cleanArray(sd["learning-method"])).map((v) => mapWith(METHOD_ALIASES, v));

  const selectedCourseHours = (cleanArray(q["course-hours"]).length
      ? cleanArray(q["course-hours"])
      : cleanArray(sd["course-hours"])).map((v) => mapWith(HOURS_ALIASES, v));

  const selectedCourseTimes = (cleanArray(q["course-times"]).length
      ? cleanArray(q["course-times"])
      : cleanArray(sd["course-times"])).map((v) => mapWith(TIME_ALIASES, v));

  // Base search inputs
  const locationFilter = (q["option-select-filter-location"] || sd["location"] || "").toString().trim();
  const subjectFilter  = (q["subject-filter"] || sd["interest-1"] || sd["job-1"] || "").toString().trim();
  const travelDistance = (q["travel-location"] || sd["travel-location"] || "").toString().trim();
  const sort = (q.sort || "distance").toString().toLowerCase();

  const locationFilterLower = norm(locationFilter);
  const subjectFilterLower  = norm(subjectFilter);

  // Is this a base search? Are there facet filters?
  const hasBaseSearch   = !!locationFilterLower || !!subjectFilterLower;
  const hasFacetFilters =
    qualificationFilters.length > 0 ||
    selectedLevels.length > 0 ||
    selectedLearningMethods.length > 0 ||
    selectedCourseHours.length > 0 ||
    selectedCourseTimes.length > 0 ||
    !!travelDistance;

  // ---------- 1) Base search (subject/location only)
  let baseFiltered = coursesData.slice();

  if (locationFilterLower) {
    baseFiltered = baseFiltered.filter((c) => norm(c.location).includes(locationFilterLower));
  }
  if (subjectFilterLower) {
    baseFiltered = baseFiltered.filter(
      (c) => norm(c.name).includes(subjectFilterLower) || norm(c.overview).includes(subjectFilterLower)
    );
  }

  // If user provided search terms and base search is empty → redirect
  if (hasBaseSearch && baseFiltered.length === 0) {
    const qs = req.url.includes("?") ? req.url.split("?")[1] : "";
    return res.redirect(`search-results-no-results${qs ? `?${qs}` : ""}`);
  }

  // ---------- 2) Apply facets to the base results
  let filtered = baseFiltered;

  // Type (only if overlaps)
  const normalisedTypeFilters = [...qualificationFilters, ...levelMappedQualifications]
    .map((f) => norm(f))
    .filter(Boolean);
  if (normalisedTypeFilters.length > 0 && intersects(normalisedTypeFilters, typesSet)) {
    filtered = filtered.filter((c) => normalisedTypeFilters.includes(norm(c.type)));
  }

  // Learning method (only if overlaps)
  if (selectedLearningMethods.length > 0 && intersects(selectedLearningMethods, methodSet)) {
    filtered = filtered.filter((c) =>
      selectedLearningMethods.includes(mapWith(METHOD_ALIASES, c.deliveryMethod))
    );
  }

  // Course hours — strict equality
  if (selectedCourseHours.length > 0) {
    const selectedHoursSet = new Set(selectedCourseHours);
    filtered = filtered.filter((c) => selectedHoursSet.has(mapWith(HOURS_ALIASES, c.courseHours)));
  }

  // Study time (only if overlaps)
  if (selectedCourseTimes.length > 0 && intersects(selectedCourseTimes, timeSet)) {
    filtered = filtered.filter((c) =>
      selectedCourseTimes.includes(mapWith(TIME_ALIASES, c.studyTime))
    );
  }

  // Distance
  if (travelDistance) {
    const maxMiles = milesValue(travelDistance);
    filtered = filtered.filter((c) => milesValue(c.distance) <= maxMiles);
  }

  // ---------- Inline no-results only when:
  // base search returned something AND filtering wiped it out.
  const noResults = baseFiltered.length > 0 && filtered.length === 0;

  // ---------- sorting
  const relValue = (v) => (Number.isFinite(Number(v)) ? Number(v) : -1);
  if (sort === "distance") {
    filtered.sort((a, b) => {
      const am = milesValue(a.distance);
      const bm = milesValue(b.distance);
      if (am === bm) return relValue(b.relevance) - relValue(a.relevance);
      if (am === Number.POSITIVE_INFINITY) return 1;
      if (bm === Number.POSITIVE_INFINITY) return -1;
      return am - bm;
    });
  } else if (sort === "relevance") {
    filtered.sort((a, b) => {
      const ar = relValue(a.relevance);
      const br = relValue(b.relevance);
      if (br !== ar) return br - ar;
      const am = milesValue(a.distance);
      const bm = milesValue(b.distance);
      if (am === bm) return 0;
      if (am === Number.POSITIVE_INFINITY) return 1;
      if (bm === Number.POSITIVE_INFINITY) return -1;
      return am - bm;
    });
  }

  // ---------- pagination + render
  const page = parseInt(q.page) || 1;
  const perPage = 10;
  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const splitOverview = (str = "", limit = 450) => {
    const s = String(str || "").trim();
    if (s.length <= limit) return { short: s, remaining: "" };
    let cut = s.lastIndexOf(".", limit);
    if (cut === -1 || cut < limit * 0.6) cut = s.lastIndexOf(" ", limit);
    if (cut < 0) cut = limit;
    return { short: s.slice(0, cut + 1).trim(), remaining: s.slice(cut + 1).trim() };
  };

  const generateSlug = (course) =>
    ((course.name || "") + "-" + (course.provider || ""))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const pageItems = filtered.slice(start, end).map((c) => {
    const { short, remaining } = splitOverview(c.overview, 450);
    return { ...c, slug: generateSlug(c), shortOverview: short, remainingOverview: remaining };
  });

  res.render("08/courses", {
    courses: pageItems,
    currentPage: page,
    totalPages,
    totalResults,

    // sticky values
    selectedQualifications: [...new Set([...qualificationFilters, ...levelMappedQualifications])],
    selectedLevels,
    selectedLocation: locationFilter,
    selectedSubject: subjectFilter,
    travelDistance,
    sort,
    selectedLearningMethods,
    selectedCourseHours,
    selectedCourseTimes,

    // inline no-results flag
    noResults
  });
});







router.get('/course/:slug', function (req, res) {
    console.log("✅ Reached /08/course/:slug");
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
  
    res.render("08/course-detail", { course });
  });
  
  
  router.get('/clear-session-and-go', function (req, res) {
    req.session.data = {} // Clear all session data
    res.redirect('location') // Replace with your desired page
  })




// GET location
router.get('/location', function (req, res) {
  if (req.query.from === 'check-answers') {
    req.session.data.returnToCheckAnswers = true;
  }

  res.render('08/location');
});

// POST location
router.post('/location', function (req, res) {
  if (req.session.data.returnToCheckAnswers) {
    delete req.session.data.returnToCheckAnswers;
    return res.redirect('check-answers');
  }

  // Normal linear journey
  return res.redirect('interests');
});

// GET interests
router.get('/interests', function (req, res) {
  if (req.query.from === 'check-answers') {
    req.session.data.returnToCheckAnswers = true;
  }

  res.render('08/interests');
});

// POST interests
router.post('/interests', function (req, res) {
  if (req.session.data.returnToCheckAnswers) {
    delete req.session.data.returnToCheckAnswers;
    return res.redirect('check-answers');
  }

  // Normal linear journey
  return res.redirect('level');
});


// GET level
router.get('/level', function (req, res) {
  if (req.query.from === 'check-answers') {
    req.session.data.returnToCheckAnswers = true;
  }

  res.render('08/level');
});

// POST levels
router.post('/levels', function (req, res) {
  const raw = req.session.data['qualification-level'] || [];
  const selected = Array.isArray(raw) ? raw : [raw].filter(Boolean);
  const fromCheckAnswers = !!req.session.data.returnToCheckAnswers;

  const needsAge = selected.includes('none') || selected.includes('level-1-2');

  if (needsAge) {
    // Keep the flag so /age can send the user back to check-answers
    return res.redirect('age');
  }

  // No age page needed
  if (fromCheckAnswers) {
    delete req.session.data.returnToCheckAnswers;
    return res.redirect('check-answers');
  }

  // Normal linear journey also ends at check-answers
  return res.redirect('check-answers');
});


// GET age
router.get('/age', function (req, res) {
  if (req.query.from === 'check-answers') {
    req.session.data.returnToCheckAnswers = true;
  }

  res.render('08/age');
});

// POST age
router.post('/age', function (req, res) {
  if (req.session.data.returnToCheckAnswers) {
    delete req.session.data.returnToCheckAnswers;
    return res.redirect('check-answers');
  }

  // For this journey, age always goes to check-answers
  return res.redirect('check-answers');
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
