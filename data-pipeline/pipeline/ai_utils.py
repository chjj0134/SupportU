# pipeline/ai_utils.py

import ast
import json
import re

import ollama

from config import MODEL_NAME


def clean_json_response(text: str) -> str:
    """
    Ollama 응답에서 JSON 객체 부분만 최대한 추출.
    """
    text = str(text).strip()

    # 마크다운 코드블록 제거
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # 앞뒤 설명이 섞였을 때 { ... } 부분만 추출
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]

    return text.strip()


def normalize_json_like_text(text: str) -> str:
    """
    자주 나오는 비정상 JSON을 일부 보정.
    """
    text = str(text).strip()

    # 스마트 따옴표 정리
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'")

    # trailing comma 제거
    text = re.sub(r",\s*}", "}", text)
    text = re.sub(r",\s*]", "]", text)

    # 제어문자 제거
    text = re.sub(r"[\x00-\x1f\x7f]", " ", text)

    return text


def safe_json_loads(text: str) -> dict:
    """
    Ollama 응답을 dict로 복구.
    순서:
    1. 정상 JSON
    2. 보정 후 JSON
    3. Python dict 형태
    4. 실패 시 ValueError
    """
    cleaned = clean_json_response(text)
    cleaned = normalize_json_like_text(cleaned)

    # 1차: 정상 JSON
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # 2차: 줄바꿈/탭 escape 후 JSON
    try:
        cleaned2 = cleaned.replace("\n", "\\n")
        cleaned2 = cleaned2.replace("\r", "\\r")
        cleaned2 = cleaned2.replace("\t", "\\t")
        parsed = json.loads(cleaned2)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # 3차: {'status': 'active'} 같은 Python dict 형태 복구
    try:
        parsed = ast.literal_eval(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    raise ValueError(f"JSON 파싱 실패. Ollama 응답 일부: {cleaned[:500]}")


def force_json_prompt(prompt: str) -> str:
    """
    기존 프롬프트 앞뒤에 JSON 강제 규칙 추가.
    """
    return f"""
너는 JSON 생성기다.
반드시 유효한 JSON 객체 하나만 출력해야 한다.
마크다운 코드블록을 쓰지 마라.
설명 문장, 주석, 목록, 표를 쓰지 마라.
중국어, 영어로 번역하지 마라.
키는 반드시 요청받은 영어 필드명만 사용해라.
문자열은 반드시 큰따옴표(")를 사용해라.
작은따옴표(')를 사용하지 마라.
값이 없으면 null을 사용해라.

아래 요청을 수행하라.

{prompt}

다시 강조:
출력은 반드시 JSON 객체 하나만.
예:
{{"status": "active", "reason": "상시 운영", "evidence": "상시"}}
"""


def ask_ollama_json(prompt: str) -> dict:
    """
    Ollama에 JSON 응답을 요청하고 dict로 반환.
    """
    strict_prompt = force_json_prompt(prompt)

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": (
                    "You only output valid JSON. "
                    "Do not output markdown. "
                    "Do not translate Korean text into Chinese or English."
                ),
            },
            {
                "role": "user",
                "content": strict_prompt,
            },
        ],
        options={
            "temperature": 0,
            "top_p": 0.1,
        },
    )

    content = response["message"]["content"]
    return safe_json_loads(content)