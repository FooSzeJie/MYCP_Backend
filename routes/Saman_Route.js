const express = require("express");

const saman_controller = require("../controllers/Saman_Controller");

const router = express.Router();

router.post("/create", saman_controller.createSaman);

module.exports = router;
