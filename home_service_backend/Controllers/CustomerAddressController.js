const CustomerAddressRepository = require("./../Repositories/CustomerAddressRepository");
const { ObjectId } = require("mongodb");

class CustomerAddressController {

    /* ================= CREATE ADDRESS ================= */

    createAddress = async (req, res) => {

        try {

            const { customerId, addressLine, city } = req.body;

            if (!customerId)
                return res.status(400).json({ Status: "Fail", Result: "Customer Id required" });

            if (!addressLine)
                return res.status(400).json({ Status: "Fail", Result: "Address required" });

            if (!city)
                return res.status(400).json({ Status: "Fail", Result: "City required" });

            const result = await CustomerAddressRepository.createAddress(req.body);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= ADDRESS LIST ================= */

    addressList = async (req, res) => {

        try {

            const { customerId } = req.params;

            if (!ObjectId.isValid(customerId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Customer Id" });

            const result = await CustomerAddressRepository.addressList(customerId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= UPDATE ADDRESS ================= */

    updateAddress = async (req, res) => {

        try {

            const { id } = req.body;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Address Id required" });

            const result = await CustomerAddressRepository.updateAddress(id, req.body);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= SET DEFAULT ================= */

    setDefaultAddress = async (req, res) => {

        try {

            const { id, customerId } = req.body;

            const result = await CustomerAddressRepository.setDefaultAddress(id, customerId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= DELETE ADDRESS ================= */

    deleteAddress = async (req, res) => {

        try {

            const { id } = req.params;

            const result = await CustomerAddressRepository.deleteAddress(id);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

}

module.exports = new CustomerAddressController();