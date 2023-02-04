const CLUBS = [
  'AJ北海道',
  'R札幌',
  'R宮城',
  'ARいわき',
  'AJ宇都宮',
  'A埼玉',
  'AJ千葉',
  'AJ群馬',
  'R東京',
  'AJ西東京',
  'AR日本橋',
  'AJ神奈川',
  'AJたまがわ',
  'VCR横浜あおば',
  'AJ静岡',
  'AR中部',
  'RC名古屋',
  'A近畿',
  'AJ岡山',
  'AJ広島',
  'AR四国',
  'AJ福岡',
  'AJ長崎',
  'R熊本',
  'AR鹿児島',
];
const DISTANCES = [200, 300, 400, 600, 1000, 1300, 1900, 'Fleche', 'Trace'];

/**
 *
 * @returns {Promise}
 */
function getCalendar() {
  return fetch(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7x9DSpQVZNEf-mbBY-2F2J3SsAMXJcBJsoWhMO3v7PbvPJxWOgxVPt4Q9KJpODorvShV62F86wem-/pubhtml?gid=369473455&single=true',
    {
      method: 'GET',
    }
  )
    .then((response) => response.text())
    .then(
      (text) =>
        new DOMParser().parseFromString(text, 'text/html').documentElement
    )
    .catch((err) => {
      alert('データの取得に失敗しました。');
      return null;
    });
}

function tdNth(num) {
  return `td:nth-child(${num})`;
}
async function loadCalendar() {
  /**
   *
   * @param {HTMLTableRowElement} row
   * @returns
   */
  const getRowInfo = (row) => {
    return {
      date: row.querySelector(tdNth(2)),
      club: row.querySelector(tdNth(3)),
      distance: row.querySelector(tdNth(4)),
      depart: row.querySelector(tdNth(5)),
      name: row.querySelector(tdNth(6)),
    };
  };
  /**
   *
   * @param {HTMLTableElement} loadedTable
   */
  const addTrimedTable = (loadedTable) => {
    const table = document.createElement('table');
    const bodyRow = loadedTable.querySelectorAll(
      'tbody > tr:not(:first-child)'
    );
    bodyRow.forEach((row) => {
      for (const attribute of row.attributes) {
        row.removeAttribute(attribute.name);
        const numbercell = row.querySelector('th');

        row.removeChild(numbercell);

        const distance = ((distance) => {
          if (Number.isInteger(parseInt(distance))) {
            return distance > 600 ? 'rm' : distance;
          } else {
            return 'others';
          }
        })(row.querySelector('td:nth-child(3)').innerHTML);
        row.classList.add('distance-' + distance);

        const club = row.querySelector(tdNth(2)).innerHTML;
        if (!CLUBS.includes(club)) {
          CLUBS.push(club);
        }

        const nameCell = row.querySelector(tdNth(5));
        const name = nameCell.innerText;
        nameCell.innerHTML = `<a href="https://www.google.com/search?q=${name.replaceAll(
          / /g,
          'g'
        )}" target="_blank">${name}</a>`;

        document.querySelector('#event-table > tbody').appendChild(row);
      }
    });
  };

  //
  // 処理
  //
  const caldoc = await getCalendar();
  if (!caldoc) {
    return;
  }
  const table = caldoc.querySelector('#sheets-viewport > div > div >table');
  addTrimedTable(table);
}

/**
 *
 * @param {Function} comparere
 * @param {1 | -1} sortType 1:ascending, -1:descending
 * @param {number} colnum
 */
function tableSort(comparere, sortType, colnum) {
  /**
   * @type {HTMLTableElement}
   */
  const tbody = document.querySelector('#event-table > tbody');
  const rowArr = ((rows) => {
    const arr = new Array();
    for (let i = 0; i < rows.length; i++) {
      arr.push(rows[i]);
    }
    return arr;
  })(tbody.rows);

  //日付と距離は強制的に昇順
  rowArr
    // .sort((a, b) => distanceCompare(a, b))
    .sort((a, b) => -stringCompare(a, b, 1))
    .sort((a, b) => sortType * comparere(a, b, colnum));
  rowArr.forEach((row) => {
    tbody.appendChild(row);
  });
}

