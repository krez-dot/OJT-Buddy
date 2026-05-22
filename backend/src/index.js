const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/companies');
const documentRoutes = require('./routes/documents');
const logbookRoutes = require('./routes/logbook');
const interviewRoutes = require('./routes/interview');
const shareRoutes = require('./routes/shares');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/logbook', logbookRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/shares', shareRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
