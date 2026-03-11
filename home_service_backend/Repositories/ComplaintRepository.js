const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ComplaintRepository {

    /* ================= CREATE COMPLAINT ================= */

    createComplaint = async (model) => {

    try {

        if (!ObjectId.isValid(model.bookingId))
            return { Status: "Fail", Result: "Invalid Booking Id" };

        if (!ObjectId.isValid(model.customerId))
            return { Status: "Fail", Result: "Invalid Customer Id" };

        if (!ObjectId.isValid(model.servicemanId))
            return { Status: "Fail", Result: "Invalid Serviceman Id" };

        if (!model.message || model.message.trim().length < 5)
            return { Status: "Fail", Result: "Complaint message must be at least 5 characters" };

        const complaintCollection = await getCollection("Complaint");
        const bookingCollection = await getCollection("BookingMaster");
        const customerCollection = await getCollection("Customer");
        const servicemanCollection = await getCollection("Serviceman");

        /* ===== CHECK CUSTOMER ===== */

        const customer = await customerCollection.findOne({
            _id: new ObjectId(model.customerId)
        });

        if (!customer)
            return { Status: "Fail", Result: "Customer not found" };


        /* ===== CHECK SERVICEMAN ===== */

        const serviceman = await servicemanCollection.findOne({
            _id: new ObjectId(model.servicemanId)
        });

        if (!serviceman)
            return { Status: "Fail", Result: "Serviceman not found" };


        /* ===== CHECK BOOKING ===== */

        const booking = await bookingCollection.findOne({
            _id: new ObjectId(model.bookingId)
        });

        if (!booking)
            return { Status: "Fail", Result: "Booking not found" };


        /* ===== VERIFY CUSTOMER BOOKING ===== */

        if (booking.customerId.toString() !== model.customerId)
            return { Status: "Fail", Result: "This booking does not belong to the customer" };


        /* ===== VERIFY SERVICEMAN ===== */

        if (booking.servicemanId.toString() !== model.servicemanId)
            return { Status: "Fail", Result: "Serviceman mismatch for this booking" };


        /* ===== OPTIONAL: ONLY AFTER COMPLETION ===== */

        if (booking.bookingStatus !== "Completed")
            return { Status: "Fail", Result: "Complaint allowed only after service completion" };


        /* ===== CHECK DUPLICATE COMPLAINT ===== */

        const existingComplaint = await complaintCollection.findOne({
            bookingId: new ObjectId(model.bookingId)
        });

        if (existingComplaint)
            return { Status: "Conflict", Result: "Complaint already exists for this booking" };


        /* ===== CREATE COMPLAINT ===== */

        const data = {

            bookingId: new ObjectId(model.bookingId),

            customerId: new ObjectId(model.customerId),

            servicemanId: new ObjectId(model.servicemanId),

            message: model.message,

            status: "Open",

            adminRemark: null,

            resolvedAt: null,

            createdAt: new Date()

        };

        await complaintCollection.insertOne(data);

        return {
            Status: "OK",
            Result: "Complaint submitted successfully"
        };

    } catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};


    /* ================= COMPLAINT LIST ================= */

    complaintList = async () => {

        try {

            const collection = await getCollection("Complaint");

            const complaints = await collection.aggregate([
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
                    $lookup: {
                        from: "Serviceman",
                        localField: "servicemanId",
                        foreignField: "_id",
                        as: "serviceman"
                    }
                },
                { $unwind: "$serviceman" },
                {
                    $project: {
                        message: 1,
                        status: 1,
                        adminRemark: 1,
                        createdAt: 1,
                        resolvedAt: 1,
                        "customer.fullName": 1,
                        "serviceman.fullName": 1
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ]).toArray();

            return {
                Status: "OK",
                Result: complaints
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= COMPLAINT BY CUSTOMER ================= */

    getComplaintByCustomer = async (customerId) => {

        try {

            const collection = await getCollection("Complaint");

            const complaints = await collection.find({
                customerId: new ObjectId(customerId)
            }).sort({ createdAt: -1 }).toArray();

            return {
                Status: "OK",
                Result: complaints
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= UPDATE COMPLAINT STATUS ================= */

    updateComplaintStatus = async (id, status, remark) => {

        try {

            const collection = await getCollection("Complaint");

            const updateData = {
                status: status,
                adminRemark: remark
            };

            if (status === "Resolved") {
                updateData.resolvedAt = new Date();
            }

            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );

            return {
                Status: "OK",
                Result: "Complaint updated successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

}

module.exports = new ComplaintRepository();