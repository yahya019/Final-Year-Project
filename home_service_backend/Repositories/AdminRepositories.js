const { ObjectId } = require("bson");
const { createAccountTemplate, sendMail, forgotPasswordTemplate } = require("../Services/SendMail");
const { getCollection } = require("./dbConfig");
const bcrypt = require("bcrypt");

class AdminRepositories {

    generatePassword = (length = 8) => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    saveAdmin = async (model) => {
        try {
            const collection = await getCollection("Admin");

            // 🔍 Check Email Exist
            const emailExist = await collection.findOne({ Email: model.Email });
            if (emailExist) {
                return {
                    Status: "Conflict",
                    Result: "Email already exists"
                };
            }

            // 🔍 Check ContactNo Exist
            const contactExist = await collection.findOne({ ContactNo: model.ContactNo });
            if (contactExist) {
                return {
                    Status: "Conflict",
                    Result: "Contact number already exists"
                };
            }

            // 🔐 Generate & Hash Password
            const plainPassword = this.generatePassword(8);
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const data = {
                Name: model.Name,
                Email: model.Email,
                ContactNo: model.ContactNo,
                Role: model.Role,
                Password: hashedPassword,
                Status: model.Status,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.insertOne(data);

            if (result.acknowledged) {

                const template = createAccountTemplate(
                    model.Name,
                    model.Email,
                    plainPassword,
                    model.Email
                );

                await sendMail(model.Email, "Welcome to FixIt", template);

                return {
                    Status: "OK",
                    Result: "Successfully Saved"
                };
            }

            return {
                Status: "Fail",
                Result: "Something went wrong while saving admin"
            };

        } catch (error) {
            return {
                Status: "Fail",
                Result: "Error saving admin: " + error.message
            };
        }
    };

    /* ================= SIGN IN ================= */
    signIn = async (Email, Password) => {
        try {
            const collection = await getCollection("Admin");

            const admin = await collection.findOne({ Email: Email });

            if (!admin)
                return { Status: "Fail", Result: "Invalid Email" };

            if (admin.Status !== "Active")
                return { Status: "Fail", Result: "Account is Inactive" };

            const isMatch = await bcrypt.compare(Password, admin.Password);

            if (!isMatch)
                return { Status: "Fail", Result: "Invalid Password" };

            const jwt = require('jsonwebtoken');

            const token = jwt.sign(
                { _id: admin._id, Role: admin.Role },
                process.env.JWT_SECRET || 'fixit_secret_key_change_in_production',
                { expiresIn: '7d' }
            );

            return {
                Status: "OK",
                Token: token,           // ← ADD THIS
                Result: {
                    Name: admin.Name,
                    Email: admin.Email,
                    ContactNo: admin.ContactNo,
                    Role: admin.Role,
                    _id: admin._id
                }
            };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= CHANGE PASSWORD ================= */
    changePassword = async (_id, oldPassword, newPassword) => {
        try {
            const collection = await getCollection("Admin");

            const admin = await collection.findOne({ _id: new ObjectId(_id) });
            if (!admin)
                return { Status: "Fail", Result: "Admin not found" };

            const isMatch = await bcrypt.compare(oldPassword, admin.Password);
            if (!isMatch)
                return { Status: "Fail", Result: "Old password incorrect" };

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                { $set: { Password: hashedPassword, updatedAt: new Date() } }
            );

            return { Status: "OK", Result: "Password Updated Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= CHANGE PROFILE ================= */
    changeProfile = async (_id, model) => {
        try {
            const collection = await getCollection("Admin");

            // Check if admin exists
            const existingAdmin = await collection.findOne({ _id: new ObjectId(_id) });
            if (!existingAdmin) {
                return { Status: "Fail", Result: "Admin not found" };
            }

            // 🔍 Check duplicate Email (excluding current admin)
            const emailExist = await collection.findOne({
                Email: model.Email,
                _id: { $ne: new ObjectId(_id) }
            });

            if (emailExist) {
                return { Status: "Conflict", Result: "Email already exists" };
            }

            // 🔍 Check duplicate ContactNo (excluding current admin)
            const contactExist = await collection.findOne({
                ContactNo: model.ContactNo,
                _id: { $ne: new ObjectId(_id) }
            });

            if (contactExist) {
                return { Status: "Conflict", Result: "Contact number already exists" };
            }

            // ✅ Update Profile
            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        Name: model.Name,
                        Email: model.Email,
                        ContactNo: model.ContactNo,
                        updatedAt: new Date()
                    }
                }
            );

            return { Status: "OK", Result: "Profile Updated Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= FORGOT PASSWORD ================= */
    forgotPassword = async (Email) => {
        try {
            const collection = await getCollection("Admin");

            const admin = await collection.findOne({ Email: Email });
            if (!admin)
                return { Status: "Fail", Result: "Email not registered" };

            const newPassword = this.generatePassword(8);
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await collection.updateOne(
                { Email: Email },
                { $set: { Password: hashedPassword, updatedAt: new Date() } }
            );

            // Send new password via mail
            const template = forgotPasswordTemplate(admin.Name, newPassword, admin.Email);
            await sendMail(admin.Email, "Reset Password - FixIt", template);

            return { Status: "OK", Result: "New password sent to email" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= ADMIN LIST ================= */
    adminList = async () => {
        try {
            const collection = await getCollection("Admin");

            const admins = await collection.find({}, { projection: { Password: 0 } }).toArray();

            return { Status: "OK", Result: admins };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };

    /* ================= CHANGE STATUS ================= */
    changeStatus = async (Id, status) => {
        try {
            const collection = await getCollection("Admin");

            await collection.updateOne(
                { _id: new ObjectId(Id) },
                { $set: { Status: status, updatedAt: new Date() } }
            );

            return { Status: "OK", Result: "Status Updated Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };
}

module.exports = new AdminRepositories();