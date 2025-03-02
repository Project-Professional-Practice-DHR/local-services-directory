const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema(
    {
        provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        category: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        location: { type: String, required: true },
        availability: { type: String, required: true },
        ratings: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);