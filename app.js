var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var fatalRouter = require("./routes/fatal");
var errorRouter = require("./routes/error");
const log = require("./env/logger").logger;

var app = express();
const logL = "[app]: ";

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Prevent CORS errors. I added this from: https://jonathanmh.com/how-to-enable-cors-in-express-js-node-js/
app.use(function(req, res, next) {
  log.debug(`${logL}Add the 'Access-Control-Allow-Headers`);
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/wasters", usersRouter);
app.use("/fatal", fatalRouter);
app.use("/deaths", fatalRouter);
app.use("/error", errorRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  log.error(`${logL}404 error route`);
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  log.debug(`${logL}Inside default error handler`);
  // set locals, only providing error in development
  res.locals.message = err.message;
  log.error(`${logL} Error MSG: ${err.message}`);
  log.error(`${logL} Error MSG Locals: ${res.locals.message}`);
  log.error(`${logL} Error: `, err);
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
