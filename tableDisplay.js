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
          formattedRow[columnName] = row[columnName] ? row[columnName].toLocaleDateString('en-US') : ('N/A');
        });
      }
      table.push(Object.values(formattedRow));
    });

    console.log(table.toString());
  }
}
module.exports = TableDisplay;
