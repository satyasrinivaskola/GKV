const express = require("express");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
dotenv.config();

const app = express();
const jwt=require("jsonwebtoken")






app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Your database connection goes here.

// Your API routes go here.

app.use(express.json());

// MySQL connection pool
const db = mysql.createPool({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }

});
const bcrypt = require("bcryptjs");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});


app.use("/uploads", express.static(uploadDir));

//photo upload API
app.post(
  "/api/my-profile/photos",
  authenticateToken,
  upload.array("photos", 3),
  async (req, res) => {
    try {
      const [profiles] = await db.execute(
        "SELECT id FROM profiles WHERE user_id = ?",
        [req.userId]
      );

      if (profiles.length === 0) {
        return res.status(404).json({
          message: "Create your profile before uploading photos"
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "Please select at least one photo"
        });
      }

      const profileId = profiles[0].id;

      // Remove old photo files and database records
      const [oldPhotos] = await db.execute(
        "SELECT photo_url FROM profile_photos WHERE profile_id = ?",
        [profileId]
      );

      for (const photo of oldPhotos) {
        const filename = path.basename(photo.photo_url);
        const oldPath = path.join(uploadDir, filename);

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await db.execute(
        "DELETE FROM profile_photos WHERE profile_id = ?",
        [profileId]
      );

      // Save new photo URLs in TiDB
      for (const file of req.files) {
        const photoUrl = `/uploads/${file.filename}`;

        await db.execute(
          `INSERT INTO profile_photos (profile_id, photo_url)
           VALUES (?, ?)`,
          [profileId, photoUrl]
        );
      }

      res.status(201).json({
        success: true,
        message: "Photos uploaded successfully",
        photos: req.files.map(
          (file) => `/uploads/${file.filename}`
        )
      });
    } catch (error) {
      console.error("Photo upload error:", error);

      res.status(500).json({
        message: "Failed to upload photos"
      });
    }
  }
);

//login

app.post("/api/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate required fields
    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required"
      });
    }

    // Validate mobile number
    const cleanMobile = String(mobile).trim();

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number"
      });
    }

    // Validate password
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid password"
      });
    }

    // Find user in TiDB
    const [users] = await db.execute(
      `SELECT id, mobile, password
       FROM users
       WHERE mobile = ?
       LIMIT 1`,
      [cleanMobile]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password"
      });
    }

    const user = users[0];

    // Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password"
      });
    }

    // Check JWT configuration
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Successful login
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        
        mobile: user.mobile
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error"
    });
  }
});
// User registration API
app.post("/api/register", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({
        message: "Name, mobile and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanEmail = email?.trim() || null;

    if (!cleanName || !cleanMobile) {
      return res.status(400).json({
        message: "Name and mobile cannot be empty"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.execute(
      `INSERT INTO users (name, email, mobile, password)
       VALUES (?, ?, ?, ?)`,
      [cleanName, cleanEmail, cleanMobile, hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful"
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This mobile number or email is already registered"
      });
    }

    res.status(500).json({
      message: "Registration failed. Please try again."
    });
  }
});


//authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Please log in first"
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token"
      });
    }

    req.userId = decoded.userId;
    next();
  });
}


//my-profile

