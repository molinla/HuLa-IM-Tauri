<template>
  <n-config-provider :theme="lightTheme" data-tauri-drag-region class="login-box size-full rounded-8px select-none">
    <!--顶部操作栏-->
    <ActionBar :max-w="false" :shrink="false" />

    <n-flex justify="center" class="mt-15px">
      <img src="@/assets/logo/hula.png" class="w-140px h-60px" alt="" />
    </n-flex>

    <!-- 二维码 -->
    <n-flex justify="center" class="mt-25px">
      <n-skeleton v-if="loading" style="border-radius: 12px" :width="204" :height="204" :sharp="false" size="medium" />
      <n-qr-code
        v-else
        :size="180"
        class="rounded-12px relative"
        :class="{ blur: scanSuccess }"
        :value="QRCode"
        icon-src="/logo.png"
        error-correction-level="H" />
      <n-flex
        v-if="scanSuccess"
        vertical
        :size="12"
        align="center"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <svg class="size-42px"><use href="#success"></use></svg>
        <span class="text-(16px #e3e3e3)">扫码成功</span>
      </n-flex>
    </n-flex>

    <n-flex justify="center" class="mt-15px text-(14px #808080)">{{ loadText }}</n-flex>

    <!-- 顶部操作栏 -->
    <n-flex justify="center" class="text-14px mt-48px">
      <div class="color-#13987f cursor-pointer" @click="toLogin">账密登录</div>
      <div class="w-1px h-14px bg-#ccc"></div>
      <div class="color-#13987f cursor-pointer">注册账号</div>
    </n-flex>
  </n-config-provider>
</template>
<script setup lang="ts">
import router from '@/router'
import { delay } from 'lodash-es'
import { lightTheme } from 'naive-ui'
import { initWebSocket, sendToServer } from '@/services/webSocket.ts'
import { WsReqEnum, WsResEnum } from '@/enums'
import Mitt from '@/utils/Bus.ts'
import { setting } from '@/stores/setting.ts'
import { useLogin } from '@/hooks/useLogin.ts'
import { useWindow } from '@/hooks/useWindow.ts'

const settingStore = setting()
const { setLoginState } = useLogin()
const { createWebviewWindow } = useWindow()
const loading = ref(true)
const loadText = ref('加载中...')
const QRCode = ref()
const scanSuccess = ref(false)

const toLogin = () => {
  router.push('/login')
}
// TODO 做一个二维码过期时间重新刷新二维码的功能 (nyh -> 2024-01-27 00:37:18)
onMounted(() => {
  initWebSocket()
  Mitt.on(WsResEnum.QRCODE_LOGIN, (e: any) => {
    QRCode.value = e.data.loginUrl
    loading.value = false
    loadText.value = '请使用微信扫码登录'
  })
  Mitt.on(WsResEnum.LOGIN_SUCCESS, (e: any) => {
    scanSuccess.value = true
    loadText.value = '登录中...'
    delay(async () => {
      await createWebviewWindow('HuLa', 'home', 960, 720, 'login', false, true)
      settingStore.setAccountInfo({
        avatar: e.data.avatar,
        name: e.data.name,
        uid: e.data.uid
      })
      await setLoginState()
    }, 1000)
  })
  delay(() => {
    sendToServer({ type: WsReqEnum.LOGIN })
  }, 1000)
})
</script>

<style scoped lang="scss">
@import '@/styles/scss/global/login-bg';
:deep(.hover-box) {
  @apply w-28px h24px flex-center hover:bg-#e7e7e7;
  svg {
    color: #404040;
  }
}
:deep(.action-close) {
  svg {
    color: #404040;
  }
}
</style>
