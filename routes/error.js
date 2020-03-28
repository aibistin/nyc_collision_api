var express = require("express");
var router = express.Router();
const logL = "[errorRoute]: ";
const Valid = require("../Validation/Valid");
const valid = new Valid();

/* GET fatalities. */
router.get("/", async function(error,req, res, next) {
  // const errorStr = valid.isStrOk(resp.params.error) ? resp.params.error : 'Error!' ;
  console.log(`${logL} Gadzooks route '/'`);
    res.status(400).send(error.stack);
    // next();
});

module.exports = router;

