require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

require("./app_api/models/db");
require("./app_api/config/passport");
const usersRouter = require("./app_api/routes/users");
//require('./app_server/models/db');
const passport = require('passport');


// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// const indexRouter = require('./app_server/routes/index');
const apiRouter = require("./app_api/routes/index");

const app = express();

const cors = require("cors");
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 //For legacy browser support
};
app.use(cors(corsOptions));


app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set("views", path.join(__dirname, "app_server", "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "app_public", "build")));
app.use(passport.initialize());

// app.use("/", indexRouter);
app.use("/api", apiRouter);
//app.use("/users", usersRouter);


app.use(function (req, res, next) {
  next(createError(404));
});


// error handlers
// Catch unauthorised errors
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res
      .status(401)
      .json({ "message": err.name + ": " + err.message });
  }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.get("*", (req, res, next) => {
  res.sendFile(path.join(__dirname, "app_public", "build", "index.html"));
});

module.exports = app;
