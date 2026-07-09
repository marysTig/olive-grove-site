import bcrypt from "bcryptjs";
const password = "Admin@123456";
const hash = "$2a$12$n0A8h5K1TdS0z7bcErg10uGFCnfIHjSVBMDvjd1Qp02g1Ks02xC/q";
const isMatch = bcrypt.compareSync(password, hash);
console.log("Is Match:", isMatch);
