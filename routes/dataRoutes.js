const express = require("express");
const router = express.Router();
const {
  addData,
  updateLocation,
  uploadImage,
  getLocations,
  getLocation,
  starsRate,
  updateDescription,
  deleteLocation,
} = require("../controllers/dataController");
const { makeAdmin } = require("../controllers/adminController");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");

router.post("/:params", addData);
router.put("/location", auth, admin, uploadImage, updateLocation);
router.patch("/make-admin/:id", auth, admin, makeAdmin);
router.get("/", getLocations);
router.post("/rate/", auth, starsRate);
router.get("/location/:id", getLocation);
router.delete("/location/:id", auth, admin, deleteLocation);
router.put("/description", auth, admin, updateDescription);

module.exports = router;
