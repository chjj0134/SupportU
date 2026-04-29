# Convention

SupportU 프로젝트의 Git 브랜치 전략, 커밋 규칙, Pull Request 규칙을 정리한 문서입니다.

## 1. Branch Strategy

브랜치는 아래 구조로 관리합니다.

- main: 최종 제출 및 배포용 브랜치
- develop: 개발 통합 브랜치
- feature/*: 기능별 작업 브랜치

## 2. Branch Rule

### main

main 브랜치는 최종 제출 및 배포용 브랜치입니다.

- 직접 push하지 않습니다.
- 개발 작업은 main에서 진행하지 않습니다.
- develop 브랜치에서 충분히 테스트한 뒤 Pull Request로 병합합니다.
- 최종 배포 시점에만 사용합니다.

### develop

develop 브랜치는 개발 중인 기능을 통합하는 브랜치입니다.

- feature 브랜치에서 작업한 기능을 develop으로 병합합니다.
- 팀원들이 공통으로 기준 삼는 개발 브랜치입니다.
- main으로 병합하기 전 기능을 모아 테스트합니다.

### feature

feature 브랜치는 기능별 작업 브랜치입니다.

- develop 브랜치에서 새로 생성합니다.
- 기능 하나당 브랜치 하나를 사용합니다.
- 작업이 끝나면 develop으로 Pull Request를 생성합니다.

예시:

- feature/login
- feature/profile
- feature/project-structure
- feature/policy-search
- feature/agent-policy-researcher
- feature/document-management
- feature/calendar

## 3. Branch Naming Rule

브랜치 이름은 아래 형식을 따릅니다.

feature/기능명

예시:

- feature/login
- feature/profile
- feature/project-structure
- feature/policy-search

기능명은 소문자 영어를 사용하고, 단어가 여러 개면 하이픈(-)으로 연결합니다.

예시:

- feature/policy-search
- feature/user-profile
- feature/project-structure

## 4. Pull Request Rule

Pull Request 방향은 아래와 같이 설정합니다.

- feature/* → develop
- develop → main

기능 작업이 끝나면 feature 브랜치에서 develop 브랜치로 Pull Request를 생성합니다.

최종 제출이나 배포 전에는 develop 브랜치에서 main 브랜치로 Pull Request를 생성합니다.

## 5. Pull Request 작성 규칙

Pull Request 제목은 커밋 메시지 형식과 비슷하게 작성합니다.

예시:

- docs: 프로젝트 폴더 및 README 생성
- feat: 회원가입 및 로그인 API 구현
- fix: 로그인 오류 수정

Pull Request 설명에는 아래 내용을 작성합니다.

## 작업 내용

- 작업한 내용을 간단히 정리합니다.

## 테스트

- 테스트한 내용을 작성합니다.
- 테스트하지 못한 경우 그 이유를 작성합니다.

## 참고 사항

- 리뷰어가 알아야 할 내용을 작성합니다.

## 6. Commit Convention

커밋 메시지는 아래 형식을 따릅니다.

타입: 작업 내용

예시:

- docs: 프로젝트 폴더 및 README 생성
- docs: 협업 규칙 문서 추가
- feat: 회원가입 및 로그인 API 구현
- feat: 사용자 프로필 등록 API 구현
- fix: 로그인 토큰 발급 오류 수정
- chore: 초기 프로젝트 설정 추가
- refactor: 인증 서비스 구조 개선

## 7. Commit Type

| Type | Meaning |
|---|---|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| docs | 문서 추가 또는 수정 |
| style | 코드 포맷팅, 공백, 세미콜론 등 기능 변화 없는 수정 |
| refactor | 기능 변화 없는 코드 구조 개선 |
| test | 테스트 코드 추가 또는 수정 |
| chore | 설정, 빌드, 패키지, 기타 작업 |

## 8. Git Rule

- main 브랜치에 직접 push하지 않습니다.
- 기능 작업은 feature 브랜치에서 진행합니다.
- feature 브랜치는 develop 브랜치에서 생성합니다.
- 작업 전 develop 브랜치의 최신 내용을 확인합니다.
- 작업 완료 후 Pull Request를 통해 develop에 병합합니다.
- 충돌이 발생하면 담당자가 직접 해결한 뒤 다시 요청합니다.
- .env, application.yml, API Key, DB 비밀번호, JWT Secret은 GitHub에 올리지 않습니다.

## 9. Secret 관리 규칙

아래 파일이나 값은 GitHub에 업로드하지 않습니다.

- .env
- application.yml
- application-local.yml
- Supabase URL
- Supabase DB Password
- JWT Secret
- AI API Key
- 배포 서버 접속 정보

필요한 환경 변수 예시는 별도 파일로 관리합니다.

예시:

- .env.example
- application-example.yml

실제 비밀번호나 키 값은 작성하지 않고, 형식만 작성합니다.

## 10. 현재 프로젝트 브랜치 사용 예시

프로젝트 초기 폴더 및 README 작업:

- 브랜치: feature/project-structure
- 커밋 메시지: docs: 프로젝트 폴더 및 README 생성
- Pull Request: feature/project-structure → develop

로그인 기능 작업:

- 브랜치: feature/login
- 커밋 메시지: feat: 회원가입 및 로그인 API 구현
- Pull Request: feature/login → develop

최종 제출 전 병합:

- Pull Request: develop → main