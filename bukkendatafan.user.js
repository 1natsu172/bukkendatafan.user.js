// ==UserScript==
// @name         bukkendatafan
// @namespace    https://github.com/1natsu172/bukkendatafan.user.js
// @version      0.1
// @description  物件ファンのトップページの各記事に物件の賃料や所在地などの情報を表示するユーザースクリプト
// @author       1natsu
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://bukkenfan.jp/
// @updateURL https://raw.githubusercontent.com/1natsu172/bukkendatafan.user.js/master/bukkendatafan.user.js
// @downloadURL https://raw.githubusercontent.com/1natsu172/bukkendatafan.user.js/master/bukkendatafan.user.js
// @supportURL https://github.com/1natsu172/bukkendatafan.user.js/issues
// @run-at document-end
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[

    /* jshint esnext: false */
    /* jshint esversion: 6 */
    /* jshint asi: true */

    // Your code here...
// 監視対象のノードを取得
const observeTarget = document.querySelector(".portal-entry-list");

// トップページのエントリ記事のタイル、動的に差し込まれるのでその処理が終わるまで行儀よく待つ
// masonryの処理でattributeが変更されるのでそれを監視する = DOMが準備された ＝ querySelectorAllができる
const entryListObserver = new MutationObserver((mutations) => {
  targetArticleElements = document.querySelectorAll(".entry-url");
  articleUrls = Array.from(targetArticleElements, a => a.href);
  entryListObserver.disconnect(); //監視終了
  showBukkenData()
});
// 監視メソッドを設定
entryListObserver.observe(observeTarget, {
  attributes: true,
});


let targetArticleElements = []
let articleUrls = []
let resultDataArray = []

const fetchArticles = urls => {
  const asyncFetch = urls.map(async (url,index) => {
    await fetch(url)
      .then(response => {
        if (response.ok) {
          console.log("Fetch: ", `${response.url} => ${response.status}`)
          return response.text(); // レスポンスをテキストとして変換する
        } else {
          throw new Error(`FetchError: ${response.url} => ${response.status}`)
        }
      })
      // DOM parsing
      .then(text => new DOMParser().parseFromString(text, "text/html"))
      // 物件の記事のDOMを整形する…… :innocent:
      .then(document => {
        const extractEntryData = document.querySelector(".entry-data")// 記事下部の物件データ
        const getTableRow = extractEntryData.querySelectorAll("tr")// 物件データのtr抽出
        const disclaimerNote = extractEntryData.querySelector("p.note")// 物件データについてる免責文章

        const deleteUnnecessaryDOM = ()=> {
          // p.note消す
          extractEntryData.removeChild(disclaimerNote);
          // tr要素が5つ以上あるとき配列4番目以降のtrを消す(goodroomのロゴ消したい…)
          if (getTableRow.length >= 5) {
            for (let index = 4; index < getTableRow.length; index++) {
              // console.log(getTableRow)
              getTableRow[index].parentNode.removeChild(getTableRow[index]);
            }
          }
        }
        deleteUnnecessaryDOM()

        return extractEntryData;
      })
      // 配列に一応整形済みのDOM入れておく
      .then(value => resultDataArray[index] = value)
      // 各該当記事にそれぞれの物件データを挿入する
      .then(insertElement => targetArticleElements[index].nextElementSibling.insertAdjacentElement("afterend", insertElement)
      )
  })
  return Promise.all(asyncFetch)
}

const stylingBukkenData = () => {
  const styling = new Promise((resolve, reject) => {
    const customCSSContent = `
      <style>
        .entry-data {
            padding: 15px 10px;
            color: #999;
            /* opacity: 0.1; */
            transition: opacity 0.3s;
        }
        .card:hover .entry-data {
          opacity: 1;
        }

        .entry-data table {
          width: 100%;
        }
        .entry-data tr {
            border-bottom: solid 1px #e6e6e6;
        }
        .entry-data th {
            width: 20%;
            font-weight: normal;
            font-size: 12px;
            white-space: nowrap;
        }
        .entry-data td {
            padding: 8px 0px 8px 10px;
            font-size: 13px;
        }
      </style>
    `;

    // adding <style>~~~</style>  to <head>
    document.head.insertAdjacentHTML("beforeend", customCSSContent);
    resolve()
  })
}

const reMasonry = () => {
  const masonry = new Promise((resolve, reject) => {
    var msnry = new Masonry(".portal-entry-list", {
      itemSelector: ".portal-entry", // target item
      columnWidth: 240,
      gutter: 15 // margin
    })
    resolve()
  })
  return masonry
}

async function showBukkenData() {
  await stylingBukkenData()
  await fetchArticles(articleUrls)
  await reMasonry()
}

// Your code end...

]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016"]});
eval(c.code);
/* jshint ignore:end */