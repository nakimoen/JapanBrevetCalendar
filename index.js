const THIS_MONTH = (() => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
})();
const YEAR_OF_BREVET = 2023;
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
    const bodyRow = loadedTable.querySelectorAll(
      'tbody > tr:not(:first-child)'
    );
    bodyRow.forEach((row) => {
      // TODO: use template tag
      for (const attribute of row.attributes) {
        row.removeAttribute(attribute.name);
        const numbercell = row.querySelector('th');

        row.removeChild(numbercell);

        row.querySelector(tdNth(1)).setAttribute('rowspan', '2');

        const distanceCell = row.querySelector('td:nth-child(3)');
        const distance = ((distance) => {
          if (Number.isInteger(parseInt(distance))) {
            return distance > 600 ? 'rm' : distance;
          } else {
            return 'others';
          }
        })(distanceCell.innerHTML);

        distanceCell.classList.add('distance-' + distance);

        // row.classList.add('distance-' + distance);

        const club = row.querySelector(tdNth(2)).innerHTML;
        if (!CLUBS.includes(club)) {
          CLUBS.push(club);
        }

        const cityCell = row.querySelector(tdNth(4));
        cityCell.dataset.sort = window.CityYomiMap[cityCell.innerText];

        const titleRow = document.createElement('tr');
        const titleCell = row.querySelector(tdNth(5));
        titleCell.setAttribute('colspan', 3);
        const title = titleCell.innerText;
        titleCell.innerHTML = `<a href="https://www.google.com/search?q=${title}" target="_blank">${title}</a>`;
        // titleRow.classList.add('distance-' + distance);

        titleRow.appendChild(titleCell);

        document.querySelector('#event-table > tbody').appendChild(row);
        document.querySelector('#event-table > tbody').appendChild(titleRow);
      }
    });
  };

  const caldoc = await getCalendar();
  if (!caldoc) {
    return;
  }
  const table = caldoc.querySelector('#sheets-viewport > div > div >table');
  addTrimedTable(table);
  document.querySelector('#filter-button').click();
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
      arr.push({ row1: rows[i], row2: rows[i].nextSibling });
    }
    return arr;
  })(tbody.querySelectorAll('tr:nth-child(odd)'));

  //日付と距離は強制的に昇順
  rowArr
    // .sort((a, b) => distanceCompare(a, b))
    .sort((a, b) => -stringCompare(a.row1, b.row1, 1))
    .sort((a, b) => sortType * comparere(a.row1, b.row1, colnum));
  rowArr.forEach((row) => {
    tbody.appendChild(row.row1);
    tbody.appendChild(row.row2);
  });
}

function getText(row, colNum) {
  const cell = row.querySelector(tdNth(colNum));
  if (cell.dataset.sort) {
    return cell.dataset.sort;
  }
  return cell.dataset.sort ? cell.dataset.sort : cell.innerText;
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
      sessionStorage.setItem(elem.id, checked);
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
    if (/--.*--/.test(club)) {
      // document
      //   .querySelector('#club-items')
      //   .insertAdjacentHTML('beforeend', `<div>${club}</div>`);
      return;
    }

    const tmp = document.importNode(
      document.querySelector('#filter-item').content,
      true
    );
    tmp.querySelector('label span').innerText = club;
    tmp.querySelector('input').value = club;
    tmp.querySelector('input').name = 'clubs';
    tmp.querySelector('input').id = 'club-' + club;
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
    tmp.querySelector('input').id = 'distance-' + distance;
    tmp
      .querySelector('label span')
      .classList.add(
        'distance-' +
          (Number.isInteger(distance) && distance > 600 ? 'rm' : distance)
      );
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
    tmp.querySelector('input').id = 'month-' + month;

    const date = (() => {
      const year = YEAR_OF_BREVET - (month < 11 ? 0 : 1);
      return new Date(`${year}-${month}-01`);
    })();
    if (date.getTime() < THIS_MONTH.getTime()) {
      tmp.querySelector('input').checked = false;
    }
    document.querySelector('#month-items').append(tmp);
  }
  setCheckAll('#select-all-month', 'month');

  const filterButton = document.querySelector('#filter-button');
  filterButton.addEventListener('click', () => {
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

    document
      .querySelectorAll('#event-table > tbody > tr:nth-child(odd)')
      .forEach((row) => {
        const isShow =
          shownClub.includes(row.querySelector(tdNth(2)).innerText) &&
          shownDistance.includes(row.querySelector(tdNth(3)).innerText) &&
          shownMonth.includes(
            parseInt(row.querySelector(tdNth(1)).innerText.split('-')[1])
          );

        const display = isShow ? 'table-row' : 'none';
        row.style.display = display;
        row.nextSibling.style.display = display;
      });
  });

  // save
  document.querySelectorAll('input[type=checkbox]').forEach((checkbox) => {
    checkbox.addEventListener('change', function () {
      sessionStorage.setItem(checkbox.id, checkbox.checked);
    });
  });

  // restore
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const elem = document.getElementById(key);
    if (elem) {
      elem.checked = sessionStorage.getItem(key) == 'true';
    }
  }
})();
