// 환경에 따라 다른 텍스트를 반환하는 유틸리티

// Tauri 환경 감지 함수 - 다양한 방법으로 시도
export const isTauriEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false

  // 방법 1: window.__TAURI_INTERNALS__ 체크 (Tauri v2에서 더 안정적)
  if ((window as any).__TAURI_INTERNALS__) {
    return true
  }

  // 방법 2: window.__TAURI__ 체크 (전통적 방법)
  if ((window as any).__TAURI__) {
    return true
  }

  // 방법 3: User Agent 문자열 체크
  if (navigator.userAgent.includes('Tauri')) {
    return true
  }

  // 방법 4: 특정 Tauri 글로벌 함수 체크
  if (typeof (window as any).__TAURI_INVOKE__ !== 'undefined') {
    return true
  }

  // 방법 5: window.location.protocol 체크
  if (window.location.protocol === 'tauri:' || window.location.protocol.startsWith('tauri')) {
    return true
  }

  // 방법 6: 모든 window 프로퍼티에서 TAURI 관련 키 찾기
  const tauriKeys = Object.getOwnPropertyNames(window).filter(key =>
    key.includes('TAURI') || key.includes('tauri')
  )
  if (tauriKeys.length > 0) {
    return true
  }

  return false
}

// 개별 파일 저장/다운로드 버튼 텍스트
export const getSaveButtonText = (imageCount: number): string => {
  // 매번 환경을 다시 체크 (Tauri 객체가 나중에 로드될 수 있음)
  const isTauri = isTauriEnvironment()
  const action = isTauri ? 'Save' : 'Download'
  return `${action} (${imageCount} images)`
}

// 전체 파일 저장/다운로드 버튼 텍스트
export const getSaveAllButtonText = (): string => {
  // 매번 환경을 다시 체크 (Tauri 객체가 나중에 로드될 수 있음)
  const isTauri = isTauriEnvironment()
  const action = isTauri ? 'Save All as ZIP' : 'Download All as ZIP'
  return action
}