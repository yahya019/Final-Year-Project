const ReviewRepository = require("../Repositories/ReviewRepository");

class ReviewController {

    /* ================= CREATE REVIEW ================= */

    createReview = async (req, res) => {

        try {

            const { customerId, bookingId, servicemanId, serviceId, rating } = req.body;

            if (!customerId)
                return res.status(400).json({ Status: "Fail", Result: "Customer Id required" });

            if (!bookingId)
                return res.status(400).json({ Status: "Fail", Result: "Booking Id required" });

            if (!servicemanId)
                return res.status(400).json({ Status: "Fail", Result: "Serviceman Id required" });

            if (!serviceId)
                return res.status(400).json({ Status: "Fail", Result: "Service Id required" });

            if (!rating)
                return res.status(400).json({ Status: "Fail", Result: "Rating required" });

            const result = await ReviewRepository.createReview(req.body);

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


    /* ================= GET SERVICEMAN REVIEWS ================= */

    getReviewsByServiceman = async (req, res) => {

        try {

            const { id } = req.params;

            const result = await ReviewRepository.getReviewsByServiceman(id);

            return res.status(200).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };


    /* ================= GET SERVICE REVIEWS ================= */

    getReviewsByService = async (req, res) => {

        try {

            const { id } = req.params;

            const result = await ReviewRepository.getReviewsByService(id);

            return res.status(200).json(result);

        }
        catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

    /* ================= GET ALL REVIEWS (ADMIN) ================= */
getAllReviews = async (req, res) => {
    try {
        const result = await ReviewRepository.getAllReviews();

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            Status: "Fail",
            Result: error.message
        });
    }
};

}

module.exports = new ReviewController();