const express = require("express");

const saman_controller = require("../controllers/Saman_Controller");

const router = express.Router();

router.get("/:sid/detail", saman_controller.getSamanById);

router.post("/create", saman_controller.createSaman);

module.exports = router;
