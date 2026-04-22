-- 为预约表添加会议链接字段（线上视频咨询使用外部链接）
ALTER TABLE appointments
  ADD COLUMN meeting_link VARCHAR(500) NULL DEFAULT NULL
  AFTER cancel_reason;
