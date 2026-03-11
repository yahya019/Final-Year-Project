const { ObjectId } = require("mongodb");
const { getCollection } = require("./dbConfig");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");


class ServiceCategoryRepository {

    /* ================= CREATE CATEGORY ================= */
    createCategory = async (model) => {
        try {
            const collection = await getCollection("ServiceCategory");

            // 🔍 Check duplicate name
            const nameExist = await collection.findOne({
                name: model.name,
                isDeleted: false
            });

            if (nameExist) {
                return { Status: "Conflict", Result: "Category name already exists" };
            }

            let imagePath = null;

            // 📷 If base64 image provided
            if (model.base64Data) {

                const uploadDir = path.join(__dirname, "../Content/Images");

                // Create folder if not exists
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Remove base64 header if exists
                const base64Image = model.base64Data.replace(/^data:image\/\w+;base64,/, "");

                const fileName = uuidv4() + ".png";
                const fullPath = path.join(uploadDir, fileName);

                // Save file
                fs.writeFileSync(fullPath, base64Image, { encoding: "base64" });

                imagePath = `/Content/Images/${fileName}`;
            }

            const data = {
                name: model.name,
                description: model.description || null,
                imageUrl: imagePath,
                isDeleted: false,
                createdAt: new Date()
            };

            await collection.insertOne(data);

            return { Status: "OK", Result: "Category Created Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= UPDATE CATEGORY ================= */
    updateCategory = async (_id, model) => {
        try {
            const collection = await getCollection("ServiceCategory");

            const category = await collection.findOne({
                _id: new ObjectId(_id),
                isDeleted: false
            });

            if (!category)
                return { Status: "Fail", Result: "Category not found" };

            // 🔍 Check duplicate name (excluding current)
            const nameExist = await collection.findOne({
                name: model.name,
                _id: { $ne: new ObjectId(_id) },
                isDeleted: false
            });

            if (nameExist)
                return { Status: "Conflict", Result: "Category name already exists" };

            let imagePath = category.imageUrl; // keep old image by default

            // 📷 If new base64 image provided
            if (model.base64Data) {
                const uploadDir = path.join(__dirname, "../Content/Images");

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Delete old image if exists
                if (category.imageUrl) {
                    const oldImagePath = path.join(__dirname, "..", category.imageUrl);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // Remove base64 header
                const base64Image = model.base64Data.replace(/^data:image\/\w+;base64,/, "");

                const fileName = uuidv4() + ".png";
                const fullPath = path.join(uploadDir, fileName);

                fs.writeFileSync(fullPath, base64Image, { encoding: "base64" });

                imagePath = `/Content/Images/${fileName}`;
            }

            await collection.updateOne(
                { _id: new ObjectId(_id) },
                {
                    $set: {
                        name: model.name,
                        description: model.description || null,
                        imageUrl: imagePath
                    }
                }
            );

            return { Status: "OK", Result: "Category Updated Successfully" };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= CATEGORY LIST ================= */
    categoryList = async () => {
        try {
            const collection = await getCollection("ServiceCategory");

            const categories = await collection.find(
                { isDeleted: false }
            ).toArray();

            return { Status: "OK", Result: categories };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


    /* ================= GET CATEGORY BY ID ================= */
    getCategoryById = async (_id) => {
        try {
            const collection = await getCollection("ServiceCategory");

            const category = await collection.findOne({
                _id: new ObjectId(_id),
                isDeleted: false
            });

            if (!category)
                return { Status: "Fail", Result: "Category not found" };

            return { Status: "OK", Result: category };

        } catch (error) {
            return { Status: "Fail", Result: error.message };
        }
    };


   /* ================= SOFT DELETE CATEGORY ================= */
deleteCategory = async (_id) => {
    try {
        const collection         = await getCollection("ServiceCategory");
        const serviceCollection  = await getCollection("Service");

        const category = await collection.findOne({ _id: new ObjectId(_id) });

        if (!category)
            return { Status: "Fail", Result: "Category not found" };

        // Soft delete the category
        await collection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { isDeleted: true } }
        );

        // ── CASCADE DELETE ──────────────────────────────────
        // Also soft delete ALL services under this category
        await serviceCollection.updateMany(
            { serviceCategoryId: new ObjectId(_id), isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } }
        );

        return { Status: "OK", Result: "Category and its services deleted successfully" };

    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

    /* ================= ACTIVE CATEGORY LIST ================= */

    activeCategoryList = async () => {

        try {

            const collection = await getCollection("ServiceCategory");

            const categories = await collection.find(
                {
                    isDeleted: false
                },
                {
                    projection: {
                        name: 1,
                        description: 1,
                        createdAt: 1
                    }
                }
            ).toArray();

            return {
                Status: "OK",
                Result: categories
            };

        } catch (error) {

            return {
                Status: "Fail",
                Result: error.message
            };

        }

    };

    /* ================= DELETED CATEGORY LIST ================= */
deletedCategoryList = async () => {
    try {
        const collection = await getCollection("ServiceCategory");
        const categories = await collection.find({ isDeleted: true }).toArray();
        return { Status: "OK", Result: categories };
    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

/* ================= RECOVER CATEGORY ================= */
recoverCategory = async (_id) => {
    try {
        const collection        = await getCollection("ServiceCategory");
        const serviceCollection = await getCollection("Service");

        await collection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: { isDeleted: false } }
        );
        // Also recover all services under this category
        await serviceCollection.updateMany(
            { serviceCategoryId: new ObjectId(_id) },
            { $set: { isDeleted: false, deletedAt: null } }
        );
        return { Status: "OK", Result: "Category and services recovered" };
    } catch (error) {
        return { Status: "Fail", Result: error.message };
    }
};

}

module.exports = new ServiceCategoryRepository();