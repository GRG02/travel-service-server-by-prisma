//ไฟล์ที่เขียนควบคุมการทำงานต่างๆกับ table ใน db
//เช่น การเพิ่ม (insert/create) การแก้ไข (update)
//การลบ (delete) การค้นหา,ตรวจสอบ,ดึง,ดู (select/send)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

//ใช้งาน Cloudinary
const {v2: Cloudinary} = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Configuration
Cloudinary.config({ 
  cloud_name: 'dkxrud2wz', 
  api_key: '832218823297127', 
  api_secret: 'HATVq2UjviXjEt2GUjosJv6XvBY' // Click 'View API Keys' above to copy your API secret
});

// //ฟังก์ชันเพื่อการอัปโหลดไฟล์
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images/traveller/");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       "traveller" +
//         Math.floor(Math.random() * Date.now()) +
//         path.extname(file.originalname)
//     );
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary: Cloudinary,
  params: async(req, file)=>{
    //ชื่อไฟล์
    const newFile = 'traveller_' + Math.floor(Math.random()* Date.now());

    return {
      folder: 'images/traveller',
      allowed_formats: ['jpg','png','jpeg'],
      public_id: newFile
    }
  }
})

exports.uploadTraveller = multer({
  storage: storage,
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname));
    if (mimetype && extname) {
      return cb(null, true);
    }
  },
}).single("travellerImage");
//------------------------------------------------------

//ฟังก์ชันเพิ่มเติมข้อมูลลงในตาราง travel_tb
exports.createTraveller = async (req, res) => {
  try {
    // ตรวจสอบว่าข้อมูลที่จำเป็นมีครบถ้วนหรือไม่
    const { travellerFullname, travellerEmail, travellerPassword } = req.body;
    if (!travellerFullname || !travellerEmail || !travellerPassword) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    // สร้างข้อมูลในฐานข้อมูล
    const result = await prisma.traveller_tb.create({
      data: {
        travellerFullname: travellerFullname,
        travellerEmail: travellerEmail,
        travellerPassword: travellerPassword, // เก็บรหัสผ่านเป็น plain text
        travellerImage: req.file
          ? req.file.path.replace("images\\traveller\\", "")
          : "",
      },
    });

    // ส่งคำตอบกลับ
    res.status(201).json({
      message: "Traveller created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//ฟังก์ชันตรวจสอบการเข้าใช้งานของผู้ใช้กับตาราง traveller_tb
exports.checkLoginTraveller = async (req, res) => {
  try {
    const result = await prisma.traveller_tb.findFirst({
      where: {
        travellerEmail: req.params.travellerEmail,
        travellerPassword: req.params.travellerPassword,
      },
    });

    //---
    if (result) {
      res.status(200).json({
        message: "Traveller updated successfully",
        data: result,
      });
    } else {
      res.status(404).json({
        message: "Traveller login failed",
        data: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//ฟังก์ชันแก้ไขข้อมูลของ user ในตาราง traveller_tb
exports.editTraveller = async (req, res) => {
  try {
    let result = {}; // ใช้ตัวแปร result สำหรับเก็บผลลัพธ์จากการอัปเดต

    // ดึงข้อมูล Traveller ตาม ID
    const traveller = await prisma.traveller_tb.findFirst({
      where: {
        travellerId: parseInt(req.params.travellerId),
      },
    });

    if (!traveller) {
      return res.status(404).json({ message: "Traveller not found." });
    }

    // ถ้ามีการอัปโหลดรูปใหม่ จะลบรูปเก่าออก
    if (traveller.travellerImage && req.file) {
      // ลบรูปเก่า
      fs.unlink(
        path.join("images/traveller", traveller.travellerImage),
        (err) => {
          if (err) {
            console.error("Error deleting old image:", err);
          }
        }
      );
    }

    // // ดึงค่าจาก req.body
    // const { travellerFullname, travellerEmail, travellerPassword } = req.body;

    // // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    // if (!travellerFullname || !travellerEmail || !travellerPassword) {
    //   return res.status(400).json({ message: "Missing required fields." });
    // }

    // ถ้ามีการอัปโหลดรูปใหม่
    if (req.file) {
      result = await prisma.traveller_tb.update({
        where: {
          travellerId: parseInt(req.params.travellerId),
        },
        data: {
          travellerFullname: req.body.travellerFullname,
          travellerEmail: req.body.travellerEmail,
          travellerPassword: req.body.travellerPassword, // เก็บรหัสผ่านเป็น plain text
          travellerImage: req.file.path.replace("images\\traveller\\", ""),
        },
      });
    } else {
      // ถ้าไม่มีการอัปโหลดรูปใหม่
      result = await prisma.traveller_tb.update({
        where: {
          travellerId: parseInt(req.params.travellerId),
        },
        data: {
          travellerFullname: req.body.travellerFullname,
          travellerEmail: req.body.travellerEmail,
          travellerPassword: req.body.travellerPassword, // เก็บรหัสผ่านเป็น plain text
        },
      });
    }

    // ส่งคำตอบกลับหลังจากการอัปเดตข้อมูล
    res.status(200).json({
      message: "Traveller updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
