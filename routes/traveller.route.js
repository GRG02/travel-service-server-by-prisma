//ใช้ในการจัดการเส้นทางในการเรียกใช้งาน service/api
//ใช้ในการจัดการเส้นทางในการเรียกใช้งาน service/api

const travellerCtrl = require("../controllers/traveller.controller.js");

//เรียกใช้งาน express เพื่อใช้งาน Router() ในการจัดการเส้นทางเพื่อการเรียนใช้งาน
const express = require("express");
const router = express.Router();

//ในการกำหนดเส้นทางเป็นตามหลักการของ REST API

router.post("/", travellerCtrl.uploadTraveller, travellerCtrl.createTraveller);
router.get(
  "/:travellerEmail/:travellerPassword",
  travellerCtrl.checkLoginTraveller
);
router.put(
  "/:travellerId",
  travellerCtrl.uploadTraveller,
  travellerCtrl.editTraveller
);

//export router ออกไปเพื่อการเรียกใช้งาน
module.exports = router;
