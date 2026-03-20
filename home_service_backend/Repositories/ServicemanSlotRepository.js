const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class ServicemanSlotRepository {

    /* ================= CREATE SLOT ================= */

    createSlot = async (model) => {

        try {

            const slotCollection = await getCollection("ServicemanSlot");
            const servicemanCollection = await getCollection("Serviceman");

            /* ===== CHECK SERVICEMAN EXISTS ===== */

            const serviceman = await servicemanCollection.findOne({
                _id: new ObjectId(model.servicemanId)
            });

            if (!serviceman)
                return {
                    Status: "Fail",
                    Result: "Serviceman not found"
                };


            /* ===== VALIDATE DATE ===== */

            const availableDate = new Date(model.availableDate);

            if (isNaN(availableDate))
                return {
                    Status: "Fail",
                    Result: "Invalid date format"
                };

            /* ===== CHECK PAST DATE ===== */

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (availableDate < today)
                return {
                    Status: "Fail",
                    Result: "Cannot create slot for past date"
                };


            /* ===== VALIDATE TOTAL SLOTS ===== */

            if (!model.totalSlots || Number(model.totalSlots) <= 0)
                return {
                    Status: "Fail",
                    Result: "Total slots must be greater than 0"
                };


            /* ===== CHECK DUPLICATE SLOT ===== */

            const exist = await slotCollection.findOne({
                servicemanId: new ObjectId(model.servicemanId),
                availableDate: availableDate
            });

            if (exist)
                return {
                    Status: "Conflict",
                    Result: "Slot already created for this date"
                };


            /* ===== CREATE SLOT ===== */

            const data = {

                servicemanId: new ObjectId(model.servicemanId),
                availableDate: availableDate,
                totalSlots: Number(model.totalSlots),
                bookedSlots: 0,
                createdAt: new Date()

            };

            await slotCollection.insertOne(data);

            return {
                Status: "OK",
                Result: "Slot created successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= GET SLOT BY ID ================= */

getSlotById = async (_id) => {

    try {

        if (!ObjectId.isValid(_id))
            return {
                Status: "Fail",
                Result: "Invalid Slot Id"
            };

        const collection = await getCollection("ServicemanSlot");

        const slot = await collection.findOne({
            _id: new ObjectId(_id)
        });

        if (!slot)
            return {
                Status: "Fail",
                Result: "Slot not found"
            };

        return {
            Status: "OK",
            Result: slot
        };

    } catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};

slotsByServiceman = async (servicemanId) => {
    try {
        const collection = await getCollection("ServicemanSlot");

        if (!ObjectId.isValid(servicemanId))
            return { Status: "Fail", Result: "Invalid Serviceman Id" };

        const slots = await collection.find({
            servicemanId: new ObjectId(servicemanId)
        }).sort({ availableDate: 1 }).toArray();

        return { Status: "OK", Result: slots };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

deleteSlot = async (id) => {
    try {
        const collection = await getCollection("ServicemanSlot");

        if (!ObjectId.isValid(id))
            return { Status: "Fail", Result: "Invalid Slot Id" };

        const slot = await collection.findOne({ _id: new ObjectId(id) });

        if (!slot)
            return { Status: "Fail", Result: "Slot not found" };

        if (slot.bookedSlots > 0)
            return { Status: "Fail", Result: "Cannot delete slot with existing bookings" };

        await collection.deleteOne({ _id: new ObjectId(id) });

        return { Status: "OK", Result: "Slot deleted successfully" };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};
}

module.exports = new ServicemanSlotRepository();