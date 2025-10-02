const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const config = require('./config');

const app = express();
const PORT = 3000;

app.options(/^\/.*$/, (req, res) => {
  // 设置跨域响应头
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // 强制返回200状态码
  res.status(200).end();
});

// 2. 配置CORS中间件
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  credentials: true
}));

// 3. 解析JSON请求体
app.use(express.json());
// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // 检查用户名是否已存在
    const [users] = await pool.query(
      'SELECT * FROM users WHERE phone = ?',  // 字段名改为 phone
      [phone]  // 参数从 username 改为 phone
    );
    if (users.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码（安全存储）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 存入数据库
    await pool.query(
      'INSERT INTO users (phone, password) VALUES (?, ?)',  // 字段名改为 phone
      [phone, hashedPassword]  // 参数从 username 改为 phone
    );

    res.status(201).json({ message: '注册成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录接口
// 登录接口（修改后，与注册接口字段对齐）
app.post('/api/login', async (req, res) => {
  try {
    // 1. 关键：从前端请求中获取 phone 和 password（不再是 username）
    const { phone, password } = req.body; 
    // ↑↑↑ 这里必须改成 phone，否则会提示 "phone is not defined"

    // 2. 查找数据库中是否存在该手机号（SQL 字段改为 phone）
    const [users] = await pool.query(
      'SELECT * FROM users WHERE phone = ?', 
      [phone] 
    );
    // 如果手机号不存在，返回错误
    if (users.length === 0) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }

    // 3. 验证密码（逻辑不变，因为 password 字段没改）
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '手机号或密码错误' });
    }

    // 4. 生成登录令牌（逻辑不变）
    const token = jwt.sign(
      { userId: user.id, phone: user.phone }, // 可选：将 phone 存入令牌（原先是 username）
      config.jwtSecret,
      { expiresIn: '24h' }
    );

	console.log('生成的登录 token：', token); // 后端打印 token

    // 5. 返回登录成功结果（返回 phone 而不是 username，与前端显示对齐）
    res.json({ 
      message: '登录成功', 
      token, 
      user: { id: user.id, phone: user.phone } 
    });
  } catch (err) {
    console.error('登录接口错误：', err);
    res.status(500).json({ message: '服务器错误' });
  }
});
// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});