const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ReviewRepository {

    /* ================= CREATE REVIEW ================= */

    createReview = async (model) => {

        try {

            const reviewCollection = await getCollection("ReviewMaster");
            const bookingCollection = await getCollection("BookingMaster");

            /* ===== VALIDATE BOOKING ===== */

            const booking = await bookingCollection.findOne({
                _id: new ObjectId(model.bookingId)
            });

            if (!booking)
                return { Status: "Fail", Result: "Booking not found" };

            if (booking.bookingStatus !== "Completed")
                return { Status: "Fail", Result: "Review allowed only after service completion" };

            /* ===== CHECK DUPLICATE REVIEW ===== */

            const exist = await reviewCollection.findOne({
                bookingId: new ObjectId(model.bookingId)
            });

            if (exist)
                return { Status: "Conflict", Result: "Review already submitted for this booking" };

            /* ===== RATING VALIDATION ===== */

            if (model.rating < 1 || model.rating > 5)
                return { Status: "Fail", Result: "Rating must be between 1 and 5" };

            /* ===== CREATE REVIEW ===== */

            const data = {

                customerId: new ObjectId(model.customerId),

                bookingId: new ObjectId(model.bookingId),

                servicemanId: new ObjectId(model.servicemanId),

                serviceId: new ObjectId(model.serviceId),

                rating: Number(model.rating),

                review: model.review || null,

                createdAt: new Date()

            };

            await reviewCollection.insertOne(data);

            return {
                Status: "OK",
                Result: "Review submitted successfully"
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= GET REVIEWS BY SERVICEMAN ================= */

    getReviewsByServiceman = async (servicemanId) => {

        try {

            const reviewCollection = await getCollection("ReviewMaster");

            const reviews = await reviewCollection.aggregate([
                {
                    $match: {
                        servicemanId: new ObjectId(servicemanId)
                    }
                },
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                { $unwind: "$customer" },
                {
                    $project: {
                        rating: 1,
                        review: 1,
                        createdAt: 1,
                        "customer.fullName": 1
                    }
                }
            ]).toArray();

            return {
                Status: "OK",
                Result: reviews
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= GET REVIEWS BY SERVICE ================= */

    getReviewsByService = async (serviceId) => {

        try {

            const reviewCollection = await getCollection("ReviewMaster");

            const reviews = await reviewCollection.find({
                serviceId: new ObjectId(serviceId)
            }).toArray();

            return {
                Status: "OK",
                Result: reviews
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }
    };

    /* ================= GET ALL REVIEWS ================= */
    getAllReviews = async () => {
        try {
            const collection = await getCollection("ReviewMaster");

            const reviews = await collection.aggregate([
                {
                    $lookup: {
                        from: "Customer",
                        localField: "customerId",
                        foreignField: "_id",
                        as: "customer"
                    }
                },
                { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Serviceman",
                        localField: "servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: { path: "$serviceman", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "Service",
                        localField: "serviceId",
                        foreignField: "_id",
                        as: "service"
                    }
                },
                { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
                { $sort: { createdAt: -1 } }
            ]).toArray();

            return { Status: "OK", Result: reviews };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };
}

module.exports = new ReviewRepository();