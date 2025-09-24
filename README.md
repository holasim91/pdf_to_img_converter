# PDF to Image Converter

고품질 PDF 파일을 벡터 수준의 이미지로 변환하는 웹 애플리케이션입니다.

## 🎯 프로젝트 개요

PDF 파일을 벡터 수준의 고품질 이미지(JPG/PNG)로 변환하는 웹 MVP 애플리케이션입니다. 향후 Tauri를 활용한 크로스플랫폼 네이티브 앱으로 확장 예정입니다.

## ✨ 주요 기능

### 📁 파일 관리
- **다중 파일 배치 처리**: 드래그앤드롭으로 여러 PDF 파일 업로드
- **파일 추가 방식**: 기존 파일을 덮어쓰지 않고 새 파일 추가
- **중복 파일 감지**: 파일명과 크기로 중복 체크 및 알림
- **개별 파일 제거**: 업로드된 파일을 개별적으로 제거 가능

### 🔄 변환 기능
- **고품질 변환**: 벡터 수준 품질 유지 (150/300/450 DPI)
- **형식 선택**: PNG, JPEG 출력 지원
- **실시간 진척률**: 파일별 변환 상태 및 페이지 진행률 표시
- **DPI 정보**: 다운로드 파일명에 DPI 정보 포함

### 📥 다운로드
- **개별 다운로드**: 파일별 ZIP 다운로드
- **일괄 다운로드**: 모든 변환 파일을 하나의 ZIP으로 다운로드
- **스마트 재변환**: 이미 변환된 파일은 건너뛰고 새 파일만 변환

### 🎨 사용자 인터페이스
- **드래그앤드롭**: 전체 메인 영역에서 파일 드롭 가능
- **실시간 상태**: 변환 진행률 시각화
- **반응형 디자인**: 깔끔하고 직관적인 UI
- **SVG 아이콘**: 전용 아이콘 컴포넌트 (생성했으나 현재 미적용)

## 🏗️ 기술 스택

### 프론트엔드
- **React** + **TypeScript**: UI 프레임워크
- **Vite**: 빌드 툴 및 개발 서버
- **PDF.js**: 브라우저 PDF 처리
- **JSZip**: ZIP 파일 생성

### 아키텍처
- **Headless 컴포넌트 패턴**: `usePdfConverter` 훅으로 비즈니스 로직 분리
- **Web Worker**: UI 블로킹 방지 (PDF.js 워커)
- **타입 안전성**: 완전한 TypeScript 적용

## 📦 설치 및 실행

```bash
# 패키지 설치
yarn install

# 개발 서버 실행
yarn dev

# 빌드
yarn build

# 테스트 실행
yarn test

# 테스트 커버리지
yarn test:coverage
```

## 🗂️ 프로젝트 구조

```
src/
├── components/
│   └── icons/              # SVG 아이콘 컴포넌트들(아이콘 뽑은게 너무 구려서 적용은 안함)
│       ├── PdfToImageLogo.tsx
│       ├── UploadIcon.tsx
│       ├── ProgressIcon.tsx
│       ├── DownloadIcon.tsx
│       └── index.ts
├── hooks/
│   └── usePdfConverter.ts  # 핵심 비즈니스 로직
├── utils/
│   ├── pdfWorker.ts        # PDF.js 처리
│   └── downloadUtils.ts    # 다운로드 유틸리티
├── types/
│   └── index.ts            # TypeScript 타입 정의
├── App.tsx                 # 메인 컴포넌트
├── App.css                 # 스타일링
└── main.tsx               # 앱 엔트리포인트
```

## 🧪 테스트

- **Vitest**: 테스트 프레임워크
- **@testing-library/react**: 컴포넌트 테스트
- **높은 테스트 커버리지**: 특히 `downloadUtils` 100% 달성

```bash
# 테스트 실행 (watch 모드)
yarn test

# 커버리지 리포트
yarn test:coverage
```

## 🚀 개발 여정

### Phase 1: 기본 구현
- ✅ PDF.js 통합 및 기본 변환 기능
- ✅ React + TypeScript 프로젝트 설정
- ✅ Vite 빌드 환경 구성

### Phase 2: 아키텍처 개선
- ✅ Headless 컴포넌트 패턴 적용
- ✅ 비즈니스 로직과 UI 분리
- ✅ 타입 안전성 강화

### Phase 3: 기능 확장
- ✅ DPI 옵션 및 파일명 개선
- ✅ 드래그앤드롭 기능
- ✅ 실시간 진행률 표시

### Phase 4: UX 개선
- ✅ 파일 추가 방식으로 변경 (덮어쓰기 → 추가)
- ✅ 중복 파일 감지 및 알림
- ✅ 개별 파일 제거 기능
- ✅ 옵션 변경 시 진행률 초기화

### Phase 5: 테스트 및 최적화
- ✅ 포괄적인 테스트 스위트 구축
- ✅ 드래그앤드롭 버그 수정
- ✅ SVG 아이콘 시스템 구축 (선택적 적용)

## 🎨 SVG 아이콘 시스템

프로젝트에는 전용 SVG 아이콘 컴포넌트들이 포함되어 있습니다:

- **PdfToImageLogo**: PDF→IMG 변환 컨셉 로고
- **UploadIcon**: 드래그앤드롭 업로드 아이콘
- **ProgressIcon**: 동적 원형 진행률 표시
- **DownloadIcon**: ZIP 다운로드 아이콘

```tsx
import { PdfToImageLogo, UploadIcon, ProgressIcon, DownloadIcon } from './components/icons'

// 사용 예시
<PdfToImageLogo size={48} />
<ProgressIcon size={24} progress={75} />
```

## 🔧 기술적 특징

### 메모리 관리
- 페이지별 순차 처리로 메모리 사용량 최적화
- 변환 완료 후 즉시 메모리 해제
- Canvas 객체 재사용으로 효율성 극대화

### 에러 처리
- PDF 로딩 실패 감지
- 페이지 렌더링 오류 처리
- 사용자 친화적 오류 메시지

### 성능 최적화
- Web Worker로 메인 스레드 블로킹 방지
- 이미 변환된 파일 재변환 방지
- 불필요한 리렌더링 최소화

## 🚀 향후 계획

### Phase 2: Tauri 네이티브 앱
- **크로스플랫폼**: Windows, macOS, Linux 지원
- **직접 파일 저장**: 다운로드 없이 지정 경로에 직접 저장
- **배치 처리**: 폴더 드래그앤드롭, 자동 파일 정리
- **시스템 통합**: 컨텍스트 메뉴, 파일 연결

### 데스크톱 버전 개선점
```
📂 사용자 지정 경로
├── 📁 document_01/
│   ├── page_001_300dpi.png
│   ├── page_002_300dpi.png
│   └── page_003_300dpi.png
├── 📁 document_02/
│   ├── page_001_300dpi.png
│   └── page_002_300dpi.png
└── 📁 all_converted_files.zip (선택사항)
```

## 🐛 알려진 이슈

- 일부 테스트 케이스에서 타입 불일치 경고 (기능상 문제없음)
- 대용량 PDF 파일 처리 시 브라우저 메모리 제한

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의나 제안이 있으시면 이슈를 생성해 주세요.

---

**Made with ❤️ using React + PDF.js**
