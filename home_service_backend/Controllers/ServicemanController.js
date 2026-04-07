const ServicemanRepository = require("./../Repositories/ServicemanRepository");

class ServicemanController {

    /* ================= REGISTER SERVICEMAN ================= */

    registerServiceman = async (req, res) => {
        try {

            const {
                fullName,
                address,
                contactNumber,
                email,
                password,
                aadhaarNumber,
                bankAccountHolderName,
                bankName,
                accountNumber,
                ifscCode,
                city
            } = req.body;


            if (!fullName)
                return res.status(400).json({ Status: "Fail", Result: "Full name is required" });


            if (!address)
                return res.status(400).json({ Status: "Fail", Result: "Address is required" });


            if (!contactNumber)
                return res.status(400).json({ Status: "Fail", Result: "Contact number is required" });


            if (!/^[0-9]{10}$/.test(contactNumber))
                return res.status(400).json({ Status: "Fail", Result: "Contact number must be 10 digits" });


            if (!email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });


            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email))
                return res.status(400).json({ Status: "Fail", Result: "Invalid email format" });


            if (!password)
                return res.status(400).json({ Status: "Fail", Result: "Password is required" });


            if (password.length < 6)
                return res.status(400).json({ Status: "Fail", Result: "Password must be at least 6 characters" });


            if (!aadhaarNumber)
                return res.status(400).json({ Status: "Fail", Result: "Aadhaar number is required" });


            if (!/^[0-9]{12}$/.test(aadhaarNumber))
                return res.status(400).json({ Status: "Fail", Result: "Aadhaar number must be 12 digits" });


            if (!bankAccountHolderName)
                return res.status(400).json({ Status: "Fail", Result: "Account holder name is required" });


            if (!bankName)
                return res.status(400).json({ Status: "Fail", Result: "Bank name is required" });


            if (!accountNumber)
                return res.status(400).json({ Status: "Fail", Result: "Account number is required" });


            if (!ifscCode)
                return res.status(400).json({ Status: "Fail", Result: "IFSC code is required" });


            if (!city)
                return res.status(400).json({ Status: "Fail", Result: "City is required" });


            const result = await ServicemanRepository.registerServiceman(req.body);


            if (result.Status === "OK")
                return res.status(200).json(result);


            if (result.Status === "Conflict")
                return res.status(409).json(result);


            return res.status(400).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }
    };


    /* ================= SERVICEMAN LOGIN ================= */

    signIn = async (req, res) => {

        try {

            const { email, password } = req.body;

            if (!email)
                return res.status(400).json({ Status: "Fail", Result: "Email is required" });


            if (!password)
                return res.status(400).json({ Status: "Fail", Result: "Password is required" });


            const result = await ServicemanRepository.signIn(email, password);


            if (result.Status === "OK")
                return res.status(200).json(result);


            return res.status(401).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= SERVICEMAN LIST ================= */

    servicemanList = async (req, res) => {

        try {

            const result = await ServicemanRepository.servicemanList();


            if (result.Status === "OK")
                return res.status(200).json(result);


            return res.status(500).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

    forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email)
            return res.status(400).json({
                Status: "Fail",
                Result: "Email is required"
            });

        const result = await ServicemanRepository.forgotPassword(email);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    }
    catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

changePassword = async (req, res) => {

    try {

        const { _id, oldPassword, newPassword } = req.body;

        if (!_id)
            return res.status(400).json({ Status: "Fail", Result: "User Id required" });

        if (!oldPassword)
            return res.status(400).json({ Status: "Fail", Result: "Old password required" });

        if (!newPassword)
            return res.status(400).json({ Status: "Fail", Result: "New password required" });

        const result = await ServicemanRepository.changePassword(_id, oldPassword, newPassword);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    }
    catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

updateAccount = async (req, res) => {

    try {

        const { _id } = req.body;

        if (!_id)
            return res.status(400).json({
                Status: "Fail",
                Result: "Serviceman Id required"
            });

        const result = await ServicemanRepository.updateAccount(_id, req.body);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    }
    catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

updateLocation = async (req, res) => {

    try {

        const { _id, city, latitude, longitude } = req.body;

        if (!_id)
            return res.status(400).json({
                Status: "Fail",
                Result: "Serviceman Id required"
            });

        const result = await ServicemanRepository.updateLocation(_id, city, latitude, longitude);

        if (result.Status === "OK")
            return res.status(200).json(result);

        return res.status(400).json(result);

    }
    catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};


/* ================= SERVICEMAN BY CITY ================= */

servicemanByCity = async (req, res) => {

    try {

        const { city } = req.params;

        if (!city)
            return res.status(400).json({
                Status: "Fail",
                Result: "City required"
            });

        const result = await ServicemanRepository.servicemanByCity(city);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};


/* ================= SERVICEMAN BY ID ================= */

servicemanById = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await ServicemanRepository.servicemanById(id);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};


/* ================= CHANGE STATUS ================= */

changeStatus = async (req, res) => {

    try {

        const { id, status } = req.body;

        if (!id)
            return res.status(400).json({
                Status: "Fail",
                Result: "Serviceman Id required"
            });

        if (!status)
            return res.status(400).json({
                Status: "Fail",
                Result: "Status required"
            });

        const result = await ServicemanRepository.changeStatus(id, status);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });

    }

};

forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ Status: "Fail", Result: "Email is required" });
 
        const result = await ServicemanRepository.forgotPassword(email);
 
        if (result.Status === "OK")
            return res.status(200).json(result);
 
        return res.status(400).json(result);
 
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};
}

module.exports = new ServicemanController();