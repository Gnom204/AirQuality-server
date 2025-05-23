/**
 * Регистрация пользователя
 * @function
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Promise<Object>} - Объект с данными созданного пользователя
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

/**
 * Авторизация пользователя
 * @function
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Promise<Object>} - Объект с данными авторизованного пользователя
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверные учетные данные" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

/**
 * Получение данных пользователя по токену
 * @function
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Promise<Object>} - Объект с данными пользователя
 */
const getUserByToken = async (req, res) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

module.exports = { register, login, getUserByToken };
