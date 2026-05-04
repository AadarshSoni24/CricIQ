const router = require('express').Router();
const { searchPlayers, getPlayer, getPlayerVenues, getPlayerMatchups } = require('../controllers/playerController');

router.get('/search', searchPlayers);
router.get('/:name', getPlayer);
router.get('/:name/venues', getPlayerVenues);
router.get('/:name/matchups', getPlayerMatchups);

module.exports = router;
