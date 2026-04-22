const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { User, StudentProfile, CounselorProfile, Appointment, Session, Feedback, Announcement } = require('../models');

// ── 数据统计 ────────────────────────────────────────────────────────────────

/**
 * 获取平台总览统计
 */
async function getStats() {
  const [studentCount, counselorCount, appointmentCount, sessionCount, avgRating] =
    await Promise.all([
      User.count({ where: { role: 'student', isActive: 1 } }),
      User.count({ where: { role: 'counselor', isActive: 1 } }),
      Appointment.count(),
      Session.count({ where: { status: 'completed' } }),
      Feedback.findOne({
        attributes: [[fn('AVG', col('rating')), 'avgRating']],
        raw: true,
      }),
    ]);

  return {
    studentCount,
    counselorCount,
    appointmentCount,
    completedSessionCount: sessionCount,
    avgRating: avgRating?.avgRating ? parseFloat(Number(avgRating.avgRating).toFixed(2)) : null,
  };
}

// ── 咨询师管理 ──────────────────────────────────────────────────────────────

/**
 * 获取咨询师列表（含扩展档案，分页）
 */
async function getCounselors({ page = 1, pageSize = 20 } = {}) {
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where: { role: 'counselor' },
    attributes: ['id', 'username', 'email', 'isActive', 'avatarUrl', 'lastLoginAt', 'createdAt'],
    include: [{
      model: CounselorProfile,
      as: 'counselorProfile',
      attributes: ['realName', 'title', 'specialties', 'isAccepting', 'maxAppointmentsPerDay'],
      required: false,
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    total: count,
    page: parseInt(page) || 1,
    pageSize: limit,
    list: rows.map(r => r.toJSON()),
  };
}

/**
 * 添加咨询师账号
 * @param {object} data - { username, email, password, realName }
 */
async function createCounselor({ username, email, password, realName }) {
  if (!username || !email || !password) {
    const err = new Error('username、email、password 为必填项');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('该邮箱已被注册');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    email,
    passwordHash,
    role: 'counselor',
    isActive: 1,
  });

  // 若提供了 realName，同时创建档案
  if (realName) {
    await CounselorProfile.create({ userId: user.id, realName });
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * 启用 / 禁用咨询师账号
 * @param {number} counselorId - 目标咨询师的 user.id
 * @param {boolean} isActive
 */
async function updateCounselorStatus(counselorId, { isActive }) {
  if (typeof isActive !== 'boolean' && isActive !== 0 && isActive !== 1) {
    const err = new Error('isActive 须为布尔值');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ where: { id: counselorId, role: 'counselor' } });
  if (!user) {
    const err = new Error('咨询师不存在');
    err.status = 404;
    throw err;
  }

  await user.update({ isActive: isActive ? 1 : 0 });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
  };
}

// ── 公告管理 ────────────────────────────────────────────────────────────────

/**
 * 获取公告列表（管理端：含草稿）
 * @param {object} options - { page, pageSize, status: 'draft'|'published'|'all' }
 */
async function getAnnouncements({ page = 1, pageSize = 20, status = 'all' } = {}) {
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const where = {};
  if (status === 'draft') {
    where.publishedAt = null;
  } else if (status === 'published') {
    // 已发布
    where.publishedAt = { [Op.ne]: null };
  }

  const { count, rows } = await Announcement.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username'],
    }],
    order: [
      ['isPinned', 'DESC'],
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  });

  return {
    total: count,
    page: parseInt(page) || 1,
    pageSize: limit,
    list: rows.map(r => r.toJSON()),
  };
}

/**
 * 创建公告（支持草稿 publish=false，立即发布 publish=true）
 */
async function createAnnouncement(authorId, { title, content, targetRole, isPinned, publish, expiresAt }) {
  if (!title || !content) {
    const err = new Error('title 和 content 为必填项');
    err.status = 400;
    throw err;
  }

  const announcement = await Announcement.create({
    authorId,
    title,
    content,
    targetRole: targetRole || 'all',
    isPinned: isPinned ? 1 : 0,
    publishedAt: publish ? new Date() : null,
    expiresAt: expiresAt || null,
  });

  return announcement.toJSON();
}

/**
 * 删除公告
 */
async function deleteAnnouncement(announcementId) {
  const announcement = await Announcement.findByPk(announcementId);
  if (!announcement) {
    const err = new Error('公告不存在');
    err.status = 404;
    throw err;
  }

  await announcement.destroy();
  return { id: announcementId };
}

// ── 图表统计 ────────────────────────────────────────────────────────────────

const TOPIC_LABELS = {
  academic_pressure: '学业压力',
  relationship_issues: '情感问题',
  interpersonal: '人际关系',
  family_issues: '家庭问题',
  career_anxiety: '就业焦虑',
  mental_health: '心理健康',
  other: '其他',
};

/**
 * 各咨询师预约量（饼图数据）
 */
async function getCounselorAppointmentStats() {
  const countRows = await Appointment.findAll({
    attributes: ['counselorId', [fn('COUNT', col('id')), 'count']],
    group: ['counselorId'],
    raw: true,
  });
  if (!countRows.length) return [];

  const ids = countRows.map(r => r.counselorId);
  const users = await User.findAll({
    where: { id: ids },
    attributes: ['id', 'username'],
    include: [{ model: CounselorProfile, as: 'counselorProfile', attributes: ['realName'], required: false }],
  });
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.toJSON(); });

  return countRows.map(r => {
    const u = userMap[r.counselorId];
    const name = u?.counselorProfile?.realName || u?.username || `咨询师${r.counselorId}`;
    return { name, value: parseInt(r.count) };
  });
}

/**
 * 预约量 Top 10 学生（柱状图数据）
 */
async function getStudentAppointmentStats() {
  const countRows = await Appointment.findAll({
    attributes: ['studentId', [fn('COUNT', col('id')), 'count']],
    group: ['studentId'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: 10,
    raw: true,
  });
  if (!countRows.length) return [];

  const ids = countRows.map(r => r.studentId);
  const users = await User.findAll({
    where: { id: ids },
    attributes: ['id', 'username'],
    include: [{ model: StudentProfile, as: 'studentProfile', attributes: ['realName', 'studentNo'], required: false }],
  });
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.toJSON(); });

  return countRows.map(r => {
    const u = userMap[r.studentId];
    const name = u?.studentProfile?.realName || u?.username || `学生${r.studentId}`;
    const studentNo = u?.studentProfile?.studentNo || '';
    return { name: studentNo ? `${name}(${studentNo})` : name, count: parseInt(r.count) };
  });
}

/**
 * 咨询话题分布（饼图数据）
 */
async function getTopicStats() {
  const rows = await Appointment.findAll({
    attributes: [
      'topic',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['topic'],
    raw: true,
  });

  return rows.map(r => ({
    name: TOPIC_LABELS[r.topic] || r.topic || '其他',
    value: parseInt(r.count),
  }));
}

module.exports = {
  getStats,
  getCounselors,
  createCounselor,
  updateCounselorStatus,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getCounselorAppointmentStats,
  getStudentAppointmentStats,
  getTopicStats,
};
