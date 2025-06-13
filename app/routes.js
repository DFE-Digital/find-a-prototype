//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here
router.use('/02', require('./views/02/_routes'));
router.use('/03', require('./views/03/_routes'));
router.use('/04', require('./views/04/_routes'));
router.use('/05', require('./views/05/_routes'));
router.use('/06', require('./views/06/_routes'));

module.exports = router