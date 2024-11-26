const express = require("express");

const saman_controller = require("../controllers/Saman_Controller");

const router = express.Router();

router.get("/:sid/detail", saman_controller.getSamanById);

router.get("/:uid/list", saman_controller.getSamanHistoryByUserId);

router.get("/:uid/given/list", saman_controller.getGivenSamanByUserId);

router.post("/create", saman_controller.createSaman);

router.patch("/:sid/paid", saman_controller.paidSaman);

module.exports = router;
