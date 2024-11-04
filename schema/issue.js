const mongoose = require("mongoose")


const Patient_Problem = new mongoose.Schema({
    issue: {
        type: String,
    },
    description: {
        type: String,
    },
    createdby_: {
        type: String,
    },
    healthcareName: {
        type: String,
    },
    medical_severity: {
        type: String,
    },
    created_at: {
        type: String,
        default: new Date(),
    }
})

module.exports = mongoose.model("issues", Patient_Problem)