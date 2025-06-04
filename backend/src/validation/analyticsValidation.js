const Joi = require('joi');

// Define the date range schema
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),  // Ensure it's a valid date in ISO format
  endDate: Joi.date().iso().required(),    // Ensure it's a valid date in ISO format
});

module.exports = { dateRangeSchema };