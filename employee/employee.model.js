import mongoose, { Schema } from "mongoose";

const employeeSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    employeeID:{
        type: Number,
        required: [true, "Employee ID is required"],
        unique: true
    },
    department: {
        type: String,
        required: [true, "Department is required"]
    },
    designation: {
        type: String,
        required: [true, "Designation is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        index: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email address"
        ]
    },
    phone: {
        type: Number,
        required: [true, "Phone number is required"],
        unique: true
    },
    allocatedSys:{
        type: Schema.Types.ObjectId, 
        ref:'System'
    }
}, {timestamps: true})

export default mongoose.model('Employee', employeeSchema);