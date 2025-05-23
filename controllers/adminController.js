/**
 * Повышает пользователя до администратора
 * @function
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Promise<Object>} - Объект с данными пользователя
 */
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true }
    );

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    res.json({ message: "Пользователь повышен до администратора", user });
  } catch (err) {
    res.status(500).json({ message: "Ошибка сервера" });
  }
};
