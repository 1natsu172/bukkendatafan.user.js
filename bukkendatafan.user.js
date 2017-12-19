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
  entryListObserver.disconnect(); //監視終了
  showBukkenData()
});
// 監視メソッドを設定
entryListObserver.observe(observeTarget, {
  attributes: true,
});

const entryUrlArray = () => {
  return new Promise((resolve, reject) => {
    const targetEntryElements = document.querySelectorAll(".entry-url")
    const entryUrls = Array.from(targetEntryElements, a => a.href)
    resolve(entryUrls)
  })
}

const fetchEntryArray = urls => {
  const asyncFetch = urls.map( url => {
    return fetch(url)
      .then(response => {
        try {
          if (response.ok) {
          console.log("Fetch: ", `${response.url} => ${response.status}`)
          return response.text() // レスポンスをテキストとして変換する
          } else {
            throw new Error(`FetchError: ${response.url} => ${response.status}`)
          }
        } catch (error) {
          console.error(error)
        }
      })
    })
  return Promise.all(asyncFetch)
}

const extractDatafromEntry = entries => {
  const extractedData = entries.map( entry => {
    // DOM parse
    const parseEntryDOM = new Promise((resolve, reject) => {
      const parse = new DOMParser().parseFromString(entry, "text/html")
      resolve(parse)
    })
    // 物件の記事のDOMを整形する…… :innocent:
    return parseEntryDOM.then(document => {
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
  })
  return Promise.all(extractedData)
}

const insertDataIntoEntryCards = (data) => {
  const bukkenData = data
  console.log('bukkenData',bukkenData)
  
  const cards = document.querySelectorAll(".entry-url")
  // 各エントリのカードに該当の物件データを挿入する
  cards.forEach((card, index) => {
    card.nextElementSibling.insertAdjacentElement("afterend", bukkenData[index])})
}

async function fetchData() {
  const urls = await entryUrlArray().catch(error => console.error(error))
  const fetchEntries = await fetchEntryArray(urls).catch(error => console.error(error))
  const extractData = await extractDatafromEntry(fetchEntries).catch(error => console.error(error))
  const insertingData = await insertDataIntoEntryCards(extractData).catch(error => console.error(error))
}


const stylingBukkenData = () => {
  return new Promise((resolve, reject) => {
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
    if (document.head) {
      document.head.insertAdjacentHTML("beforeend", customCSSContent);
      resolve()
    } else {
      reject('headタグ見当たらない')
    }
  })
}


const reMasonry = () => {
  return new Promise((resolve, reject) => {
      if (typeof Masonry !== 'undefined') {
        var msnry = new Masonry(".portal-entry-list", {
          itemSelector: ".portal-entry", // target item
          columnWidth: 240,
          gutter: 15 // margin
        })
        resolve()
      } else {
        reject('Masonry見当たらない')
      }
  })
}

async function showBukkenData() {
  await fetchData().catch(error => console.error(error))
  await stylingBukkenData().catch(error => console.error(error))
  await reMasonry().catch(error => console.error(error))
}

// Your code end...

]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016"]});
eval(c.code);
/* jshint ignore:end */