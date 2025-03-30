const Location = require("../models/Location");
const upload = require("../config/multer");
const fs = require("fs");
const path = require("path");
const uploadImage = upload.single("image");

const addData = async (req, res) => {
  const { name, temperature, humidity, sound, dust, gas } = req.body;
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      body: req.body,
      ip: req.ip,
    };

    await fs.promises.appendFile(
      path.join(__dirname, "requests.log"),
      JSON.stringify(logEntry) + "\n"
    );

    next();
  } catch (err) {
    console.error("Ошибка записи лога:", err);
    next();
  }
  try {
    // Поиск существующей локации
    const existingLocation = await Location.findOne({ name });

    if (existingLocation) {
      // Обновление существующей записи
      const updatedLocation = await Location.findOneAndUpdate(
        { name },
        {
          $push: {
            temperature: temperature,
            humidity: humidity,
            sound: sound,
            dust: dust,
            gas: gas,
          },
        },
        { new: true } // Возвращает обновленный документ
      );
      return res.json(updatedLocation);
    }

    // Создание новой записи
    const location = new Location({
      name,
      temperature: [temperature],
      humidity: [humidity],
      sound: [sound],
      dust: [dust],
      gas: [gas],
    });

    await location.save();
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
const updateLocation = async (req, res) => {
  console.log("hype");
  try {
    // Предполагается, что используется multer с именем поля 'image'
    const updateData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : undefined,
    };
    console.log(updateData);
    const location = await Location.findOneAndUpdate(
      { name: req.body.name },
      { $set: updateData },
      { new: true }
    );
    console.log(location);
    res.json(location);
  } catch (err) {
    console.log(err);
    console.error("Ошибка обновления:", err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateDescription = async (req, res) => {
  try {
    const { name, description } = req.body;
    const location = await Location.findOneAndUpdate(
      { name },
      { description },
      { new: true }
    );
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const starsRate = async (req, res) => {
  try {
    const { name, stars } = req.body;
    const userId = req.user.id;

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Invalid stars rate" });
    }

    const location = await Location.findOneAndUpdate(
      { name, usersRated: { $ne: userId } },
      { $push: { starsRatings: stars, usersRated: userId } },
      { new: true }
    );

    if (!location) {
      return res.status(400).json({ message: "User has already rated" });
    }

    res.json(location);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    res.json({ message: "Location deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  uploadImage,
  addData,
  updateLocation,
  getLocations,
  getLocation,
  starsRate,
  deleteLocation,
  updateDescription,
};
