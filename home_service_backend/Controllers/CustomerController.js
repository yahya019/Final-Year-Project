const CustomerRepository = require("../Repositories/CustomerRepository");

class CustomerController {

    registerCustomer = async (req, res) => {

        try {

            const { fullName, contactNumber, password } = req.body;

            if (!fullName)
                return res.status(400).json({ Status: "Fail", Result: "Full name required" });

            if (!contactNumber)
                return res.status(400).json({ Status: "Fail", Result: "Contact number required" });

            if (!password)
                return res.status(400).json({ Status: "Fail", Result: "Password required" });

            const result = await CustomerRepository.registerCustomer(req.body);

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


    signIn = async (req, res) => {

        try {

            const { contactNumber, password } = req.body;

            const result = await CustomerRepository.signIn(contactNumber, password);

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


    customerList = async (req, res) => {

        const result = await CustomerRepository.customerList();

        return res.json(result);

    };


    changePassword = async (req, res) => {

        const { _id, oldPassword, newPassword } = req.body;

        const result = await CustomerRepository.changePassword(_id, oldPassword, newPassword);

        return res.json(result);

    };

    forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        if (!email)
            return res.status(400).json({
                Status: "Fail",
                Result: "Email is required"
            });

        const result = await CustomerRepository.forgotPassword(email);

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

}

module.exports = new CustomerController();