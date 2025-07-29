import Parts, { partTypesConfig } from "./parts.model.js";
import System from "../system/system.model.js";
import bwipjs from 'bwip-js';
import fs, { stat } from 'fs';
import path from 'path';

export const createPart = async (req, res) => {
    try {
        const {
            partType,
            barcode,
            isMultiple,
            serialNumber,
            brand,
            model,
            specs,
            notes,
            status,
            unusableReason,
            assignedSystem = []
        } = req.body;

        const errors = {};
        if (!partType) errors.partType = 'Part type is required';
        if (!barcode) errors.barcode = 'Barcode is required';
        if (!serialNumber) errors.serialNumber = 'Serial number is required';
        if (!brand) errors.brand = 'Brand is required';
        if (!model) errors.model = 'Model is required';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const hasSpecialCharacters = (value) => /[^a-zA-Z0-9 ]/.test(value);

        ['brand', 'model', 'serialNumber', 'barcode', 'notes', 'unusableReason'].forEach((field) => {
            if (req.body[field] && hasSpecialCharacters(req.body[field])) {
                errors[field] = `${field} contains special characters`;
            }
        });
        if (Array.isArray(specs)) {
            specs.forEach((spec, index) => {
                if (hasSpecialCharacters(spec.key)) {
                    errors[`specs[${index}].key`] = `Spec key at index ${index} contains special characters`;
                }
                if (hasSpecialCharacters(spec.value)) {
                    errors[`specs[${index}].value`] = `Spec value at index ${index} contains special characters`;
                }
            });
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const config = partTypesConfig[partType];
        if (!config) {
            errors.partType = `Invalid part type: ${partType}`;
        }

        if (!config.isMultiple && assignedSystem.length > 1) {
            errors.assignedSystem = `Part type (${partType}) can only be assigned to one system`;
        }

        if (status === 'Unusable' && !unusableReason) {
            errors.unusableReason = 'Unusable reason is required when status is (Unusable)';
        }

        const existingBarcode = await Parts.findOne({ barcode });
        if (existingBarcode) {
            errors.barcode = 'Barcode must be unique';
        }

        const existingSerial = await Parts.findOne({ serialNumber });
        if (existingSerial) {
            errors.serialNumber = 'Serial number must be unique';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const pngBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: barcode,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: 'center'
        });

        const barcodeFileName = `${barcode}-${Date.now()}.png`;
        const barcodePath = path.join('uploads/barcodes', barcodeFileName);

        fs.writeFileSync(barcodePath, pngBuffer);

        const newPart = new Parts({
            partType,
            barcode,
            serialNumber,
            brand,
            model,
            specs,
            notes,
            status,
            unusableReason: status === 'Unusable' ? unusableReason : null,
            assignedSystem,
            isMultiple,
            barcodeImage: barcodePath
        });

        await newPart.save();

        res.status(201).json({
            message: "Part created Successfully",
            part: newPart
        });
    } catch (err) {
        console.error("Error in creating parts", err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const getBarcodeInfo = async (req, res) => {
    try {
        const { imageName } = req.params;
        const part = await Parts.findOne({ barcodeImage: { $regex: imageName } });
        if (!part) return res.status(404).json({ message: "Part not found" });
        res.json(part);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

export const updatePart = async (req, res) => {
    try {
        const partId = req.body._id;
        const {
            partType,
            barcode,
            serialNumber,
            brand,
            model,
            specs,
            notes,
            status,
            unusableReason,
            isMultiple,
            assignedSystem = []
        } = req.body;

        const errors = {};

        if (!partType) errors.partType = 'Part type is required';
        if (!barcode) errors.barcode = 'Barcode is required';
        if (!serialNumber) errors.serialNumber = 'Serial number is required';
        if (!brand) errors.brand = 'Brand is required';
        if (!model) errors.model = 'Model is required';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const hasSpecialCharacters = (value) => /[^a-zA-Z0-9 ]/.test(value);

        ['brand', 'model', 'serialNumber', 'barcode', 'notes', 'unusableReason'].forEach((field) => {
            if (req.body[field] && hasSpecialCharacters(req.body[field])) {
                errors[field] = `${field} contains special characters`;
            }
        });

        if (Array.isArray(specs)) {
            specs.forEach((spec, index) => {
                if (hasSpecialCharacters(spec.key)) {
                    errors[`specs[${index}].key`] = `Spec key at index ${index} contains special characters`;
                }
                if (hasSpecialCharacters(spec.value)) {
                    errors[`specs[${index}].value`] = `Spec value at index ${index} contains special characters`;
                }
            });
        }

        const config = partTypesConfig[partType];
        if (!config) {
            errors.partType = `Invalid part type: ${partType}`;
        }

        if (!config?.isMultiple && assignedSystem.length > 1) {
            errors.assignedSystem = `Part type (${partType}) can only be assigned to one system`;
        }

        const partAssigned = await Parts.findById(partId);

        if (status === 'Unusable') {
            if (Array.isArray(partAssigned.assignedSystem) && partAssigned.assignedSystem.length > 0) {
                errors.unusableReason = 'Cannot mark as Unusable. This part is currently assigned to a system.';
            } else if (!unusableReason?.trim()) {
                errors.unusableReason = 'Unusable reason is required when status is "Unusable".';
            }
        }

        const existingBarcode = await Parts.findOne({ barcode, _id: { $ne: partId } });
        if (existingBarcode) {
            errors.barcode = 'Barcode must be unique';
        }

        const existingSerial = await Parts.findOne({ serialNumber, _id: { $ne: partId } });
        if (existingSerial) {
            errors.serialNumber = 'Serial number must be unique';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const updatedPart = await Parts.findByIdAndUpdate(
            partId,
            {
                partType,
                barcode,
                serialNumber,
                isMultiple,
                brand,
                model,
                specs,
                notes,
                status,
                unusableReason,
                assignedSystem
            },
            { new: true, runValidators: true }
        );

        if (status === "Active") {
            await Parts.updateOne(
                { _id: partId },
                { $unset: { unusableReason: "" } }
            );
        }
        if (!updatedPart) {
            return res.status(404).json({ error: 'Part not found' });
        }

        res.status(200).json({ message: "Updated successfully", updatedPart });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


export const getAllParts = async (req, res) => {
    try {
        const { search = '', status = '', page = 1, limit = 10 } = req.query;
        const query = {
            partType: { $regex: search, $options: 'i' },
        }

        if (status) {
            query.status = status;
        }

        const total = await Parts.countDocuments(query);
        const parts = await Parts.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        if (parts.length == 0) return res.status(404).json({ success: false, message: "No Parts Found", parts: [] });

        return res.json({
            message: "Parts fetched Successfully",
            parts,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const getFreeParts = async (req, res) => {
    try {
        const parts = await Parts.find({
            $or: [
                {
                    isMultiple: true
                },
                {
                    $and: [
                        {
                            isMultiple: false
                        },
                        {
                            assignedSystem: []
                        },
                        {
                            status: 'Active'
                        }
                    ]
                }
            ]
        });

        if (parts.length == 0) return res.status(200).json({ success: true, message: "No Parts Found" });

        res.status(200).json({ success: true, message: "Parts fetched successfully", parts })
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export const markPartUnusable = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const part = await Parts.findByIdAndUpdate(
            id,
            {
                status: "unusable", unusableReason: reason
            },
            { new: true }
        );

        if (!part) return res.status(404).json({ message: "Part not found" });

        return res.status(200).json({ message: "Part marked as unusable", part });
    } catch (err) {
        return res.status(500).json({ message: "Failed to update part", error: err });
    }
}

export const getUnusableParts = async (req, res) => {
    try {
        const parts = await Parts.find({ status: "unusable" });
        if (!parts) return res.status(404).json({ message: "No unusable Parts found" });

        return res.status(200).json({ message: "Unusable Parts fetched success", parts });
    } catch (error) {
        return res.status(500).json({ message: "Failed to unusable fetch parts", error: err });
    }
}

export const restorePart = async (req, res) => {
    try {
        const { id } = req.params;

        const part = await Parts.findByIdAndUpdate(
            id,
            {
                status: "active", unusableReason: null
            },
            { new: true }
        )

        if (!part) return res.status(404).json({ message: "Part not found" });

        return res.status(200).json({ message: "Part restored to active", part });
    } catch (error) {
        return res.status(500).json({ message: "Failed to restore part", error: err });
    }
}

export const deletePartById = async (req, res) => {
    try {
        const { id } = req.params;

        const part = await Parts.findById(id);
        if (!part) return res.status(404).json({ error: "Part not found" });

        await System.updateMany(
            { parts: id },
            { $pull: { parts: id } }
        )

        await Parts.findByIdAndDelete(id);

        return res.status(200).json({ message: "Part deleted successfully" });
    } catch (error) {
        console.error("Delete Part Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};