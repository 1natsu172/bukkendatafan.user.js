// ==UserScript==
// @name         bukkendatafan
// @namespace    https://github.com/1natsu172/bukkendatafan.user.js
// @version      1.1.0
// @description  物件ファンのトップページの各記事に物件の賃料や所在地などの情報を表示するユーザースクリプト
// @author       1natsu
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @require      https://unpkg.com/imagesloaded@4/imagesloaded.pkgd.min.js
// @match        https://bukkenfan.jp/*
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
    console.log("[BukkenDataFan", "Hi, BukkenDataFan's bro!");

function waitElement(selector, options) {
  options = Object.assign(
    {
      target: document
    },
    options
  );

  const checkElement = selector => {
    return options.target.querySelector(selector);
  };

  return new Promise((resolve, reject) => {
    let observer = {};
    let _hasObserved = false;

    const configs = {
      childList: true,
      subtree: true
    };

    // Checking already element existed.
    const element = checkElement(selector);
    if (element) {
      _hasObserved = true;
      return resolve(element);
    }

    observer = new MutationObserver(mutations => {
      mutations.some(() => {
        const element = checkElement(selector);

        if (element) {
          observer.disconnect();
          _hasObserved = true;
          resolve(element);
          return true; // The same as "break" in `Array.some()`
        }

        return false;
      });
    });

    // Start observe.
    observer.observe(options.target, configs);
  });
}

const setReadMoreButtonEvent = json => {
  const readMoreRef = json[0].next_ref;
  const readMoreButton = document.querySelector(".portal-entry-load-more");
  readMoreButton.addEventListener(
    "click",
    function() {
      showBukkenData(readMoreRef);
    },
    {
      capture: false,
      once: true,
      passive: false
    }
  );
};

const entriesJsonUrlReturner = ref => {
  const tag = document.documentElement.getAttribute("data-tag") || "";
  const tagType = document.documentElement.getAttribute("data-tag-type") || 0;
  const pageSize = tag && tagType != 0 ? 10 : 24;
  const refParam = ref != null ? `&ref=${encodeURIComponent(ref)}` : "";
  const url = `/entries.json?limit=${pageSize}&tag=${encodeURIComponent(
    tag
  )}${refParam}`;
  // console.log(url)
  return [url];
};

const fetchJson = urls => {
  console.log("[BukkenDataFan]", `Getting BukkenData…`);
  const asyncFetch = urls.map(url => {
    return fetch(url).then(response => {
      try {
        if (response.ok) {
          console.log(
            "[BukkenDataFan]",
            `Fetch: ${response.url} => response: ${response.status}`
          );
          return response.json(); // レスポンスをjsonとして処理する
        } else {
          throw new Error(
            `[BukkenDataFan] FetchError: ${response.url} => response: ${
              response.status
            }`
          );
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
  return Promise.all(asyncFetch);
};

const createBukkenData = json => {
  const entriesArray = json[0].entries;
  const createDOM = entriesArray.map(entry => {
    return new Promise((resolve, reject) => {
      const dataObject = {
        所在地: entry.data.addr,
        賃料: entry.data.chinryou,
        売価: entry.data.baika,
        面積: entry.data.menseki,
        最寄り: entry.data.moyori
      };
      // dataの中からvalueがあるものだけ抽出する
      const filteredData = Object.keys(dataObject)
        .filter(key => dataObject[key] !== "") // 条件で絞り込む
        .reduce((obj, key) => {
          obj[key] = dataObject[key];
          return obj;
        }, {});

      function loopTableData() {
        let tableData = "";
        for (let key of Object.keys(filteredData)) {
          tableData += `
            <tr>
              <th>${key}</th>
              <td>${filteredData[key]}</td>
            </tr>
          `;
        }
        return tableData;
      }

      const dataDOMLiteral = `
        <div class="entry-data">
          <table>
            <tbody>
              ${loopTableData()}
            </tbody>
          </table>
        </div>
        `;

      resolve(dataDOMLiteral);
    });
  });
  return Promise.all(createDOM);
};

const insertDataIntoEntryCards = data => {
  const bukkenData = data;
  const newerEntryFeed = document.querySelector(".portal-entries");
  let cards = [...newerEntryFeed.querySelectorAll(".entry-url")];
  // もっとみるボタン押下したとき、物件データの数で追加分のDOM箇所を判定する
  if (cards.length > 24) {
    cards = cards.slice(-bukkenData.length);
  }

  // console.log(bukkenData.length)
  // console.log(cards)

  // 各エントリのカードに該当の物件データを挿入する
  return Promise.all(
    cards.map((card, index) => {
      card.nextElementSibling.insertAdjacentHTML("afterend", bukkenData[index]);
    })
  );
};

const stylingBukkenData = () => {
  return new Promise((resolve, reject) => {
    const customCSSContent = `
      <style>
        .portal-entry-list {
          display: flex;
          flex-wrap: wrap;
        }
        .portal-entry {
          height: auto;
        }

        .entry-data {
          padding: 15px 0px;
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
      resolve();
    } else {
      reject("headタグ見当たらない");
    }
  });
};

const waitImagesloaded = () => {
  return new Promise((resolve, reject) => {
    const elem = document.querySelectorAll(".entry-image");
    const observeImages = new imagesLoaded(elem, { background: true });
    observeImages
      .on("always", instance => {
        resolve();
      })
      .on("progress", (instance, image) => {});
  });
};

// getDataFunc
async function getBukkenData(ref) {
  const insertReadyFlag = waitElement(".portal-entry-list").then(v=> {
    // エントリーのDOMが全件できあがるのを待機する
    return new Promise((resolve,reject)=> {
      let entryCount = v.childElementCount
      for (let index = entryCount; index <= 24; index++) {
        entryCount = v.childElementCount
      }
      resolve()
    })
  })
  .catch(error =>
    console.error(error)
  );
  async function getDataFlow() {
    const urls = entriesJsonUrlReturner(ref);
    const fetch = await fetchJson(urls).catch(error => console.error(error));
    const createDataDOM = await createBukkenData(fetch).catch(error =>
      console.error(error)
    );
    const setEvent = setReadMoreButtonEvent(fetch);
    return createDataDOM;
  }
  // 挿入先DOMの監視と差し込むデータの準備を並列で待つ
  return Promise.all([insertReadyFlag, getDataFlow()]).then(data => {
    return data[1]; // 整形済みDOMデータだけ返す
  });
}

// InsertDataFunc
async function insertBukkenData(data) {
  await insertDataIntoEntryCards(data);
}

// mainFunc
async function showBukkenData(ref) {
  const getData = await getBukkenData(ref).catch(error => console.error(error));
  const insertData = await insertBukkenData(getData)
    .then(() => console.log("[BukkenDataFan]", "Inserted BukkenData"))
    .catch(error => console.error(error));
  await stylingBukkenData()
    .catch(error => console.error(error))
    .then(() => console.log("[BukkenDataFan]", "Injected StyleSheet"));
  await waitImagesloaded().then(() =>
    console.log("[BukkenDataFan]", "Loaded cards image")
  );
  console.log("[BukkenDataFan]", "BukkenData completed, Enjoy!");
}
showBukkenData();

// Your code end...

]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016"]});
eval(c.code);
/* jshint ignore:end */