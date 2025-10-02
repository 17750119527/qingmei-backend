require('dotenv').config(); // 读取环境变量

module.exports = {
  db: {
    host: 'localhost',
    user: 'root',         // MySQL用户名（默认root）
    password: '123456',  // 替换为你的MySQL密码
    database: 'qingmei_platform'  // 数据库名
  },
  jwtSecret: '123456'  // 生成令牌的密钥（自己随便设一个字符串）
};