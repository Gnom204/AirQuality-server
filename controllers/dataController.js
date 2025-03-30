const Location = require("../models/Location");
const upload = require("../config/multer");
const fs = require("fs");
const path = require("path");
const uploadImage = upload.single("image");

const addData = async (req, res) => {
  try {
    // Логирование запроса
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

    // Валидация входящих данных
    const { name, temperature, humidity, sound, dust, gas } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Valid name is required" });
    }

    // Подготовка данных для обновления
    const updates = {};
    const sensors = [
      { field: "temperature", value: temperature },
      { field: "humidity", value: humidity },
      { field: "sound", value: sound },
      { field: "dust", value: dust },
      { field: "gas", value: gas },
    ];

    // Формируем объект для $push
    sensors.forEach(({ field, value }) => {
      if (typeof value === "number" && !isNaN(value)) {
        updates[field] = value;
      }
    });

    // Поиск существующей записи
    const existingLocation = await Location.findOne({ name });

    if (existingLocation) {
      // Создаем объект для $push операций
      const pushOperations = {};
      Object.entries(updates).forEach(([field, value]) => {
        pushOperations[field] = value;
      });

      // Обновляем только сенсорные данные
      const updatedLocation = await Location.findOneAndUpdate(
        { name },
        { $push: pushOperations },
        {
          new: true,
          runValidators: true,
          select: "-usersRated -starsRatings -description -image", // Исключаем не изменяемые поля
        }
      );

      return res.json(updatedLocation);
    }

    // Создание новой записи с учетом схемы по умолчанию
    const newLocationData = {
      name,
      ...Object.fromEntries(
        sensors
          .filter(({ value }) => typeof value === "number" && !isNaN(value))
          .map(({ field, value }) => [field, [value]])
      ),
    };

    const location = new Location(newLocationData);
    await location.save();

    return res.status(201).json(
      location.toObject({
        transform: (doc, ret) => {
          delete ret.usersRated;
          delete ret.starsRatings;
          return ret;
        },
      })
    );
  } catch (err) {
    console.error("Error processing request:", err);

    const statusCode = err.name === "ValidationError" ? 400 : 500;
    const message =
      statusCode === 400
        ? `Validation error: ${err.message}`
        : "Internal server error";

    const response = {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    };

    return res.status(statusCode).json(response);
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
