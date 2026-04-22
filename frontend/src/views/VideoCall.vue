<template>
  <div class="vc-page">
    <!-- 顶部栏 -->
    <div class="vc-header">
      <div class="vc-header-left">
        <div class="vc-status-dot" :class="{ live: streamReady }"></div>
        <span class="vc-status-text">{{ streamReady ? '视频咨询中' : '连接中...' }}</span>
      </div>
      <div class="vc-timer">{{ formatTime(elapsed) }}</div>
      <div class="vc-header-right">
        <span class="vc-partner-name">{{ partnerName }}</span>
      </div>
    </div>

    <!-- 视频区域 -->
    <div class="vc-stage">
      <!-- 远端占位（模拟对方） -->
      <div class="remote-area">
        <div class="remote-avatar-wrap">
          <div class="remote-pulse"></div>
          <div class="remote-avatar">{{ partnerInitial }}</div>
        </div>
        <div class="remote-name">{{ partnerName }}</div>
        <div class="remote-hint">{{ streamReady ? '音频连接中' : '等待接入...' }}</div>
      </div>

      <!-- 本地摄像头（画中画） -->
      <div class="local-pip" :class="{ 'cam-disabled': !camOn }">
        <video ref="localVideoEl" autoplay muted playsinline class="local-video"></video>
        <div v-if="!camOn" class="cam-off-overlay">
          <span class="cam-off-icon">📷</span>
          <span>摄像头已关闭</span>
        </div>
        <div class="local-label">我</div>
      </div>

      <!-- 摄像头权限被拒 -->
      <div v-if="permDenied" class="perm-denied">
        <div class="perm-icon">🚫</div>
        <div class="perm-text">摄像头权限被拒绝，请在浏览器设置中允许后刷新页面</div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="vc-controls">
      <button class="ctrl-btn" :class="{ 'ctrl-off': !micOn }" @click="toggleMic" :title="micOn ? '静音' : '取消静音'">
        <span class="ctrl-icon">{{ micOn ? '🎤' : '🔇' }}</span>
        <span class="ctrl-label">{{ micOn ? '静音' : '取消静音' }}</span>
      </button>

      <button class="ctrl-btn ctrl-hangup" @click="hangup" title="结束通话">
        <span class="ctrl-icon">📞</span>
        <span class="ctrl-label">结束通话</span>
      </button>

      <button class="ctrl-btn" :class="{ 'ctrl-off': !camOn }" @click="toggleCam" :title="camOn ? '关闭摄像头' : '开启摄像头'">
        <span class="ctrl-icon">{{ camOn ? '📹' : '📷' }}</span>
        <span class="ctrl-label">{{ camOn ? '关闭摄像头' : '开启摄像头' }}</span>
      </button>
    </div>

    <!-- 挂断确认弹窗 -->
    <div v-if="showHangupConfirm" class="confirm-mask">
      <div class="confirm-box">
        <div class="confirm-title">结束通话</div>
        <div class="confirm-body">确定要结束本次视频咨询吗？</div>
        <div class="confirm-actions">
          <button class="btn-cancel-call" @click="showHangupConfirm = false">继续通话</button>
          <button class="btn-end-call" :disabled="ending" @click="confirmHangup">
            {{ ending ? '结束中...' : '确认结束' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { counselorApi } from '@/api/counselor'

const route = useRoute()
const router = useRouter()

const role = route.query.role || 'student'
const sessionId = route.query.sessionId || null
const partnerName = route.query.partner || (role === 'counselor' ? '学生' : '咨询师')
const partnerInitial = computed(() => partnerName.charAt(0).toUpperCase())

const localVideoEl = ref(null)
const streamReady = ref(false)
const permDenied = ref(false)
const micOn = ref(true)
const camOn = ref(true)
const elapsed = ref(0)
const showHangupConfirm = ref(false)
const ending = ref(false)

let stream = null
let timerHandle = null

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    if (localVideoEl.value) {
      localVideoEl.value.srcObject = stream
    }
    streamReady.value = true
    timerHandle = setInterval(() => { elapsed.value++ }, 1000)
  } catch (e) {
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      permDenied.value = true
    } else {
      // 降级：无摄像头设备时仅提示
      permDenied.value = true
    }
  }
}

