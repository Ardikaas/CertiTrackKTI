const mongoose = require("mongoose");
const Sertifikasi = require("./models/Sertifikasi");
require("dotenv").config();

const seedData = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI not set in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Clear existing data
    await Sertifikasi.deleteMany();
    console.log("🗑️  Cleared existing data");

    // Sample data
    const sampleSertifikasi = [
      {
        namaSertifikasi: "Kalibrasi Pressure Gauge A-101",
        jenisSertifikasi: "Kalibrasi",
        nomorSertifikat: "KAL-2024-001",
        tanggalTerbit: new Date("2024-01-15"),
        tanggalExp: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      },
      {
        namaSertifikasi: "Sertifikat Lifting Equipment Crane",
        jenisSertifikasi: "K3",
        nomorSertifikat: "SLE-2024-012",
        tanggalTerbit: new Date("2024-02-01"),
        tanggalExp: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now (expiring soon)
      },
      {
        namaSertifikasi: "Inspeksi Crane Overhead",
        jenisSertifikasi: "Inspeksi",
        nomorSertifikat: "ICO-2023-089",
        tanggalTerbit: new Date("2023-06-01"),
        tanggalExp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (expired)
      },
      {
        namaSertifikasi: "Sertifikasi Instalasi Listrik",
        jenisSertifikasi: "Sertifikasi Instalasi Listrik",
        nomorSertifikat: "SIL-2024-045",
        tanggalTerbit: new Date("2024-03-01"),
        tanggalExp: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now (active)
      },
      {
        namaSertifikasi: "Pesawat Angkat Forklift",
        jenisSertifikasi: "Sertifikasi Pesawat Angkat Angkut",
        nomorSertifikat: "SPA-2024-023",
        tanggalTerbit: new Date("2024-01-20"),
        tanggalExp: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now (expiring soon)
      },
    ];

    await Sertifikasi.insertMany(sampleSertifikasi);
    console.log(`✅ Seeded ${sampleSertifikasi.length} sertifikasi`);

    // Show the data with computed fields
    const allData = await Sertifikasi.find();
    console.log("\n📊 Sample data with computed fields:");
    allData.forEach((s) => {
      console.log(`  - ${s.namaSertifikasi}: ${s.status} (${s.sisaHari} hari)`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
};

seedData();
