const ComplaintRepository = require("../Repositories/ComplaintRepository");
const { ObjectId } = require("mongodb");

class ComplaintController {

    /* ================= CREATE COMPLAINT ================= */

    createComplaint = async (req, res) => {

        try {

            const { bookingId, customerId, servicemanId, message } = req.body;

            if (!bookingId)
                return res.status(400).json({ Status: "Fail", Result: "Booking Id required" });

            if (!customerId)
                return res.status(400).json({ Status: "Fail", Result: "Customer Id required" });

            if (!servicemanId)
                return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

            if (!message)
                return res.status(400).json({ Status: "Fail", Result: "Complaint message required" });

            const result = await ComplaintRepository.createComplaint(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(400).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= COMPLAINT LIST ================= */

    complaintList = async (req, res) => {

        try {

            const result = await ComplaintRepository.complaintList();

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= CUSTOMER COMPLAINT ================= */

    getComplaintByCustomer = async (req, res) => {

        try {

            const { customerId } = req.params;

            if (!ObjectId.isValid(customerId))
                return res.status(400).json({
                    Status: "Fail",
                    Result: "Invalid Customer Id"
                });

            const result = await ComplaintRepository.getComplaintByCustomer(customerId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= UPDATE STATUS ================= */

    updateComplaintStatus = async (req, res) => {

        try {

            const { id, status, adminRemark } = req.body;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Complaint Id required" });

            if (!status)
                return res.status(400).json({ Status: "Fail", Result: "Status required" });

            const result = await ComplaintRepository.updateComplaintStatus(
                id,
                status,
                adminRemark
            );

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

}

module.exports = new ComplaintController();