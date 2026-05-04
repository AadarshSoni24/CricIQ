const router = require('express').Router();
const { predict, getHistory, savePrediction } = require('../controllers/predictController');

router.post('/', predict);
router.get('/history', getHistory);
router.post('/save', savePrediction);

module.exports = router;
