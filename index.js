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
(() => {
  loadCalendar();

  // event
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
})();