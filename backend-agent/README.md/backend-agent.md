# 2. `backend-agent/README.md`

```md
# Backend Agent

FastAPI 기반 AI Agent 서버입니다.

## 역할

- 정책 탐지 에이전트
- 자격 요건 확인 에이전트
- 일정 관리 에이전트
- 제출 서류 관리 에이전트
- 기대 효과 분석 에이전트

## Tech Stack

- Python
- FastAPI
- AI Model
- Vector Search
- Docker

## 주요 기능

- AGT-01: 정책 탐지
- AGT-02: 자격 요건 확인
- AGT-03: 일정 관리
- AGT-04: 제출 서류 관리
- AGT-05: 기대 효과 분석

## Main Backend와의 관계

Agent 서버는 직접 사용자 인증을 담당 X.

사용자 인증, DB 저장, 정책 데이터 조회는 Spring Boot Main Backend가 담당하고, Agent 서버는 Main Backend에서 전달받은 데이터를 기반으로 AI 판단과 응답 생성을 수행

## 실행 방법

추후 작성 예정