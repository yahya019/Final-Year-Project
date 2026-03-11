const ServicemanPaymentRepository = require("../Repositories/ServicemanPaymentRepository");
const { ObjectId } = require("mongodb");

class ServicemanPaymentController {

    /* ================= CREATE PAYMENT ================= */

    createPayment = async (req, res) => {

        try {

            const { servicemanId, amount, paymentMode, paymentDate } = req.body;

            if (!servicemanId)
                return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

            if (!ObjectId.isValid(servicemanId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Serviceman Id" });

            if (!amount)
                return res.status(400).json({ Status: "Fail", Result: "Amount required" });

            if (!paymentMode)
                return res.status(400).json({ Status: "Fail", Result: "Payment mode required" });

            if (!paymentDate)
                return res.status(400).json({ Status: "Fail", Result: "Payment date required" });

            const result = await ServicemanPaymentRepository.createPayment(req.body);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= PAYMENT LIST ================= */

    paymentList = async (req, res) => {

        try {

            const result = await ServicemanPaymentRepository.paymentList();

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= PAYMENT BY SERVICEMAN ================= */

    paymentByServiceman = async (req, res) => {

        try {

            const { servicemanId } = req.params;

            if (!ObjectId.isValid(servicemanId))
                return res.status(400).json({
                    Status: "Fail",
                    Result: "Invalid Serviceman Id"
                });

            const result = await ServicemanPaymentRepository.paymentByServiceman(servicemanId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

}

module.exports = new ServicemanPaymentController();