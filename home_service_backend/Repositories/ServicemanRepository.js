const { getCollection } = require("./dbConfig");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");

class ServicemanRepository {

    registerServiceman  = async (model) => {
        try {

            const collection = await getCollection("Serviceman");

            // 🔍 Check Email Exist
            const emailExist = await collection.findOne({ email: model.email });
            if (emailExist) {
                return {
                    Status: "Conflict",
                    Result: "Email already exists"
                };
            }

            // 🔍 Check Contact Number Exist
            const contactExist = await collection.findOne({ contactNumber: model.contactNumber });
            if (contactExist) {
                return {
                    Status: "Conflict",
                    Result: "Contact number already exists"
                };
            }

            // 🔍 Check Aadhaar Exist
            const aadhaarExist = await collection.findOne({ aadhaarNumber: model.aadhaarNumber });
            if (aadhaarExist) {
                return {
                    Status: "Conflict",
                    Result: "Aadhaar number already exists"
                };
            }

            // 🔐 Hash Password
            const hashedPassword = await bcrypt.hash(model.password, 10);

            const data = {
                fullName: model.fullName,
                address: model.address,
                businessName: model.businessName || null,
                gstNumber: model.gstNumber || null,
                contactNumber: model.contactNumber,
                email: model.email,
                password: hashedPassword,
                aadhaarNumber: model.aadhaarNumber,
                aadhaarCopyUrl: model.aadhaarCopyUrl || null,
                bankAccountHolderName: model.bankAccountHolderName,
                bankName: model.bankName,
                accountNumber: model.accountNumber,
                ifscCode: model.ifscCode,
                upiId: model.upiId || null,
                aboutBusiness: model.aboutBusiness || null,
                city: model.city,
                status: "Pending",
                createdAt: new Date()
            };

            const result = await collection.insertOne(data);

            if (result.acknowledged) {
                return {
                    Status: "OK",
                    Result: "Serviceman Registered Successfully"
                };
            }

            return {
                Status: "Fail",
                Result: "Something went wrong"
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }
    };

    /* ================= SERVICEMAN LIST ================= */
servicemanList = async () => {
    try {
        const collection = await getCollection("Serviceman");

        const servicemen = await collection.find(
            {},
            {
                projection: {
                    password: 0,
                    aadhaarNumber: 0
                }
            }
        ).toArray();

        return {
            Status: "OK",
            Result: servicemen
        };

    } catch (error) {
        return {
            Status: "Fail",
            Result: error.message
        };
    }
};

    /* ================= SERVICEMAN BY CITY ================= */

servicemanByCity = async (city) => {

    try {

        const collection = await getCollection("Serviceman");

        const servicemen = await collection.find(
            {
                city: city,
                status: "Approved"
            },
            {
                projection: {
                    password: 0,
                    aadhaarNumber: 0
                }
            }
        ).toArray();

        return {
            Status: "OK",
            Result: servicemen
        };

    } catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};


/* ================= SERVICEMAN BY ID ================= */

servicemanById = async (id) => {

    try {

        if (!ObjectId.isValid(id))
            return { Status: "Fail", Result: "Invalid Serviceman Id" };

        const collection = await getCollection("Serviceman");

        const serviceman = await collection.findOne(
            { _id: new ObjectId(id) },
            {
                projection: {
                    password: 0,
                    aadhaarNumber: 0
                }
            }
        );

        if (!serviceman)
            return { Status: "Fail", Result: "Serviceman not found" };

        return {
            Status: "OK",
            Result: serviceman
        };

    } catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};


/* ================= CHANGE SERVICEMAN STATUS ================= */

changeStatus = async (id, status) => {

    try {

        const collection = await getCollection("Serviceman");

        if (!ObjectId.isValid(id))
            return { Status: "Fail", Result: "Invalid Serviceman Id" };

        if (!["Pending", "Approved", "Rejected", "Suspended"].includes(status))
            return { Status: "Fail", Result: "Invalid status value" };

        const serviceman = await collection.findOne({
            _id: new ObjectId(id)
        });

        if (!serviceman)
            return { Status: "Fail", Result: "Serviceman not found" };

        await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: status
                }
            }
        );

        return {
            Status: "OK",
            Result: "Serviceman status updated successfully"
        };

    } catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};

}

module.exports = new ServicemanRepository();