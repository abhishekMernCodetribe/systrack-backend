import mongoose, { Schema } from "mongoose";

export const partTypesConfig = {
    RAM: {
        isMultiple: false
    },
    CPU: {
        isMultiple: false
    },
    HDD: {
        isMultiple: false
    },
    SSD: {
        isMultiple: false
    },
    Monitor: {
        isMultiple: false
    },
    Printer: {
        isMultiple: true,
    },
    Headphone: {
        isMultiple: true
    }
};

const validPartTypes = Object.keys(partTypesConfig);

const partSchema = mongoose.Schema({
    partType: {
        type: String,
        required: true,
        enum: validPartTypes
    },
    isMultiple: {
        type: Boolean,
        required: true,
        default: false
    },
    barcode: {
        type: String,
        required: true,
        unique: true,
    },
    barcodeImage: {
        type: String,
        default: ''
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true,
    },
    specs: {
        type: [
            {
                key: {
                    type: String,
                    required: true
                },
                value: {
                    type: String,
                    required: true
                }
            }
        ],
        default: []
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Unusable'],
        default: 'Active'
    },
    unusableReason: {
        type: String,
        default: null,
    },
    assignedSystem: [
        {
            type: Schema.Types.ObjectId,
            ref: "System"
        }
    ]
}, { timestamps: true });

export default mongoose.model('Parts', partSchema);