# Backend Main

Spring Boot 기반 메인 백엔드 서버입니다.

## 역할

- 회원가입 및 로그인
- 사용자 프로필 관리
- 정책 데이터 조회 API
- FastAPI Agent 서버와 통신
- Supabase PostgreSQL 연동
- JWT 기반 인증 처리

## Tech Stack

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Supabase
- Docker

## 주요 기능

- USR-01: 로그인
- USR-02: 사용자 프로필
- TOOL-01: 정책 검색 API
- TOOL-02: 서류 저장 API
- TOOL-03: 일정/알림 API
- TOOL-05: 리포트 저장/조회 API

## 실행 방법

추후 작성 예정

## 환경 변수

DB 비밀번호, JWT Secret 등 민감한 정보는 GitHub에 업로드 X.

```txt
application.yml
application-local.yml
.env