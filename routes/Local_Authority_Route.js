const express = require("express");

const { check } = require("express-validator");

const local_Authority_controller = require("../controllers/Local_Authority_Controller");

const router = express.Router();

router.post("/login", local_Authority_controller.login);

module.exports = router;