function getText(row, colNum) {
  return row.querySelector(tdNth(colNum)).innerHTML;
}
function stringCompare(a, b, colnum) {
  return getText(b, colnum).localeCompare(getText(a, colnum));
}
function distanceCompare(a, b) {
  let adistance = getText(a, 3);
  let bdistance = getText(b, 3);
  const isAint = Number.isInteger(parseInt(adistance));
  const isBint = Number.isInteger(parseInt(bdistance));
  if (!isAint && !isBint) {
    return adistance.localeCompare(bdistance);
  }

  if (!isAint) {
    adistance = 10000;
  }
  if (!isBint) {
    bdistance = 10000;
  }
  return adistance - bdistance;
}

function setCheckAll(selector, name) {
  document.querySelector(selector).addEventListener('change', function () {
    const checked = this.checked;
    document.querySelectorAll(`[name=${name}]`).forEach((elem) => {
      elem.checked = checked;
    });
  });
}

(() => {
  loadCalendar();

  // event
  document.querySelector('#scrollToTop').addEventListener('click', () => {
    window.scroll({ top: 0, behavior: 'smooth' });
  });

  document
    .querySelectorAll('#event-table > thead > tr > th')
    .forEach((elem, ind) => {
      const button = elem.querySelector('button');
      if (button) {
        button.addEventListener('click', function () {
          if (ind == 2) {
            tableSort(distanceCompare, this.dataset['sort']);
          } else {
            tableSort(stringCompare, this.dataset['sort'], ind + 1);
          }
        });
      }
    });
  document
    .querySelectorAll('#event-table > thead th button')
    .forEach((button) => {
      button.addEventListener('click', function () {
        this.dataset['sort'] = this.dataset['sort'] * -1;
      });
    });

  CLUBS.forEach((club) => {
    const tmp = document.importNode(
      document.querySelector('#filter-item').content,
      true
    );
    tmp.querySelector('label span').innerText = club;
    tmp.querySelector('input').value = club;
    tmp.querySelector('input').name = 'clubs';
    document.querySelector('#club-items').append(tmp);
  });
  setCheckAll('#select-all-club', 'clubs');

  DISTANCES.forEach((distance) => {
    const tmp = document.importNode(
      document.querySelector('#filter-item').content,
      true
    );
    tmp.querySelector('label span').innerText = distance;
    tmp.querySelector('input').value = distance;
    tmp.querySelector('input').name = 'distance';
    document.querySelector('#distance-items').append(tmp);
  });
  setCheckAll('#select-all-distance', 'distance');

  for (let i = 0; i < 12; i++) {
    const tmp = document.importNode(
      document.querySelector('#filter-item').content,
      true
    );
    const month = 11 + i - (i < 2 ? 0 : 12);
    tmp.querySelector('label span').innerText = month;
    tmp.querySelector('input').value = month;
    tmp.querySelector('input').name = 'month';
    document.querySelector('#month-items').append(tmp);
  }
  setCheckAll('#select-all-month', 'month');

  document.querySelector('#filter-button').addEventListener('click', () => {
    function getChecked(name, isInt = false) {
      const arr = [];
      document.querySelectorAll(`[name=${name}]:checked`).forEach((elem) => {
        arr.push(isInt ? parseInt(elem.value) : elem.value);
      });
      return arr;
    }
    const shownClub = getChecked('clubs');
    const shownDistance = getChecked('distance');
    const shownMonth = getChecked('month', true);

    document.querySelectorAll('#event-table > tbody > tr').forEach((row) => {
      const isShow =
        shownClub.includes(row.querySelector(tdNth(2)).innerText) &&
        shownDistance.includes(row.querySelector(tdNth(3)).innerText) &&
        shownMonth.includes(
          parseInt(row.querySelector(tdNth(1)).innerText.split('-')[1])
        );
      row.style.display = isShow ? 'table-row' : 'none';
    });
  });
})();
