import time

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By


BASE_URL = "https://www.youthcenter.go.kr"
LIST_URL = "https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch"


def make_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1400,1200")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(5)

    return driver


def wait_and_scroll(driver):
    time.sleep(3)

    for _ in range(4):
        driver.execute_script("window.scrollBy(0, 800);")
        time.sleep(1)


def print_policy_list_text(driver):
    soup = BeautifulSoup(driver.page_source, "lxml")
    body_text = soup.get_text("\n", strip=True)

    lines = body_text.splitlines()

    print("\n[정책 목록 주변 텍스트]")
    for i, line in enumerate(lines):
        if "정책비교" in line and i + 10 < len(lines):
            start = max(0, i)
            end = min(len(lines), i + 80)

            for j in range(start, end):
                print(f"{j}: {lines[j]}")

            break


def inspect_detail_buttons(driver):
    print("\n[자세히보기 요소 검사]")

    candidates = []

    elements = driver.find_elements(By.XPATH, "//*[contains(text(), '자세히보기')]")

    print("자세히보기 텍스트 요소 수:", len(elements))

    for idx, element in enumerate(elements[:20], start=1):
        try:
            text = element.text.strip()
            tag = element.tag_name
            href = element.get_attribute("href")
            onclick = element.get_attribute("onclick")
            outer_html = element.get_attribute("outerHTML")

            candidates.append(element)

            print(f"\n[{idx}]")
            print("TAG:", tag)
            print("TEXT:", text)
            print("HREF:", href)
            print("ONCLICK:", onclick)
            print("OUTER_HTML:", outer_html[:500])

        except Exception as e:
            print("검사 실패:", e)

    return candidates


def click_first_detail_button(driver):
    elements = driver.find_elements(By.XPATH, "//*[contains(text(), '자세히보기')]")

    if not elements:
        print("자세히보기 버튼을 찾지 못함")
        return

    first = elements[0]

    print("\n[첫 번째 자세히보기 클릭]")
    print("클릭 전 URL:", driver.current_url)

    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", first)
    time.sleep(1)

    try:
        first.click()
    except Exception:
        driver.execute_script("arguments[0].click();", first)

    time.sleep(3)

    print("클릭 후 URL:", driver.current_url)

    soup = BeautifulSoup(driver.page_source, "lxml")
    detail_text = soup.get_text("\n", strip=True)

    print("상세 본문 글자 수:", len(detail_text))

    keywords = [
        "한 눈에 보는 정책 요약",
        "정책번호",
        "정책분야",
        "지원내용",
        "사업 운영 기간",
        "사업 신청기간",
        "신청자격",
        "연령",
        "거주지역",
        "소득",
        "신청방법",
    ]

    print("\n[원문 내 키워드 포함 여부]")
    for keyword in keywords:
        print(keyword, "=>", keyword in detail_text)

    print("\n[상세 본문 앞부분]")
    print(detail_text[:3000])


def main():
    driver = make_driver()

    try:
        print("접속:", LIST_URL)
        driver.get(LIST_URL)

        wait_and_scroll(driver)

        print("현재 URL:", driver.current_url)
        print("렌더링 HTML 글자 수:", len(driver.page_source))

        print_policy_list_text(driver)
        inspect_detail_buttons(driver)
        click_first_detail_button(driver)

    finally:
        driver.quit()


if __name__ == "__main__":
    main()