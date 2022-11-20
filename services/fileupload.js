const aws = require("aws-sdk");
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3 = new S3Client();
aws.config.update({
  region: "ap-south-1",
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype === "image/png" ||file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only PDF,Jpeg and PNG is allowed!"), false);
  }
};

const upload = multer({
  fileFilter,
  storage: multerS3({
    acl: "public-read",
    s3,
    bucket: "edubase",
    metadata: function (req, file, cb) {
      cb(null, { fieldName: "TESTING_METADATA" });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + "_" + file.originalname);
    },
  }),
});

module.exports = upload;
