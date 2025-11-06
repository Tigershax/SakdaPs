// ==================== Import Libraries ====================
// นำเข้าไลบรารีที่จำเป็น เหมือนการเอาเครื่องมือมาใช้งาน
import express from "express";  // ใช้สร้าง Web Server รับ-ส่งข้อมูล
import cors from "cors";  // อนุญาตให้ Frontend เรียกใช้ API ได้
import admin from "firebase-admin";  // เชื่อมต่อกับ Firebase (ฐานข้อมูล)
import serviceAccount from "./firebase/final-cf0d7-firebase-adminsdk-fbsvc-0fa1e2f3d6.json" with { type: "json" };  // ไฟล์คีย์เชื่อมต่อ Firebase

// ==================== Initialize Firebase ====================
// ตั้งค่าเชื่อมต่อกับ Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),  // ใช้ไฟล์คีย์ยืนยันตัวตน
});

const db = admin.firestore();  // เข้าถึง Firestore Database
const motorcycles = db.collection("motorcycle");  // กำหนดว่าจะเก็บข้อมูลในตาราง "motorcycle"

// ==================== Initialize Express ====================
// สร้าง Web Server
const app = express();  // สร้างแอปพลิเคชัน Express
const port = 3001;  // กำหนดพอร์ต (ที่อยู่) ของ Server คือ 3001

app.use(cors());  // เปิดให้เว็บอื่นเรียกใช้ API ได้
app.use(express.json());  // อ่านข้อมูลที่ส่งมาเป็น JSON ได้

// ==================== API ROUTES ====================

// 🟢 GET: ดึงข้อมูลทั้งหมด
// เมื่อมีคนเข้า http://localhost:3001/api/motorcycles
app.get("/api/motorcycles", async (req, res) => {
  try {
    const snapshot = await motorcycles.get();  // ดึงข้อมูลทั้งหมดจาก Firebase
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));  // แปลงเป็น Array พร้อม id
    res.json(data);  // ส่งข้อมูลกลับไปให้ Frontend
  } catch (err) {
    res.status(500).json({ error: err.message });  // ถ้าเกิดข้อผิดพลาด ส่ง error กลับไป
  }
});

// 🟢 POST: เพิ่มข้อมูลใหม่
// เมื่อส่งข้อมูลมาเพื่อเพิ่มรายการใหม่
app.post("/api/motorcycles", async (req, res) => {
  try {
    const data = req.body;  // รับข้อมูลที่ส่งมา
    
    // ตรวจสอบว่าส่งข้อมูลครบไหม (ชื่อ, ยี่ห้อ, ราคา, รูปภาพ)
    if (!data.motorcycleName || !data.motorcycleBrand || data.motorcyclePrice === undefined || !data.motorcycleImage) {
      return res.status(400).json({ error: "Missing required fields" });  // ถ้าไม่ครบ แจ้ง error
    }

    const docRef = await motorcycles.add(data);  // เพิ่มข้อมูลลง Firebase
    res.status(201).json({ id: docRef.id, ...data });  // ส่ง id ที่สร้างใหม่กลับไป
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 PUT: แก้ไขข้อมูล
// เมื่อต้องการแก้ไขข้อมูลที่มีอยู่แล้ว
app.put("/api/motorcycles/:id", async (req, res) => {
  try {
    const id = req.params.id;  // เอา id จาก URL เช่น /api/motorcycles/abc123
    const data = req.body;  // รับข้อมูลใหม่ที่จะแก้ไข
    await motorcycles.doc(id).update(data);  // อัปเดตข้อมูลใน Firebase
    res.json({ id, ...data });  // ส่งข้อมูลที่แก้ไขแล้วกลับไป
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 DELETE: ลบข้อมูล
// เมื่อต้องการลบรายการ
app.delete("/api/motorcycles/:id", async (req, res) => {
  try {
    const id = req.params.id;  // เอา id จาก URL
    await motorcycles.doc(id).delete();  // ลบข้อมูลออกจาก Firebase
    res.json({ message: "Deleted successfully", id });  // ส่งข้อความยืนยันกลับไป
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Start Server ====================
// เริ่มต้น Server ให้ทำงาน
app.listen(port, () => console.log(`🏍️ Motorcycle API running at http://localhost:${port}`));