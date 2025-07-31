import mongoose, { Schema } from "mongoose";

const logSchema = new Schema({
    actionType: {
        type: String,
        required: true
    },
    entity: {
        type: String,
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        ref: 'System',
        required: false
    },
    performedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    details: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Log", logSchema);