app.post("/api/my-profile", authenticateToken, async (req, res) => {
  try {
    const {
      full_name,
      gender,
      date_of_birth,
      height,
      religion,
      caste,
      education,
      occupation,
      annual_income,
      city,
      about
    } = req.body;

    if (!full_name || !gender || !date_of_birth || !city) {
      return res.status(400).json({
        message: "Name, gender, date of birth and city are required"
      });
    }

    if (!["Bride", "Groom"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be Bride or Groom"
      });
    }

    const [users] = await db.execute(
      "SELECT mobile FROM users WHERE id = ?",
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const [existing] = await db.execute(
      "SELECT id FROM profiles WHERE user_id = ?",
      [req.userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "You have already created a profile"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO profiles (
        user_id, full_name, gender, date_of_birth, phone,
        height, religion, caste, education, occupation,
        annual_income, city, about, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        req.userId,
        full_name.trim(),
        gender,
        date_of_birth,
        users[0].mobile,
        height || null,
        religion || null,
        caste || null,
        education || null,
        occupation || null,
        annual_income || null,
        city.trim(),
        about || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      profileId: result.insertId
    });

  } catch (error) {
    console.error("Create profile error:", error);

    res.status(500).json({
      message: "Failed to create profile"
    });
  }
});

//PROFILE FETCH
// Get all published profiles except the logged-in user
app.get("/api/profiles", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        p.id,
        p.user_id,
        p.full_name,
        p.gender,
        p.date_of_birth,
        p.height,
        p.religion,
        p.caste,
        p.education,
        p.occupation,
        p.annual_income,
        p.city,
        p.about,
        p.created_at,
        pp.photo_url
      FROM profiles p
      LEFT JOIN profile_photos pp
        ON p.id = pp.profile_id
      WHERE p.published = 1
        AND p.user_id != ?
      ORDER BY p.created_at DESC`,
      [req.userId]
    );

    const profiles = {};

    for (const row of rows) {
      if (!profiles[row.id]) {
        profiles[row.id] = {
          id: row.id,
          full_name: row.full_name,
          gender: row.gender,
          date_of_birth: row.date_of_birth,
          height: row.height,
          religion: row.religion,
          caste: row.caste,
          education: row.education,
          occupation: row.occupation,
          annual_income: row.annual_income,
          city: row.city,
          about: row.about,
          created_at: row.created_at,
          photos: []
        };
      }

      if (row.photo_url) {
        profiles[row.id].photos.push(row.photo_url);
      }
    }

    res.json({
      success: true,
      profiles: Object.values(profiles)
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    res.status(500).json({
      message: "Failed to fetch profiles"
    });
  }
});

app.get("/api/profiles/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        p.id, p.user_id, p.full_name, p.gender,
        p.date_of_birth, p.height, p.religion, p.caste,
        p.education, p.occupation, p.annual_income,
        p.city, p.about, pp.photo_url
      FROM profiles p
      LEFT JOIN profile_photos pp
        ON p.id = pp.profile_id
      WHERE p.id = ? AND p.published = 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Profile not found"
      });
    }

    const profile = {
      id: rows[0].id,
      full_name: rows[0].full_name,
      gender: rows[0].gender,
      date_of_birth: rows[0].date_of_birth,
      height: rows[0].height,
      religion: rows[0].religion,
      caste: rows[0].caste,
      education: rows[0].education,
      occupation: rows[0].occupation,
      annual_income: rows[0].annual_income,
      city: rows[0].city,
      about: rows[0].about,
      photos: rows
        .filter(row => row.photo_url)
        .map(row => row.photo_url)
    };

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Profile details error:", error);
    res.status(500).json({
      message: "Failed to fetch profile"
    });
  }
});

//
app.get("/api/profiles/:id/contact", authenticateToken, async (req, res) => {
  try {
    const profileId = req.params.id;
const userId = req.userId;
    // Check whether payment is successful
    const [payments] = await db.execute(
      `SELECT id
       FROM payments
       WHERE user_id = ?
         AND profile_id = ?
         AND status = 'paid'
       LIMIT 1`,
      [userId, profileId]
    );

    if (payments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Payment required to view contact details",
      });
    }

    // Fetch candidate phone number
    const [profiles] = await db.execute(
      "SELECT phone FROM profiles WHERE id = ?",
      [profileId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      phone: profiles[0].phone,
    });
  } catch (error) {
    console.error("Check contact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check contact",
    });
  }
});

//payment module
app.post(
  "/api/payments/create-order",
  authenticateToken,
  async (req, res) => {
    try {
      const { profile_id } = req.body;
       const userId = req.userId;

      if (!profile_id) {
        return res.status(400).json({
          success: false,
          message: "Profile ID is required",
        });
      }

      if (Number(profile_id) === Number(userId)) {
        return res.status(400).json({
          success: false,
          message: "You cannot pay to view your own contact",
        });
      }

      const [profiles] = await db.execute(
        "SELECT id FROM profiles WHERE id = ? AND published = 1",
        [profile_id]
      );

      if (profiles.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      const [existingPayments] = await db.execute(
        `SELECT id FROM payments
         WHERE user_id = ? AND profile_id = ? AND status = 'paid'
         LIMIT 1`,
        [userId, profile_id]
      );

      if (existingPayments.length > 0) {
        return res.json({
          success: true,
          alreadyPaid: true,
        });
      }

      const order = await razorpay.orders.create({
        amount: 50000,
        currency: "INR",
        receipt: `contact_${userId}_${profile_id}_${Date.now()}`,
      });

      await db.execute(
        `INSERT INTO payments
         (user_id, profile_id, amount, payment_id, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [userId, profile_id, 500, order.id]
      );

      res.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Create payment order error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to create payment order",
      });
    }
  }
);

//tset razorpay
app.post(
  "/api/payments/verify",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

const userId = req.userId;
      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          success: false,
          message: "Missing payment details",
        });
      }

      // Find the pending order for this user
      const [payments] = await db.execute(
        `SELECT id, profile_id
         FROM payments
         WHERE payment_id = ?
           AND user_id = ?
           AND status = 'pending'
         LIMIT 1`,
        [razorpay_order_id, userId]
      );

      if (payments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pending payment not found",
        });
      }

      // Verify Razorpay signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const signatureBuffer = Buffer.from(
        generatedSignature,
        "hex"
      );
      const receivedBuffer = Buffer.from(
        razorpay_signature,
        "hex"
      );

      if (
        signatureBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, receivedBuffer)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      // Confirm payment status with Razorpay
      const payment = await razorpay.payments.fetch(
        razorpay_payment_id
      );

      if (
        payment.order_id !== razorpay_order_id ||
        payment.status !== "captured" ||
        payment.amount !== 50000 ||
        payment.currency !== "INR"
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment is not captured or details do not match",
        });
      }

      // Mark payment as paid
      await db.execute(
        `UPDATE payments
         SET status = 'paid', payment_id = ?
         WHERE id = ? AND user_id = ?`,
        [razorpay_payment_id, payments[0].id, userId]
      );

      res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  }
);
// Start server
const PORT = process.env.DB_PORT ;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});