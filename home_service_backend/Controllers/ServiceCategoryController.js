const ServiceCategoryRepository = require("./../Repositories/ServiceCategoryRepository");

class ServiceCategoryController {

    /* ================= CREATE CATEGORY ================= */
    createCategory = async (req, res) => {
        try {
            const { name, description, base64Data } = req.body;

            if (!name)
                return res.status(400).json({ Status: "Fail", Result: "Category name is required" });

            if (name.trim().length < 2)
                return res.status(400).json({ Status: "Fail", Result: "Category name must be at least 2 characters" });

            if (base64Data && !base64Data.startsWith("data:image"))
                return res.status(400).json({ Status: "Fail", Result: "Invalid image format" });

            const result = await ServiceCategoryRepository.createCategory(req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(500).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= UPDATE CATEGORY ================= */
    updateCategory = async (req, res) => {
        try {
            const { _id, name, base64Data } = req.body;

            if (!_id)
                return res.status(400).json({ Status: "Fail", Result: "Category Id is required" });

            if (!name)
                return res.status(400).json({ Status: "Fail", Result: "Category name is required" });

            if (name.trim().length < 2)
                return res.status(400).json({ Status: "Fail", Result: "Category name must be at least 2 characters" });

            if (base64Data && !base64Data.startsWith("data:image"))
                return res.status(400).json({ Status: "Fail", Result: "Invalid image format" });

            const result = await ServiceCategoryRepository.updateCategory(_id, req.body);

            if (result.Status === "OK")
                return res.status(200).json(result);

            if (result.Status === "Conflict")
                return res.status(409).json(result);

            return res.status(400).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= CATEGORY LIST ================= */
    categoryList = async (req, res) => {
        try {
            const result = await ServiceCategoryRepository.categoryList();

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(500).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= GET CATEGORY BY ID ================= */
    getCategoryById = async (req, res) => {
        try {
            const { id } = req.params;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Category Id is required" });

            const result = await ServiceCategoryRepository.getCategoryById(id);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(404).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };


    /* ================= DELETE CATEGORY ================= */
    deleteCategory = async (req, res) => {
        try {
            const { id } = req.body;

            if (!id)
                return res.status(400).json({ Status: "Fail", Result: "Category Id is required" });

            const result = await ServiceCategoryRepository.deleteCategory(id);

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(404).json(result);

        } catch (error) {
            return res.status(500).json({ Status: "Fail", Result: error.message });
        }
    };

    /* ================= ACTIVE CATEGORY LIST ================= */

    activeCategoryList = async (req, res) => {

        try {

            const result = await ServiceCategoryRepository.activeCategoryList();

            if (result.Status === "OK")
                return res.status(200).json(result);

            return res.status(500).json(result);

        } catch (error) {

            return res.status(500).json({
                Status: "Fail",
                Result: error.message
            });

        }

    };

    deletedCategoryList = async (req, res) => {
    try {
        const result = await ServiceCategoryRepository.deletedCategoryList();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};

recoverCategory = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ Status: "Fail", Result: "Category Id is required" });
        const result = await ServiceCategoryRepository.recoverCategory(id);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ Status: "Fail", Result: error.message });
    }
};
};


module.exports = new ServiceCategoryController();