const router = require('express').Router();
const { getMatchupData } = require('../controllers/matchupController');

/**
 * @route POST /api/matchup
 * @desc Get detailed head-to-head matchup data
 */
router.post('/', getMatchupData);

module.exports = router;
