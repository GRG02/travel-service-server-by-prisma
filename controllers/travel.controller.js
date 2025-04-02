//ไฟล์ที่เขียนควบคุมการทำงานต่างๆกับ table ใน db
//เช่น การเพิ่ม (insert/create) การแก้ไข (update)
//การลบ (delete) การค้นหา,ตรวจสอบ,ดึง,ดู (select/send)

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {v2: Cloudinary} = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

Cloudinary.config({ 
  cloud_name: 'dkxrud2wz', 
  api_key: '832218823297127', 
  api_secret: 'HATVq2UjviXjEt2GUjosJv6XvBY' // Click 'View API Keys' above to copy your API secret
});

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images/travel");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       "travel_" +
//       Math.floor(Math.random() * Date.now()) +
//       path.extname(file.originalname)
//     );
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary: Cloudinary,
  params: async(req, file)=>{
    //ชื่อไฟล์
    const newFile = 'travel_' + Math.floor(Math.random()* Date.now());

    return {
      folder: 'images/travel',
      allowed_formats: ['jpg','png','jpeg'],
      public_id: newFile
    }
  }
})

exports.uploadTravel = multer({
  storage: storage,
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname));
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Images Only");
  },
}).single("travelImage");

exports.createTravel = async (req, res) => {
  try {
    // ตรวจสอบว่ามีการอัปโหลดรูปหรือไม่
    const travelImage = req.file ? req.file.filename : null;

    // สร้างข้อมูลในฐานข้อมูล
    const result = await prisma.travel_tb.create({
      data: {
        travelPlace: req.body.travelPlace,
        travelStartDate: req.body.travelStartDate,
        travelEndDate: req.body.travelEndDate,
        travelCostTotal: parseFloat(req.body.travelCostTotal),
        travellerId: parseInt(req.body.travellerId),
        travelImage, // ใช้ชื่อไฟล์แทน `req.file.path`
      },
    });

    res.status(201).json({
      message: "Travel created successfully",
      data: result,
    });
  } catch (error) {
    console.error("🔥 Error creating travel:", error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};


exports.editTravel = async (req, res) => {
  try {
    let result = {}; 

    // ดึงข้อมูล Travel ตาม ID
    const travel = await prisma.travel_tb.findFirst({
      where: { travelId: parseInt(req.params.travelId) },
    });

    if (!travel) {
      return res.status(404).json({ message: "Travel not found." });
    }

    // ตรวจสอบและลบรูปภาพเก่า (ถ้ามีและไฟล์ยังอยู่)
    if (travel.travelImage && req.file) {
      const oldImagePath = path.join("images/travel", travel.travelImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("❌ Error deleting old image:", err);
          } else {
            console.log("✅ Old image deleted successfully");
          }
        });
      }
    }

    // แปลงค่าตัวเลข
    const travelCostTotal = parseFloat(req.body.travelCostTotal);
    const travellerId = parseInt(req.body.travellerId);

    // ตรวจสอบว่ามีการอัปโหลดไฟล์ใหม่หรือไม่
    const newImage = req.file ? req.file.filename : travel.travelImage;

    result = await prisma.travel_tb.update({
      where: { travelId: parseInt(req.params.travelId) },
      data: {
        travelPlace: req.body.travelPlace,
        travelStartDate: req.body.travelStartDate,
        travelEndDate: req.body.travelEndDate,
        travelCostTotal: isNaN(travelCostTotal) ? 0 : travelCostTotal,
        travellerId: isNaN(travellerId) ? null : travellerId,
        travelImage: newImage, // อัปเดตไฟล์รูปใหม่
      },
    });

    res.status(200).json({ message: "Travel updated successfully", data: result });
  } catch (error) {
    console.error("🔥 Update failed:", error);
    res.status(500).json({ message: error.message });
  }
};


//ดึงข้อมูลทั้งหมด
exports.getAllTravel = async (req, res) => {
  try {
    // ดึงข้อมูลการเดินทางทั้งหมดที่เกี่ยวข้องกับ travellerId
    const result = await prisma.travel_tb.findMany({
      where: {
        travellerId: parseInt(req.params.travellerId), // ใช้ travellerId ในพารามิเตอร์ URL
      },
    });

    if (result && result.length > 0) {
      res.status(200).json({
        message: "Travel data fetched successfully",
        data: result,
      });
    } else {
      res.status(404).json({
        message: "No travel data found for the given travellerId",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching travel data: ", error);
    res.status(500).json({
      message: "Error: " + error.message,
    });
  }
};

//---------------------------------------------------------

//ฟังก์ชันแก้ไขข้อมูลของ user ในตาราง travel_tb
exports.deleteTravel = async (req, res) => {
  try {
    const result = await prisma.travel_tb.delete({
      where: {
        travelId: parseInt(req.parem.travelId),
      },
    });
    //---
    res.status(200).json({
      message: "Travel delete successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getTravel = async (req, res) => {
  try {
    const travelId = parseInt(req.params.travelId);

    const travel = await prisma.travel_tb.findUnique({
      where: { travelId: travelId },
    });

    if (travel) {
      res.status(200).json({
        message: "Travel data fetched successfully",
        data: travel,
      });
    } else {
      res.status(404).json({
        message: "Travel not found",
        data: null,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
