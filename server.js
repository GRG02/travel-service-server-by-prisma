const express = require("express"); //เรียกใช้งาน express module เพื่อสร้าง web server
const cors = require("cors");
const travellerRoute = require("./routes/traveller.route");
const travelRoute = require("./routes/travel.route");

require("dotenv").config(); //เรียกใช้งาน dotenv

const app = express(); //สร้าง web server

const PORT = process.env.PORT || 5000;

app.use(cors()); //จัดการเรื่องการเรียกใช้งานข้ามโดเมน
app.use(express.json()); //จัดการข้อมูลในรูปแบบ json
app.use("/traveller", travellerRoute);
app.use("/travel", travelRoute);
//กำหนดการเข้าถึง path ที่เก็บรูป
app.use('/images/traveller', express.static('images/traveller'));
app.use('/images/travel', express.static('images/travel'));

//test การเรียกใช้งาน web server จาก client/user
app.get("/", (req, res) => {
  res.json({ message: "Hello from server" });
});

//สร้างช่องทางในการติดต่อ web server นี้จาก client/user
app.listen(PORT, () => {
  console.log("Server running on port " + PORT + " ...");
});
