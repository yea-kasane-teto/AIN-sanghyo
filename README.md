# AIN — 필수 수학

## 머신러닝 실습

- `machine-learning.html`: 개념 설명과 공부 시간 → 시험점수 선형회귀 실습
- `machine-learning.css`, `machine-learning.js`: 반응형 화면, 최소제곱법 예측 및 경사하강법 학습 애니메이션
- 공개 주소: https://yea-kasane-teto.github.io/AIN-sanghyo/machine-learning.html
- 기존 호출 방식과 동일하게 `?module=ml` 또는 `?module=machine-learning`으로도 이동할 수 있습니다.
- 03-1과 03-2는 같은 데이터를 사용하며, 데이터 변경 시 기존 모델을 초기화합니다. 입력 데이터는 브라우저 로컬 저장소에 보관됩니다.
- 검증: `node verify-ml.cjs`

AIN 학습 로드맵의 **필수 수학** 영역을 위한 독립형 정적 페이지입니다. 벡터 내적과 경사하강법을 직접 바꿔보며 벡터·행렬·텐서·미분·확률의 기초를 익힙니다.

## 로컬에서 열기

저장소 루트에서 정적 웹 서버를 실행한 뒤 `index.html`을 열면 됩니다. 별도 빌드나 패키지 설치는 필요하지 않습니다.

## 파일

- `index.html`: 학습 페이지의 구조와 콘텐츠
- `styles.css`: AIN-sehyeon 레이아웃을 참고한 반응형 학습 화면
- `app.js`: 벡터 내적과 경사하강법 인터랙션 및 `?module=math` 라우트
- `.github/workflows/deploy.yml`: `main` 변경을 GitHub Pages에 배포하는 workflow

## 공개 및 메인 레포 연결

1. GitHub 저장소의 **Settings → Pages**를 엽니다.
2. **Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
3. Actions의 **Deploy to GitHub Pages** workflow가 성공하면 다음 주소에서 열 수 있습니다: [필수 수학 페이지](https://yea-kasane-teto.github.io/AIN-sanghyo/?module=math)

AIN 메인 페이지의 필수 수학 카드는 이 주소를 열도록 [PR](https://github.com/yea-kasane-teto/AIN-main/pull/1)에 연결 변경을 올렸습니다. 페이지가 배포된 뒤 PR을 병합하면 메인 페이지에서 이동할 수 있습니다.


## 딥러닝 개념 수업

- `deep-learning.html`: 신경망·활성화·순전파·손실 함수·경사하강법·역전파·배치와 최적화·기울기 안정화·과적합의 9개 단원입니다.
- 설명과 계산 예시는 항상 표시하고, 7개의 보조 실험은 ‘개념 확인’을 펼쳐 사용합니다.
- `deep-learning.css`, `deep-learning.js`: 공통 학습 레이아웃 위의 본문 스타일과 계산 도구입니다. 외부 라이브러리나 빌드 과정 없이 파일을 직접 열어도 작동합니다.
- 메인에서 같은 탭으로 `?module=dl` 또는 `?module=deep-learning`을 열면 `deep-learning.html`로 이동합니다.
- 공개 주소: https://yea-kasane-teto.github.io/AIN-sanghyo/deep-learning.html
- 계산 가정: 순전파는 고정 파라미터, 역전파 실험은 Tanh/Sigmoid와 반제곱 오차 및 학습률 0.7, 경사하강법 실험은 J(w)=½(w−1)²를 사용합니다. 기울기 흐름 실험은 가중치가 1이고 각 층의 활성화 전 값이 같은 단일 경로를 가정합니다.
- Dropout 그림은 마스크와 학습/추론 모드만 시각화하며 모델 성능을 측정하지 않습니다. 학습 진행도는 `ain-progress:dl-01`에 별도로 저장합니다.
