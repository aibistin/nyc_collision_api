var express = require('express');
var router = express.Router();
const logL = "[index]: ";

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(`${logL}Index: Nothing here`);
  res.render('index', { title: 'Express' });
});

module.exports = router;
