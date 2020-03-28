var express = require("express");
var router = express.Router();
const CollisionDb = require("../api/CollisionDb");
const Valid = require("../Validation/Valid");
const log = require("../env/logger").moduleLogger;
// var logger = require("morgan");

const logL = "[fatalRoute]: ";
const valid = new Valid();
// const log = require("../env/logger").logger;

/* GET fatalities. */
router.get("/", async function(req, res, next) {
  log.info(`${logL}Fatal route '/'`);
  const db = new CollisionDb();
  try {
    const sums = await db.getFatalSums();
    log.debug(`${logL}Got sums: ` + JSON.stringify(sums));
    res.status(200).json(sums);
  } catch (e) {
    log.error(`${logL}Failed getting 'getFatalSums' ${_toStr(e)} `);
    next();
  }
});

router.get("/borough", async function(req, res, next) {
  log.info(`${logL}Req path: ${req.path}`);
  const db = new CollisionDb();
  try {
    const sums = await db.getFatalSumsByBorough();
    log.info("Got " + JSON.stringify(sums));
    res.status(200).json(sums);
  } catch (e) {
    log.error(`${logL}Failed getting 'getFatalSumsByBorough' ${_toStr(e)} `);
    next();
  }
});

router.get("/year", async function(req, res, next) {
  log.info(`${logL}Fatal/year`);
  _printReq(req);
  const db = new CollisionDb();
  try {
    const sums = await db.getFatalSumsByYear();
    log.info("Got " + JSON.stringify(sums));
    res.status(200).json(sums);
  } catch (e) {
    log.error(`${logL}Failed getting 'getFatalSumsByYear' ${_toStr(e)} `);
    next();
  }
});

router.get("/boro_year", async function(req, res, next) {
  log.info(`${logL}Fatal/boro_year`);
  const db = new CollisionDb();
  try {
    const sums = await db.getFatalSumsByBoroughYear();
    log.info("Got " + JSON.stringify(sums));
    res.status(200).json(sums);
  } catch (e) {
    log.error(
      `${logL}Failed getting 'getFatalSumsByBoroughYear' ${_toStr(e)} `
    );
    next();
  }
});

router.get("/by_zip/:zip", async function(req, res, next) {
  const zips = valid.checkAndCleanZips(req.params.zip);
  log.info(`${logL}Fatal/by_zip zip: ${zips}`);
  let thisStatus = "200";

  log.info(`Current ENV: ${req.app.get("env")}`);

  let sums = [];
  if (zips && zips.length) {
      const db = new CollisionDb();
      try {
        sums = await db.getFatalSumsByZip(zips);
      } catch (e) {
        log.error(`${logL}'getFatalSumsByZip' failed getting ${_toStr(e)} `);
        next(e);
      }
  } else {
    log.error(`${logL}'getFatalSumsByZip' No valid zip codes`);
    thisStatus = "404";
  }
  log.debug(`${logL}'getFatalSumsByZip' got ${_toStr(sums)}`);
  res.status(thisStatus).json(sums);
});

module.exports = router;

const _printReq = req => {
  log.info(`${logL}Req. BaseUrl: ${req.baseUrl}`);
  log.info(`${logL}Req. Body: ${_toStr(req.body)}`);

  log.info(`${logL}Req. HostName: ${req.hostname}`);
  log.info(`${logL}Req. IP: ${req.ip}`);

  log.info(`${logL}Req. Param: ${req.param}`);
  log.info(`${logL}Req. Path: ${req.path}`);
  log.info(`${logL}Req. Protocol: ${req.protocol}`);

  log.info(`${logL}Req. Query: ${_toStr(req.query)}`);
  log.info(`${logL}Req. Route: ${_toStr(req.route)}`);
  log.info(`${logL}Req. XHR: ${req.xhr}`);
};

const _toStr = (obj = {}) => {
  return JSON.stringify(obj, null, 2);
};
