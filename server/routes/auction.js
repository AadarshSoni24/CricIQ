const router = require('express').Router();
const { recommend, getFilters } = require('../controllers/auctionController');

router.post('/recommend', recommend);
router.get('/filters', getFilters);

module.exports = router;
