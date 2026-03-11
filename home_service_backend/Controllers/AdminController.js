const AdminRepositories = require("./../Repositories/AdminRepositories");

class AdminController {

    /* ================= SAVE ADMIN ================= */
    saveRequest = async (req, res) => {
        try {
            const { Name, Email, ContactNo, Role, Status } = req.body;

            if (!Name)
                return res.status(400).json({ Status: "Fail", Result: "Name is required" });

            if (!Email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(Email))
                return res.status(400).json({ Status: "Fail", Result: "Invalid email format" });

            if (!ContactNo)
                return res.status(400).json({ Status: "Fail", Result: "Contact number is required" });

            if (!/^[0-9]{10}$/.test(ContactNo))
                return res.status(400).json({ Status: "Fail", Result: "Contact number must be 10 digits" });

            if (!Role)
                return res.status(400).json({ Status: "Fail", Result: "Role is required" });

            if (!Status)
                return res.status(400).json({ Status: "Fail", Result: "Status is required" });

            const result = await AdminRepositories.saveAdmin(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(500).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= SIGN IN ================= */
    signIn = async (req, res) => {
        try {
            const { Email, Password } = req.body;

            if (!Email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });

            if (!Password)
                return res.status(400).json({ Status: "Fail", Result: "Password is required" });

            const result = await AdminRepositories.signIn(Email, Password);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(401).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= CHANGE PASSWORD ================= */
    changePassword = async (req, res) => {
        try {
            const { _id, oldPassword, newPassword } = req.body;

            if (!_id)
                return res.status(400).json({ Status: "Fail", Result: "User Id is required" });

            if (!oldPassword)
                return res.status(400).json({ Status: "Fail", Result: "Old password is required" });

            if (!newPassword)
                return res.status(400).json({ Status: "Fail", Result: "New password is required" });

            if (newPassword.length < 6)
                return res.status(400).json({ Status: "Fail", Result: "Password must be at least 6 characters" });

            const result = await AdminRepositories.changePassword(_id, oldPassword, newPassword);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= CHANGE PROFILE ================= */
    changeProfile = async (req, res) => {
        try {
            const { _id, Name, Email, ContactNo } = req.body;

            if (!_id)
                return res.status(400).json({ Status: "Fail", Result: "User Id is required" });

            if (!Name)
                return res.status(400).json({ Status: "Fail", Result: "Name is required" });

            if (!Email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email))
                return res.status(400).json({ Status: "Fail", Result: "Invalid email format" });

            if (!ContactNo)
                return res.status(400).json({ Status: "Fail", Result: "Contact number is required" });

            if (!/^[0-9]{10}$/.test(ContactNo))
                return res.status(400).json({ Status: "Fail", Result: "Contact number must be 10 digits" });

            const result = await AdminRepositories.changeProfile(_id, req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= FORGOT PASSWORD ================= */
    forgotPassword = async (req, res) => {
        try {
            const { Email } = req.body;

            if (!Email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Email))
                return res.status(400).json({ Status: "Fail", Result: "Invalid email format" });

            const result = await AdminRepositories.forgotPassword(Email);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= ADMIN LIST ================= */
    adminList = async (req, res) => {
        try {
            const result = await AdminRepositories.adminList();

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(500).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= CHANGE STATUS ================= */
    changeStatus = async (req, res) => {
        try {
            const { Id, Status } = req.body;

            if (!Id)
                return res.status(400).json({ Status: "Fail", Result: "Id is required" });

            if (!Status)
                return res.status(400).json({ Status: "Fail", Result: "Status is required" });

            const result = await AdminRepositories.changeStatus(Id, Status);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };

}

module.exports = new AdminController();