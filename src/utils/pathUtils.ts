import { isTauriEnvironment } from './textUtils'

// Tauri API wrapper for path operations - 이미 downloadUtils에서 검증된 패턴 사용
let tauriApi: any = null

// Tauri API 초기화 - 직접 import 시도
const initTauriApi = async () => {
  console.log('=== Path Utils Tauri API 직접 import 시도 ===')
  console.log('window.__TAURI_INTERNALS__ type:', typeof (window as any).__TAURI_INTERNALS__)

  try {
    // Tauri 환경에서만 시도
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      console.log('Tauri 환경 확인됨. 직접 import 시작...')

      // 직접 import 시도
      const { open } = await import('@tauri-apps/plugin-dialog')

      tauriApi = {
        dialog: { open }
      }

      console.log('✅ Tauri Dialog API 직접 import 성공!')
    } else {
      console.log('❌ Tauri 환경이 아님')
    }
  } catch (error) {
    console.log('❌ 직접 import 실패:', error)

    // 웹 환경에서는 에러가 당연하므로 조용히 넘어감
    if (typeof (window as any).__TAURI_INTERNALS__ !== 'undefined') {
      console.log('Tauri 환경인데도 import 실패 - 다른 방법 필요')
    }
  }
}

// 사용자에게 저장 폴더를 선택하게 하는 함수 (Tauri에서만 작동)
export const selectSaveDirectory = async (): Promise<string | null> => {
  console.log('=== selectSaveDirectory 호출됨 ===')
  console.log('현재 URL:', window.location.href)
  console.log('User Agent:', navigator.userAgent)
  console.log('window.__TAURI__ 존재여부:', typeof (window as any).__TAURI__)
  console.log('isTauriEnvironment():', isTauriEnvironment())

  // Tauri v2에서는 http://localhost도 사용하므로 다른 방법으로 확인
  // window.__TAURI_INTERNALS__ 또는 다른 Tauri 관련 객체가 있는지 확인
  const hasTauriInternals = typeof (window as any).__TAURI_INTERNALS__ !== 'undefined'
  const hasTauriInvoke = typeof (window as any).__TAURI_INVOKE__ !== 'undefined'
  const isTauriUserAgent = navigator.userAgent.includes('Tauri')

  console.log('Tauri 환경 확인:')
  console.log('- __TAURI_INTERNALS__:', hasTauriInternals)
  console.log('- __TAURI_INVOKE__:', hasTauriInvoke)
  console.log('- User Agent에 Tauri 포함:', isTauriUserAgent)

  if (!hasTauriInternals && !hasTauriInvoke && !isTauriUserAgent) {
    console.log('❌ 웹 브라우저에서 실행 중 - Tauri 관련 객체 없음')
    alert('이 기능은 Tauri 데스크톱 앱에서만 사용 가능합니다.\n\n터미널에서 다음 명령어로 데스크톱 앱을 실행하세요:\nsource ~/.cargo/env && npx tauri dev')
    return null
  }

  // __TAURI_INTERNALS__가 있으면 바로 API 로딩 시도
  console.log('🔄 Tauri API 최종 확인...')
  await initTauriApi()

  if (!tauriApi) {
    console.log('⏳ 1초 후 한 번 더 시도...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    await initTauriApi()
  }

  if (!tauriApi) {
    console.log('❌ Tauri API 로드 실패')
    alert('폴더 선택 API 로딩에 실패했습니다.\n페이지를 새로고침하고 다시 시도해주세요.')
    return null
  }

  if (!isTauriEnvironment()) {
    console.log('❌ Tauri 환경이 아님 - 브라우저 환경')
    return null
  }

  // 재시도 로직 - 몇 번만 더 시도
  console.log('🔄 Tauri API 최종 확인...')
  if (!tauriApi) {
    console.log('⏳ 1초 후 한 번 더 시도...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    await initTauriApi()
  }

  if (!tauriApi) {
    console.log('❌ Tauri API 로드 실패')
    alert('폴더 선택 기능을 사용할 수 없습니다.\n Tauri 앱에서 다시 시도해주세요.')
    return null
  }

  console.log('✅ Tauri API 사용 가능!')

  try {
    const directory = await tauriApi.dialog.open({
      directory: true,
      multiple: false,
      title: 'Select Save Directory'
    })

    return typeof directory === 'string' ? directory : null
  } catch (error) {
    console.error('Failed to select directory:', error)
    return null
  }
}

// 기본 저장 경로 가져오기 - 간단히 null 반환 (시스템 기본값 사용)
export const getDefaultSavePath = async (): Promise<string | null> => {
  // 복잡한 path API 대신 간단히 null 반환하여 시스템 기본값 사용
  return null
}

// 경로 설정을 localStorage에 저장/로드
const SAVE_PATH_KEY = 'pdf_converter_save_path'

export const savePath = (path: string): void => {
  try {
    localStorage.setItem(SAVE_PATH_KEY, path)
  } catch (error) {
    console.error('Failed to save path to localStorage:', error)
  }
}

export const loadSavedPath = (): string | null => {
  console.log('LOAD SAVED PATH')
  try {
    const tmp =  localStorage.getItem(SAVE_PATH_KEY)
    console.log(tmp, ';;;;;;;;;;;;;;;;;;;;;;;;;')
    return localStorage.getItem(SAVE_PATH_KEY)
  } catch (error) {
    console.error('Failed to load path from localStorage:', error)
    return null
  }
}

export const clearSavedPath = (): void => {
  try {
    localStorage.removeItem(SAVE_PATH_KEY)
  } catch (error) {
    console.error('Failed to clear path from localStorage:', error)
  }
}

// 사용자 설정 경로가 있으면 그것을, 없으면 기본 경로를 반환
export const getPreferredSavePath = async (): Promise<string | null> => {
  const savedPath = loadSavedPath()
  console.log('🔍 getPreferredSavePath - localStorage에서 가져온 경로:', savedPath)

  if (savedPath) {
    console.log('✅ 저장된 경로 사용:', savedPath)
    return savedPath
  }

  const defaultPath = await getDefaultSavePath()
  console.log('🔍 기본 경로 사용:', defaultPath)
  return defaultPath
}

// Initialize immediately when module loads to debug (downloadUtils와 동일한 패턴)
if (typeof window !== 'undefined') {
  console.log('💡 pathUtils.ts 모듈이 로드됨')
  initTauriApi().then(() => {
    console.log('💡 pathUtils initTauriApi 완료')
  }).catch((error) => {
    console.error('💡 pathUtils initTauriApi 실패:', error)
  })
}