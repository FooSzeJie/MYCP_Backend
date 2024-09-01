// Use Express Js
const express = require("express");

// Use Mongoose DB
const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();



const app = express();

// Users Router
app.use("/api/users", usersRoute);

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
    console.log('password:', process.env.DB_PASSWORD);
  });
