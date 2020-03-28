/*
   CollisionDb.js
   collision.db interface
   This version uses callbacks instead of promises.
*/
const sqlite3 = require("sqlite3").verbose();
const logL = "[CollisionDb]: ";
const log = require("../env/logger").moduleLogger;

class CollisionDb {
  constructor(
    pathToDb = "c:\\Users\\ak1\\Apps\\collision\\db\\collision_dec.db"
  ) {
    this.db = new sqlite3.cached.Database(pathToDb, error => {
      if (error) {
        log.error(`${logL}Failed connecting to db!: ${pathToDb}`, error);
        throw new Error(error);
      }
      log.info(`${logL}Connected to the database`);
    });
    this.db.exec("PRAGMA foreign_keys = ON");

    this.fatalitySumsSQL = `
    MIN (date) AS starting_at,
    MAX (date) AS ending_at,
    SUM (number_of_persons_killed) as tot_persons_killed,
    SUM (number_of_pedestrians_killed) as tot_pedestrians_killed,
    SUM (number_of_cyclists_killed) as tot_cyclists_killed,
    SUM (number_of_motorists_killed) as tot_motorists_killed
        FROM collision c
        LEFT JOIN street s1 ON c.on_street_id = s1.id
        LEFT JOIN street s2 ON c.off_street_id = s2.id
        LEFT JOIN street s3 ON c.cross_street_id = s3.id `;
  }

  /* Run */
  run(sql, params = [], _callback) {
    this.db.run(sql, params, function(error) {
      if (error) throw new Error(error);
      /* 
        this.lastID:  has a value, only after a successful insert.
        this.changes: has a value, only after a successful update.
      */
      return _callback({
        id: this.lastID,
        changes: this.changes
      });
    });
  }

  /* Exec */
  exec(sqlTransaction, _callback) {
    this.db.exec(sqlTransaction, error => {
      if (error) throw new Error(error);
      _callback();
    });
  }

  /* Get - one row */
  get(sql, params = [], dealWithRow) {
    this.db.get(sql, params, (error, row) => {
      if (error) throw new Error(error);
      dealWithRow(row);
    });
  }

  /* 
        All - get all matching rows
        Pass: sql
        Optional:
        [colNames],
        {callback: callbackFunc,keyName: 'unique_key_to_find'}
  */
  all(sql, params = [], cbParam = {}) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) reject(error);
        if (cbParam.callback) resolve(cbParam.callback(rows, cbParam.keyName));
        resolve(rows);
      });
    });
  }

  each(sql, params = [], process_results, process_completion) {
    this.db.each(
      sql,
      params,
      (error, row) => {
        if (error) throw new Error(error);
        return process_results(row);
      },
      (error, completion) => {
        if (error) throw new Error(error);
        return process_completion(completion);
      }
    );
  }

  // sqlite3 way for converting Asynchronous to Synchronous.
  serialize(sqlFunction, processTransactions) {
    this.db.serialize(sqlFunction, (error, result) => {
      if (error) throw new Error(error);
      processTransactions(result);
    });
  }

  /* Statements */
  prepare(sql, params = [], _callback) {
    this.db.prepare(sql, params, (error, statement) => {
      if (error) {
        log.error(`${logL}Prepare Error! SQL: ${sql}`, error);
        throw new Error(error);
      }
      return _callback(statement);
    });
  }

  close() {
    this.db.close(error => {
      if (error) {
        log.error(`${logL}Error in close!`);
        throw new Error(error);
      }
      log.error(`${logL}Database is closed!`);
    });
  }

  async getEachStreetNameLike(param, dealWithRow) {
    let getEach = () => {
      return new Promise((resolve, reject) => {
        let allRows = [];
        try {
          this.db.each(
            "SELECT * FROM street WHERE name like ?",
            param,
            (error, row) => {
              if (error) reject(error);
              dealWithRow(row);
            },
            (error, finalRes) => {
              if (error) reject(error);
              resolve(finalRes);
            }
          );
        } catch (e) {
          log.error(`${logL}GetEach Error! `, e);
        }
      });
    };

    try {
      return await getEach();
    } catch (e) {
      log.error(`${logL}Error in getStreeNamesLike: `, e);
    }
  }

  /* ----------------------------------------------------------*/
  /* SELECT                                                    */
  /* ----------------------------------------------------------*/
  select(selectSQL, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(selectSQL, params, (error, row) => {
        if (error) reject(error);
        if (row) resolve(row);
        resolve();
      });
    });
  }
  /* ----------------------------------------------------------*/
  /* Select Sums
  /* ----------------------------------------------------------*/
  async getFatalSums() {
    const sql = ` SELECT ${this.fatalitySumsSQL}`;
    return this.all(sql);
  }

  async getFatalSumsByBorough() {
    const sql = `
        SELECT COALESCE(s1.borough_code,s2.borough_code,s3.borough_code, 'Unknown Borough') AS borough_code,
        ${this.fatalitySumsSQL}
        GROUP BY  COALESCE(s1.borough_code,s2.borough_code,s3.borough_code, 'Unknown Borough')
        ORDER BY  COALESCE(s1.borough_code,s2.borough_code,s3.borough_code, 'Unknown Borough') `;
    return this.all(sql);
  }

  async getFatalSumsByYear() {
    const sql = `SELECT strftime('%Y', date) AS year,
        ${this.fatalitySumsSQL}
        GROUP BY year
        ORDER BY year`;
    return this.all(sql);
  }

  async getFatalSumsByBoroughYear() {
    const sql = `SELECT COALESCE(s1.borough_code,s2.borough_code,s3.borough_code, 'Unknown Borough') AS borough_code,
        strftime('%Y', date) AS year,
        ${this.fatalitySumsSQL}
        GROUP BY year,s1.borough_code
        ORDER BY year,s1.borough_code; `;
    return this.all(sql);
  }

  async getFatalSumsByZip(zipCodes) {
    if (!zipCodes || !zipCodes.length)
      throw new Error(`${logL}'getFatalSumsByZip' No Zip codes given`);
    const zipCodesStr = Array.isArray(zipCodes)
      ? zipCodes.map(zip => `'${zip}'`).join()
      : `'${zipCodes}'`;
    log.debug(`${logL}SQL zipCodesStr ${zipCodesStr}`);
    const sql = `
    SELECT SUM (number_of_persons_killed) as tot_persons_killed,
    SUM (number_of_pedestrians_killed) as tot_pedestrians_killed,
    SUM (number_of_cyclists_killed) as tot_cyclists_killed,
    SUM (number_of_motorists_killed) as tot_motorists_killed,
    COALESCE(s1.zip_code, s2.zip_code, s3.zip_code, 'No Zip') as zip_code,
    COALESCE(s1.borough_code, s2.borough_code, s3.borough_code, 'No Boro') as borough_code
    FROM collision c
    LEFT JOIN street s1 ON c.on_street_id = s1.id
    LEFT JOIN street s2 ON c.off_street_id = s2.id
    LEFT JOIN street s3 ON c.cross_street_id = s3.id
    GROUP BY  COALESCE(s1.zip_code, s2.zip_code,s3.zip_code), COALESCE(s1.borough_code, s2.borough_code, s3.borough_code)
    HAVING COALESCE(s1.zip_code, s2.zip_code,s3.zip_code) in (${zipCodesStr})
    ORDER BY  tot_persons_killed desc, borough_code`;
    return this.all(sql);
  }
  /* ----------------------------------------------------------*/
  /* Utils                                                    */
  /* ----------------------------------------------------------*/
  _toStr(obj = {}) {
    return JSON.stringify(obj, null, 2);
  }
}

module.exports = CollisionDb;
