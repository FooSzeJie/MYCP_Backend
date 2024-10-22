// Use Express Js
const express = require("express");

// Use Mongoose DB
const mongoose = require("mongoose");

// middleware to require and responds content
const bodyParser = require("body-parser");

// Load environment variables
require("dotenv").config();

// Use User Route
const user_route = require("./routes/User_Route");

// Use Vehicle Route
const vehicle_route = require("./routes/Vehicle_Route");

const app = express();

// Decode the body
app.use(bodyParser.json());

app.use((req, res, next) => {
  // the "*" can change to localhost:3000
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// Users Router
app.use("/api/users", user_route);

// Vehicle Router
app.use("/api/vehicles", vehicle_route);

// When enter invalid route
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// Show the error
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "An Unknown error ocurred! " });
});

// Connect Database
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fl41x.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    // When successful connect to the database open the server
    app.listen(process.env.PORT || 5000);
    console.log("DB Connect Successful");
  })
  .catch((e) => {
    console.log(e);
  });
