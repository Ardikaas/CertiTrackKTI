const mongoose = require("mongoose");

const sertifikasiSchema = new mongoose.Schema(
  {
    namaSertifikasi: {
      type: String,
      required: [true, "Nama sertifikasi wajib diisi"],
      trim: true,
    },
    jenisSertifikasi: {
      type: String,
      required: [true, "Jenis sertifikasi wajib diisi"],
      trim: true,
    },
    nomorSertifikat: {
      type: String,
      required: [true, "Nomor sertifikat wajib diisi"],
      trim: true,
      unique: true,
    },
    tanggalTerbit: {
      type: Date,
      required: [true, "Tanggal terbit wajib diisi"],
    },
    tanggalExp: {
      type: Date,
      required: [true, "Tanggal expired wajib diisi"],
    },
    fotoEquipment: {
      type: String,
      default: null,
    },
    dokumenSertifikat: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual: hitung sisa hari sebelum expired
sertifikasiSchema.virtual("sisaHari").get(function () {
  const now = new Date();
  const diff = this.tanggalExp - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: status berdasarkan tanggal
sertifikasiSchema.virtual("status").get(function () {
  const sisa = this.sisaHari;
  if (sisa <= 0) return "expired";
  if (sisa <= 30) return "expiring_soon";
  return "active";
});

// Include virtuals in JSON/Object output
sertifikasiSchema.set("toJSON", { virtuals: true });
sertifikasiSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Sertifikasi", sertifikasiSchema);
