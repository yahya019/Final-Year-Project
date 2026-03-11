const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class FeedbackRepository {

    /* ================= CREATE FEEDBACK ================= */

    createFeedback = async (model) => {

        try {

            const collection = await getCollection("Feedback");

            const data = {

                customerId: new ObjectId(model.customerId),

                message: model.message,

                status: "Open",

                adminRemark: null,

                createdAt: new Date()

            };

            await collection.insertOne(data);

            return {
                Status: "OK",
                Result: "Feedback submitted successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= FEEDBACK LIST ================= */

    feedbackList = async () => {

        try {

            const collection = await getCollection("Feedback");

            const feedbacks = await collection.aggregate([
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
                        message: 1,
                        status: 1,
                        adminRemark: 1,
                        createdAt: 1,
                        "customer.fullName": 1,
                        "customer.contactNumber": 1
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]).toArray();

            return {
                Status: "OK",
                Result: feedbacks
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= FEEDBACK BY CUSTOMER ================= */

    feedbackByCustomer = async (customerId) => {

        try {

            const collection = await getCollection("Feedback");

            const feedbacks = await collection.find({
                customerId: new ObjectId(customerId)
            }).sort({ createdAt: -1 }).toArray();

            return {
                Status: "OK",
                Result: feedbacks
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= UPDATE FEEDBACK STATUS ================= */

    updateFeedbackStatus = async (id, status, remark) => {

        try {

            const collection = await getCollection("Feedback");

            await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        status: status,
                        adminRemark: remark
                    }
                }
            );

            return {
                Status: "OK",
                Result: "Feedback updated successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

}

module.exports = new FeedbackRepository();