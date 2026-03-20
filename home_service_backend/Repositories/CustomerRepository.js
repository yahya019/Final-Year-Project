const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");
const bcrypt = require("bcrypt");

class CustomerRepository {

    /* ================= REGISTER CUSTOMER ================= */

    registerCustomer = async (model) => {
        try {

            const collection = await getCollection("Customer");

            // Check Contact Number
            const contactExist = await collection.findOne({
                contactNumber: model.contactNumber
            });

            if (contactExist)
                return { Status: "Conflict", Result: "Contact number already exists" };

            // Check Email
            if (model.email) {

                const emailExist = await collection.findOne({
                    email: model.email
                });

                if (emailExist)
                    return { Status: "Conflict", Result: "Email already exists" };
            }

            const hashedPassword = await bcrypt.hash(model.password, 10);

            const data = {

                fullName: model.fullName,
                contactNumber: model.contactNumber,
                email: model.email || null,
                password: hashedPassword,

                status: "Active",

                createdAt: new Date()

            };

            await collection.insertOne(data);

            return {
                Status: "OK",
                Result: "Customer Registered Successfully"
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }
    };


    /* ================= CUSTOMER LOGIN ================= */
signIn = async (contactNumber, password) => {
    try {
        const jwt = require('jsonwebtoken');
        const collection = await getCollection("Customer");

        const customer = await collection.findOne({ contactNumber });

        if (!customer)
            return { Status: "Fail", Result: "Invalid contact number" };

        if (customer.status !== "Active")
            return { Status: "Fail", Result: "Account is inactive" };

        const isMatch = await bcrypt.compare(password, customer.password);

        if (!isMatch)
            return { Status: "Fail", Result: "Invalid password" };

        const token = jwt.sign(
            { id: customer._id, contactNumber: customer.contactNumber },
            process.env.JWT_SECRET || 'fixit_secret',
            { expiresIn: '7d' }
        );

        const { password: _, ...safeCustomer } = customer;

        return {
            Status: "OK",
            Result: {
                token,
                customer: safeCustomer
            }
        };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};


    /* ================= CUSTOMER LIST ================= */

    customerList = async () => {

        try {

            const collection = await getCollection("Customer");

            const customers = await collection.find(
                {},
                { projection: { password: 0 } }
            ).toArray();

            return {
                Status: "OK",
                Result: customers
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };


    /* ================= CHANGE PASSWORD ================= */

    changePassword = async (_id, oldPassword, newPassword) => {

        try {

            const collection = await getCollection("Customer");

            const customer = await collection.findOne({
                _id: new ObjectId(_id)
            });

            if (!customer)
                return { Status: "Fail", Result: "Customer not found" };

            const isMatch = await bcrypt.compare(oldPassword, customer.password);

            if (!isMatch)
                return { Status: "Fail", Result: "Old password incorrect" };

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        password: hashedPassword
                    }
                }
            );

            return {
                Status: "OK",
                Result: "Password updated successfully"
            };

        }
        catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    forgotPassword = async (email) => {

    try {

        const collection = await getCollection("Customer");

        const customer = await collection.findOne({ email: email });

        if (!customer)
            return { Status: "Fail", Result: "Email not registered" };

        /* Generate new password */

        const newPassword = Math.random().toString(36).slice(-8);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await collection.updateOne(
            { email: email },
            {
                $set: {
                    password: hashedPassword
                }
            }
        );

        /* Send Mail */

        const template = forgotPasswordTemplate(
            customer.fullName,
            newPassword,
            customer.email
        );

        await sendMail(
            customer.email,
            "FixIt - Customer Password Reset",
            template
        );

        return {
            Status: "OK",
            Result: "New password sent to registered email"
        };

    }
    catch (error) {

        return {
            Status: "Fail",
            Result: error.message
        };

    }

};

}

module.exports = new CustomerRepository();