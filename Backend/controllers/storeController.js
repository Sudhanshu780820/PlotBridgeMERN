// controllers/plotController.js
const Plot = require('../models/Plot');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// The same helper function we used in authController
const uploadBufferToCloudinary = (buffer, folderName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const createPlot = async (req, res) => {
  try {
    // 1. Grab all the text data sent from React
    const { title, price, currency, category, size, unit, location, description, lat, lng } = req.body;

    // 2. Upload all images to Cloudinary
    let uploadedImageUrls = [];
    
    // Check if the user attached any files
    if (req.files && req.files.length > 0) {
      // Loop through the array of files Multer caught
      for (const file of req.files) {
        const url = await uploadBufferToCloudinary(file.buffer, "PlotBridge/Plots");
        uploadedImageUrls.push(url);
      }
    }

    // 3. Save the new plot to MongoDB with the Cloudinary URLs
    const newPlot = new Plot({
      title,
      price,
      currency,
      category,
      size,
      unit,
      location,
      description,
      lat,
      lng,
      images: uploadedImageUrls, // Save the array of URLs here!
      seller: req.user.id // Assuming your auth middleware attaches the user ID
    });

    await newPlot.save();

    res.status(201).json({ success: true, message: "Plot created successfully!", plot: newPlot });

  } catch (error) {
    console.error("Error creating plot:", error);
    res.status(500).json({ success: false, message: "Server error while saving plot." });
  }
};

module.exports = { createPlot };