function toggleMic() {
  if (!stream) return
  micOn.value = !micOn.value
  stream.getAudioTracks().forEach(t => { t.enabled = micOn.value })
}

function toggleCam() {
  if (!stream) return
  camOn.value = !camOn.value
  stream.getVideoTracks().forEach(t => { t.enabled = camOn.value })
}

function hangup() {
  showHangupConfirm.value = true
}

async function confirmHangup() {
  ending.value = true
  try {
    // 咨询师负责结束会话
    if (role === 'counselor' && sessionId) {
      await counselorApi.endSession(sessionId)
    }
  } catch {
    // 忽略结束接口错误，继续离开页面
  } finally {
    stopStream()
    if (role === 'counselor' && sessionId) {
      router.replace({ path: `/counselor/sessions/${sessionId}` })
    } else if (role === 'counselor') {
      router.replace('/counselor/appointments')
    } else {
      router.replace('/student/appointments')
    }
  }
}

function stopStream() {
  if (timerHandle) clearInterval(timerHandle)
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
}

onMounted(startCamera)
onBeforeUnmount(stopStream)
</script>

<style scoped>
.vc-page {
  position: fixed;
  inset: 0;
  background: #0f0f1a;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  font-family: inherit;
  color: #fff;
}

/* 顶部栏 */
.vc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.vc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vc-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
  transition: background 0.4s;
}

.vc-status-dot.live {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25); }
  50%       { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1); }
}

.vc-status-text {
  font-size: 13px;
  color: #94a3b8;
}

.vc-timer {
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: #e2e8f0;
}

.vc-partner-name {
  font-size: 13px;
  color: #94a3b8;
}

/* 视频舞台 */
.vc-stage {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: radial-gradient(ellipse at center, #1e1b3a 0%, #0f0f1a 70%);
}

/* 远端占位 */
.remote-area {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.remote-avatar-wrap {
  position: relative;
  width: 100px;
  height: 100px;
}

.remote-pulse {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.3);
  animation: remote-ring 2.4s ease-out infinite;
}

@keyframes remote-ring {
  0%   { transform: scale(0.85); opacity: 0.8; }
  100% { transform: scale(1.3);  opacity: 0; }
}

.remote-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 38px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
  position: relative;
}

.remote-name {
  font-size: 20px;
  font-weight: 600;
  color: #e2e8f0;
}

.remote-hint {
  font-size: 13px;
  color: #64748b;
}

/* 本地摄像头 PiP */
.local-pip {
  position: absolute;
  right: 24px;
  bottom: 100px;
  width: 200px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  background: #1e293b;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transition: opacity 0.2s;
}

.local-pip:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.cam-off-overlay {
  position: absolute;
  inset: 0;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.cam-off-icon { font-size: 22px; }

.local-label {
  position: absolute;
  bottom: 6px;
  left: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 6px;
  border-radius: 4px;
}

/* 权限拒绝提示 */
.perm-denied {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 28px 40px;
}

.perm-icon { font-size: 36px; margin-bottom: 12px; }

.perm-text {
  font-size: 14px;
  color: #fca5a5;
  line-height: 1.6;
  max-width: 300px;
}

/* 控制栏 */
.vc-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px 0 32px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.ctrl-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  cursor: pointer;
  transition: all 0.2s;
  color: #e2e8f0;
  justify-content: center;
  position: relative;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: scale(1.05);
}

.ctrl-btn.ctrl-off {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.ctrl-hangup {
  background: #ef4444;
  border-color: #ef4444;
  width: 72px;
  height: 72px;
  transform: rotate(135deg);
}

.ctrl-hangup:hover {
  background: #dc2626;
  border-color: #dc2626;
  transform: rotate(135deg) scale(1.05);
}

.ctrl-hangup .ctrl-icon,
.ctrl-hangup .ctrl-label {
  transform: rotate(-135deg);
}

.ctrl-icon { font-size: 22px; }

.ctrl-label {
  position: absolute;
  bottom: -22px;
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
}

/* 挂断确认弹窗 */
.confirm-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.confirm-box {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px 40px;
  text-align: center;
  min-width: 320px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.confirm-title {
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 10px;
}

.confirm-body {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 28px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel-call {
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-call:hover { background: rgba(255, 255, 255, 0.14); }

.btn-end-call {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-end-call:hover:not(:disabled) { background: #dc2626; }
.btn-end-call:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
