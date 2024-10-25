const pool = require('../db/db');

exports.detectImage = async (req, res) => {
    const userId = req.user.userId;
    const [user] = pool.execute('SELECT user_calls FROM User WHERE id = ?', [userId]);
    const remainingCalls = user[0].user_calls;

    if (remainingCalls === 0) {

    }
}