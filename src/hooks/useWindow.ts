import { WebviewWindow, LogicalSize } from '@tauri-apps/api/window'
import { autoCloseWindow } from '@/common/WindowEvent.ts'
import { invoke } from '@tauri-apps/api/tauri'

export const useWindow = () => {
  /**
   * 创建窗口
   * @param title 窗口标题
   * @param label 窗口名称
   * @param wantCloseWindow 创建后需要关闭的窗口
   * @param width 窗口宽度
   * @param height 窗口高度
   * @param isDrag 是否禁止拖动元素
   * @param resizable 调整窗口大小
   * @param minW 窗口最小宽度
   * @param minH 窗口最小高度
   * */
  const createWebviewWindow = async (
    title: string,
    label: string,
    width: number,
    height: number,
    wantCloseWindow?: string,
    isDrag = true,
    resizable = false,
    minW = 310,
    minH = 540
  ) => {
    const webview = new WebviewWindow(label, {
      title: title,
      url: `/${label}`,
      fullscreen: false,
      resizable: resizable,
      center: true,
      width: width,
      height: height,
      minHeight: minH,
      minWidth: minW,
      skipTaskbar: false,
      decorations: false,
      transparent: true,
      fileDropEnabled: isDrag
    })

    // TODO 这里如果主页刷新页面这样传递过来的label就没有了从而导致isExistsWinds为空的问题 (nyh -> 2024-03-06 06:33:38)
    const isExistsWinds = WebviewWindow.getByLabel(label)
    // TODO 页面刷新后很多状态会丢失，虽然上线打包后可以禁用刷新但难免会有些人会触发刷新，需要解决这个刷新后状态丢失问题 (nyh -> 2024-03-06 06:32:03)
    if (isExistsWinds) {
      // 如果窗口已存在，首先检查是否最小化了
      const minimized = await webview.isMinimized()
      if (minimized) {
        // 如果已最小化，恢复窗口
        await webview.unminimize()
      }
      // 如果窗口已存在，则给它焦点，使其在最前面显示
      await webview.setFocus()
    } else {
      await webview.once('tauri://created', async () => {
        await invoke('reset_set_window', { label }).catch((error) => {
          console.error('设置窗口阴影失败:', error)
        })
        if (wantCloseWindow) {
          await autoCloseWindow(wantCloseWindow)
        }
      })
      return webview
    }
  }

  /**
   * 调整窗口大小
   * @param label 窗口名称
   * @param width 窗口宽度
   * @param height 窗口高度
   * */
  const resizeWindow = async (label: string, width: number, height: number) => {
    const webview = WebviewWindow.getByLabel(label)
    // TODO 使用webview?.setSize重新设置窗口尺寸的时候高度会自动增加20px(bug?) (nyh -> 2024-02-22 03:52:54)
    // 创建一个新的尺寸对象
    const newSize = new LogicalSize(width, height)
    // 调用窗口的 setSize 方法进行尺寸调整
    await webview?.setSize(newSize).catch((error) => {
      console.error('无法调整窗口大小:', error)
    })
  }

  return {
    createWebviewWindow,
    resizeWindow
  }
}
