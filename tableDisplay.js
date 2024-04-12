const Table = require('cli-table');

class TableDisplay {
  printResultsAsTable(result, headers = [], isDateModify = false, columnNames = []) {
    const table = new Table({
      head: headers,
    });

    result.rows.forEach(row => {
      let formattedRow = row;
      if (isDateModify) {
        columnNames.forEach(columnName => {
          formattedRow[columnName] = row[columnName] ? row[columnName].toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') : ('N/A');
        });
      }
      table.push(Object.values(formattedRow));
    });

    console.log(table.toString());
  }
}
module.exports = TableDisplay;
