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
    console.log('[BukkenDataFan]','Hi, BukkenDataFan\'s bro!')

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

const setReadMoreButtonEvent = json => {
  const readMoreRef = json[0].next_ref
  // console.log('ref',readMoreRef)
  const readMoreButton = document.querySelector('.portal-entry-load-more')
  readMoreButton.addEventListener('click', function(){showBukkenData(readMoreRef)}, {
    capture: false,
    once: true,
    passive: false
  })
}

const entriesJsonUrlReturner = ref => {
  const tag = document.documentElement.getAttribute ('data-tag') || ''
  const tagType = document.documentElement.getAttribute ('data-tag-type') || 0
  const pageSize = tag && tagType != 0 ? 10 : 30
  const refParam = ref != null ? `&ref=${ encodeURIComponent(ref) }` : ''
  const url = `/entries.json?limit=${ pageSize }&tag=${ encodeURIComponent(tag) }${ refParam }`
  return [url]
}

const fetchJson = urls => {
  const asyncFetch = urls.map( url => {
    return fetch(url)
      .then(response => {
        try {
          if (response.ok) {
          console.log('[BukkenDataFan]', `Fetch: ${response.url} => response: ${response.status}`)
          return response.json() // レスポンスをjsonとして処理する
          } else {
            throw new Error(`[BukkenDataFan] FetchError: ${response.url} => response: ${response.status}`)
          }
        } catch (error) {
          console.error(error)
        }
      })
    })
  return Promise.all(asyncFetch)
}

const createBukkenData = json => {
  const entriesArray = json[0].entries
  const createDOM = entriesArray.map( entry => {
    return new Promise((resolve, reject) => {
      const dataObject = {
        所在地: entry.data.addr,
        賃料: entry.data.chinryou,
        売価: entry.data.baika,
        面積: entry.data.menseki,
        最寄り: entry.data.moyori,
      }
      // dataの中からvalueがあるものだけ抽出する
      const filteredData = Object.keys(dataObject)
                                 .filter(key => dataObject[key] !== '') // 条件で絞り込む
                                 .reduce((obj, key) => {
                                   obj[key] = dataObject[key]
                                   return obj
                                 }, {})

      function loopTableData() {
        let tableData = ''
        for(let key of Object.keys(filteredData)) {
          tableData += `
            <tr>
              <th>${key}</th>
              <td>${filteredData[key]}</td>
            </tr>
          `
        }
        return tableData
      }

      const dataDOMLiteral =
        `
        <div class="entry-data">
          <table>
            <tbody>
              ${loopTableData()}
            </tbody>
          </table>
        </div>
        `

      resolve(dataDOMLiteral)
    })
  })
  return Promise.all(createDOM)
}

const insertDataIntoEntryCards = (data) => {
  const bukkenData = data
  let cards = document.querySelectorAll(".entry-url")
  // もっとみるボタン押下したとき、物件データの数で追加分のDOM箇所を判定する
  if (cards.length > 30) { cards = [...cards].slice(-bukkenData.length) }
  
  // console.log(bukkenData.length)
  // console.log(cards)

  // 各エントリのカードに該当の物件データを挿入する
  cards.forEach((card, index) => {
    card.nextElementSibling.insertAdjacentHTML("afterend", bukkenData[index])
  })
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


async function getAndInsertBukkenData(ref) {
  const urls = entriesJsonUrlReturner(ref)
  const fetch = await fetchJson(urls).catch(error => console.error(error))
  const data = await createBukkenData(fetch).catch(error => console.error(error))
  const insertingData = insertDataIntoEntryCards(data)
  setReadMoreButtonEvent(fetch)
}


async function showBukkenData(ref) {
  await getAndInsertBukkenData(ref).catch(error => console.error(error))
  await stylingBukkenData().catch(error => console.error(error))
  await reMasonry().catch(error => console.error(error))
  console.log('[BukkenDataFan]','Inserting BukkenData completed, Enjoy!')
}

// Your code end...

]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016"]});
eval(c.code);
/* jshint ignore:end */