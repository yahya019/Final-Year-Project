const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");

class CustomerAddressRepository {

    /* ================= CREATE ADDRESS ================= */

    createAddress = async (model) => {

        try {

            const addressCollection = await getCollection("CustomerAddress");
            const customerCollection = await getCollection("Customer");

            if (!ObjectId.isValid(model.customerId))
                return { Status: "Fail", Result: "Invalid Customer Id" };

            const customer = await customerCollection.findOne({
                _id: new ObjectId(model.customerId)
            });

            if (!customer)
                return { Status: "Fail", Result: "Customer not found" };

            const data = {

                customerId: new ObjectId(model.customerId),

                addressLine: model.addressLine,

                landmark: model.landmark || null,

                city: model.city,

                latitude: model.latitude || null,

                longitude: model.longitude || null,

                isDefault: model.isDefault || false,

                createdAt: new Date(),

                updatedAt: new Date()

            };

            /* ===== IF DEFAULT ADDRESS ===== */

            if (data.isDefault) {

                await addressCollection.updateMany(
                    { customerId: new ObjectId(model.customerId) },
                    { $set: { isDefault: false } }
                );

            }

            await addressCollection.insertOne(data);

            return {
                Status: "OK",
                Result: "Address created successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= ADDRESS LIST ================= */

    addressList = async (customerId) => {

        try {

            const collection = await getCollection("CustomerAddress");

            const addresses = await collection.find({
                customerId: new ObjectId(customerId)
            }).sort({ isDefault: -1 }).toArray();

            return {
                Status: "OK",
                Result: addresses
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= UPDATE ADDRESS ================= */

    updateAddress = async (id, model) => {

        try {

            const collection = await getCollection("CustomerAddress");

            await collection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        addressLine: model.addressLine,
                        landmark: model.landmark,
                        city: model.city,
                        latitude: model.latitude,
                        longitude: model.longitude,
                        updatedAt: new Date()
                    }
                }
            );

            return {
                Status: "OK",
                Result: "Address updated successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= SET DEFAULT ADDRESS ================= */

    setDefaultAddress = async (id, customerId) => {

        try {

            const collection = await getCollection("CustomerAddress");

            await collection.updateMany(
                { customerId: new ObjectId(customerId) },
                { $set: { isDefault: false } }
            );

            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { isDefault: true } }
            );

            return {
                Status: "OK",
                Result: "Default address updated"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= DELETE ADDRESS ================= */

    deleteAddress = async (id) => {

        try {

            const collection = await getCollection("CustomerAddress");

            await collection.deleteOne({
                _id: new ObjectId(id)
            });

            return {
                Status: "OK",
                Result: "Address deleted successfully"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

}

module.exports = new CustomerAddressRepository();