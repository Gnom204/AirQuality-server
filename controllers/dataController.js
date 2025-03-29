const Location = require("../models/Location");
const upload = require("../config/multer");

const uploadImage = upload.single("image");

const addData = async (req, res) => {
  try {
    // Парсинг параметров из URL
    const paramsString = decodeURIComponent(req.params.params);
    const params = new URLSearchParams(paramsString);

    // Валидация
    const name = params.get("name");
    if (!name) return res.status(400).json({ error: "Name is required" });

    // Подготовка данных для обновления
    const update = { $push: {} };
    const fields = ["temperature", "humidity", "sound", "dust", "gas"];

    fields.forEach((field) => {
      const value = params.get(field);
      if (value && !isNaN(value)) {
        update.$push[field] = parseFloat(value);
      }
    });

    // Проверка наличия данных
    if (Object.keys(update.$push).length === 0) {
      return res.status(400).json({ error: "No valid data provided" });
    }

    // Обновление или создание записи
    const result = await Location.findOneAndUpdate({ name }, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    res.json({
      [result.name]: {
        temperature: result.temperature,
        humidity: result.humidity,
        sound: result.sound,
        dust: result.dust,
        gas: result.gas,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ error: "Location already exists" });
    }
    res.status(500).json({ error: "Server error" });
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

    const location = await Location.findOneAndUpdate(
      { name: req.body.name },
      { $set: updateData },
      { new: true }
    );

    res.json(location);
  } catch (err) {
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

module.exports = {
  uploadImage,
  addData,
  updateLocation,
  getLocations,
  getLocation,
  starsRate,
  updateDescription,
};
