## How to use github

- 개발을 시작할 때는 최대한 issue 를 작성
  - 첫 개발은 feature, 후에 수정은 fix

- 명령어
  ```
  git branch feat#숫자   (숫자는 자기의 issue 번호)
  git checkout feat#숫자  (생성한 branch로 이동) WHY? 코드실수 필터링
  git add . // git add 파일명 (add . 는 모든 파일 추가 add 파일명은 원하는 것만)
  git commit -m "feat#숫자 변동사항 적기" (commit 은 소제목 느낌)
  git push origin feat#숫자  (push로 깃허브에 코드 올리기)
  ```
  코드를 다 올리고 PR도 올리고 Merge도 받았다 or 내가 현 시점에서 코드를 작성할건데 다른 분이 수정한 부분이 있다
  ```
  git checkout develop
  git pull origin develop
  ```
  WHY? develop이라는 branch에 Merge를 할 예정이라 모든 변동사항들은 develop에 올라가기 때문에 바로바로 수정본을
  pull 해서 받아주고 시작해야 함

  - [branch 전략](https://inpa.tistory.com/entry/GIT-%E2%9A%A1%EF%B8%8F-github-flow-git-flow-%F0%9F%93%88-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EC%A0%84%EB%9E%B5)
  - [github 명령어](https://myeongsu0257.tistory.com/189)

## How to use Foledring
 - assets -> 이미지
 - pages -> index.html 제외 나머지 html
 - scripts -> JS
 - styles -> CSS

## How to use Tailwind
  ```
    <!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>   >>>> script에 CDN 으로
  </head>
  <body>
    <h1 class="text-3xl font-bold underline">  >>> 사용하고싶은 방향으로
      Hello world!
    </h1>
  </body>
</html>
```
- [tailwind](https://tailwindcss.com/)

