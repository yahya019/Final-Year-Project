const CommissionRepository = require("../Repositories/CommissionRepository");
const { ObjectId } = require("mongodb");

class CommissionController {

    /* ================= CREATE COMMISSION ================= */

    createCommission = async (req, res) => {

        try {

            const { bookingId, totalAmount, commissionPercentage } = req.body;

            if (!bookingId)
                return res.status(400).json({ Status: "Fail", Result: "Booking Id required" });

            if (!totalAmount)
                return res.status(400).json({ Status: "Fail", Result: "Total amount required" });

            if (!commissionPercentage)
                return res.status(400).json({ Status: "Fail", Result: "Commission percentage required" });

            const result = await CommissionRepository.createCommission(req.body);

            return res.status(200).json(result);

            if (result.Status === "Conflict")    // ← ADD THIS
    return res.status(409).json(result);


        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= COMMISSION LIST ================= */

    commissionList = async (req, res) => {

        try {

            const result = await CommissionRepository.commissionList();

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= GET BY BOOKING ================= */

    getByBooking = async (req, res) => {

        try {

            const { bookingId } = req.params;

            if (!ObjectId.isValid(bookingId))
                return res.status(400).json({ Status: "Fail", Result: "Invalid Booking Id" });

            const result = await CommissionRepository.getByBooking(bookingId);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= SETTLE COMMISSION ================= */

    settleCommission = async (req, res) => {

        try {

            const { id } = req.body;

            const result = await CommissionRepository.settleCommission(id);

            return res.status(200).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

    getByServiceman = async (req, res) => {
    try {
        const { servicemanId } = req.params;
        if (!servicemanId)
            return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

        const result = await CommissionRepository.getByServiceman(servicemanId);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

bulkSettle = async (req, res) => {
    try {
        const { ids, settledAt } = req.body;
        if (!ids || !ids.length) return res.status(400).json({ Status: "Fail", Result: "No ids provided" });
        const result = await CommissionRepository.bulkSettle(ids, settledAt || new Date());
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};
}

module.exports = new CommissionController();