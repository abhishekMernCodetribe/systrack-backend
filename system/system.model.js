import mongoose, { Schema } from "mongoose";

const systemSchema = mongoose.Schema(
    {
        name: {
            type: String,
            unique: true
        },
        parts: [{
            type: Schema.Types.ObjectId,
            ref: 'Parts'
        }],
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            default: null
        },
        status: {
            type: String,
            enum: ["assigned", "unassigned", "deallocated"],
            default: "unassigned"
        }
    },
    { timestamps: true })

export default mongoose.model("System", systemSchema);