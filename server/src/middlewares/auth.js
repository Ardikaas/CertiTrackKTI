const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Anda belum login. Silakan login terlebih dahulu.", 401));
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "certitrack_secret_key_2024";

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    return next(new AppError("Token tidak valid atau sudah kadaluarsa. Silakan login ulang.", 401));
  }
};

module.exports = { protect };
