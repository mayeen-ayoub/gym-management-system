// This file provides a helper function used by all of the other classes to format and display DB info in table-form

const Table = require('cli-table');

// Uses the Table class from the cli-table package to visually display DB records in a table in the console
class TableDisplay {
  printResultsAsTable(result, headers = [], isDateModify = false, columnNames = []) {
    const table = new Table({
      head: headers,
    });

    result.rows.forEach(row => {
      let formattedRow = row;
      // If the table contains Date types, properly format the date values 
      // If a given Date column's value is NULL, display 'N/A' in its place
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
