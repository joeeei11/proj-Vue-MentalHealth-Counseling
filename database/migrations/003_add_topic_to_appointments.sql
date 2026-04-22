-- 003_add_topic_to_appointments.sql
-- 为 appointments 表添加结构化话题字段，用于管理端话题分布统计

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS topic ENUM(
    'academic_pressure',
    'relationship_issues',
    'interpersonal',
    'family_issues',
    'career_anxiety',
    'mental_health',
    'other'
  ) DEFAULT 'other' AFTER reason;
