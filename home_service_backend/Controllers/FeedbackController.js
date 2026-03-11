const FeedbackRepository = require("../Repositories/FeedbackRepository");
const { ObjectId } = require("mongodb");

class FeedbackController {

    /* ================= CREATE FEEDBACK ================= */

    createFeedback = async (req, res) => {

        try {

            const { customerId, message } = req.body;

            if (!customerId)
                return res.status(400).json({ Status: "Fail", Result: "Customer Id required" });

            if (!ObjectId.isValid(customerId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Customer Id" });

            if (!message)
                return res.status(400).json({ Status: "Fail", Result: "Message required" });

            const result = await FeedbackRepository.createFeedback(req.body);

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


    /* ================= FEEDBACK LIST ================= */

    feedbackList = async (req, res) => {

        try {

            const result = await FeedbackRepository.feedbackList();

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= FEEDBACK BY CUSTOMER ================= */

    feedbackByCustomer = async (req, res) => {

        try {

            const { customerId } = req.params;

            if (!ObjectId.isValid(customerId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Customer Id" });

            const result = await FeedbackRepository.feedbackByCustomer(customerId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= UPDATE FEEDBACK ================= */

    updateFeedbackStatus = async (req, res) => {

        try {

            const { id, status, adminRemark } = req.body;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Feedback Id required" });

            if (!status)
                return res.status(400).json({ Status: "Fail", Result: "Status required" });

            const result = await FeedbackRepository.updateFeedbackStatus(
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

module.exports = new FeedbackController();